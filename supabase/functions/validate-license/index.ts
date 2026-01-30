import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, logRequest, getClientIP, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Hash data using SHA-256
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate license key format: ZYRA-XXXX-XXXX-XXXX
function isValidLicenseFormat(key: string): boolean {
  const pattern = /^ZYRA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key.toUpperCase());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ valid: false, error: 'SERVER_ERROR', message: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const clientIP = getClientIP(req);

    // Rate limiting: 10 requests per minute per IP
    const rateLimit = await checkRateLimit(supabase, clientIP, 'validate-license');
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return rateLimitResponse(rateLimit.remaining, rateLimit.resetIn, corsHeaders);
    }

    // Log request for rate limiting
    await logRequest(supabase, clientIP, 'validate-license');

    const { license_key, device_fingerprint, device_name, device_info, customer_document, integrity_hash } = await req.json();

    // Integrity check - verify extension code hasn't been tampered
    // IMPORTANTE: A validação de integridade está DESABILITADA para desenvolvimento
    // 
    // COMO ADICIONAR HASH (quando quiser ativar em produção):
    // 1. Concatene popup.js + background.js + content.js da pasta extension-obfuscated
    // 2. Calcule o SHA-256 do conteúdo concatenado
    // 3. Adicione o hash abaixo
    const EXPECTED_INTEGRITY_HASHES: string[] = [
      // Desabilitado durante desenvolvimento - adicionar hash quando extensão estiver estável
    ];
    
    // If integrity hashes are configured and received, validate
    if (EXPECTED_INTEGRITY_HASHES.length > 0 && integrity_hash) {
      if (!EXPECTED_INTEGRITY_HASHES.includes(integrity_hash)) {
        console.warn(`Integrity check failed. Received: ${integrity_hash}, IP: ${clientIP}`);
        
        await supabase.from('license_logs').insert({
          license_key: license_key?.toUpperCase() || 'UNKNOWN',
          action: 'integrity_check_failed',
          ip_address: clientIP,
          device_fingerprint: device_fingerprint || null,
          metadata: { received_hash: integrity_hash }
        });
        
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'INTEGRITY_VIOLATION', 
            message: 'Extensão corrompida ou modificada. Reinstale a versão oficial.' 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate required fields
    if (!license_key) {
      return new Response(
        JSON.stringify({ valid: false, error: 'MISSING_LICENSE', message: 'Licença não fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upperLicenseKey = license_key.toUpperCase().trim();

    // Validate license format
    if (!isValidLicenseFormat(upperLicenseKey)) {
      return new Response(
        JSON.stringify({ valid: false, error: 'INVALID_FORMAT', message: 'Formato de licença inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find license in the licenses table
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*, transactions(customer_name)')
      .eq('license_key', upperLicenseKey)
      .maybeSingle();

    if (licenseError) {
      console.error('Error querying license:', licenseError);
      return new Response(
        JSON.stringify({ valid: false, error: 'SERVER_ERROR', message: 'Erro ao verificar licença' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // License not found - also check transactions table for legacy licenses
    if (!license) {
      const { data: txLicense } = await supabase
        .from('transactions')
        .select('id, license_key, access_granted, customer_document, customer_name')
        .eq('license_key', upperLicenseKey)
        .maybeSingle();

      if (!txLicense) {
        // Log failed attempt
        await supabase.from('license_logs').insert({
          license_key: upperLicenseKey,
          action: 'validation_failed',
          ip_address: clientIP,
          device_fingerprint: device_fingerprint || null,
          metadata: { reason: 'not_found' }
        });

        return new Response(
          JSON.stringify({ valid: false, error: 'LICENSE_NOT_FOUND', message: 'Licença não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Legacy license found in transactions - validate access_granted
      if (!txLicense.access_granted) {
        return new Response(
          JSON.stringify({ valid: false, error: 'LICENSE_INACTIVE', message: 'Licença inativa' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Optional: Validate customer document
      if (customer_document && txLicense.customer_document) {
        const cleanedInput = customer_document.replace(/\D/g, '');
        const cleanedStored = txLicense.customer_document.replace(/\D/g, '');
        if (cleanedInput !== cleanedStored) {
          await supabase.from('license_logs').insert({
            license_key: upperLicenseKey,
            action: 'validation_failed',
            ip_address: clientIP,
            device_fingerprint: device_fingerprint || null,
            metadata: { reason: 'document_mismatch' }
          });

          return new Response(
            JSON.stringify({ valid: false, error: 'DOCUMENT_MISMATCH', message: 'CPF não corresponde ao da compra' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Legacy license is valid - return with customer name
      return new Response(
        JSON.stringify({ 
          valid: true, 
          status: 'active', 
          legacy: true,
          customer_name: txLicense.customer_name || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check license status
    if (license.status !== 'active') {
      const errorMap: Record<string, { error: string; message: string }> = {
        'suspended': { error: 'LICENSE_SUSPENDED', message: 'Licença suspensa' },
        'revoked': { error: 'LICENSE_REVOKED', message: 'Licença revogada' },
      };

      const errorInfo = errorMap[license.status] || { error: 'LICENSE_INACTIVE', message: 'Licença inativa' };

      await supabase.from('license_logs').insert({
        license_id: license.id,
        license_key: upperLicenseKey,
        action: 'validation_failed',
        ip_address: clientIP,
        device_fingerprint: device_fingerprint || null,
        metadata: { reason: license.status }
      });

      return new Response(
        JSON.stringify({ valid: false, ...errorInfo }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optional: Validate customer document hash
    if (customer_document && license.customer_document_hash) {
      const inputHash = await hashData(customer_document.replace(/\D/g, ''));
      if (inputHash !== license.customer_document_hash) {
        await supabase.from('license_logs').insert({
          license_id: license.id,
          license_key: upperLicenseKey,
          action: 'validation_failed',
          ip_address: clientIP,
          device_fingerprint: device_fingerprint || null,
          metadata: { reason: 'document_mismatch' }
        });

        return new Response(
          JSON.stringify({ valid: false, error: 'DOCUMENT_MISMATCH', message: 'CPF não corresponde ao da compra' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Device management (if device_fingerprint provided)
    let devicesRemaining = license.max_devices;

    if (device_fingerprint) {
      // Check if device already exists
      const { data: existingDevice } = await supabase
        .from('license_devices')
        .select('id, is_active')
        .eq('license_id', license.id)
        .eq('device_fingerprint', device_fingerprint)
        .maybeSingle();

      if (existingDevice) {
        // Dispositivo já registrado - apenas atualizar last_seen
        if (!existingDevice.is_active) {
          // Dispositivo foi desativado - não permitir reativação
          await supabase.from('license_logs').insert({
            license_id: license.id,
            license_key: upperLicenseKey,
            action: 'reactivation_denied',
            ip_address: clientIP,
            device_fingerprint,
            metadata: { reason: 'device_deactivated' }
          });

          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'DEVICE_DEACTIVATED', 
              message: 'Este dispositivo foi desativado e não pode ser reativado'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('license_devices')
          .update({ last_seen_at: new Date().toISOString(), ip_address: clientIP })
          .eq('id', existingDevice.id);
      } else {
        // Novo dispositivo - verificar se já existe algum dispositivo registrado
        const { count: totalDevicesCount } = await supabase
          .from('license_devices')
          .select('*', { count: 'exact', head: true })
          .eq('license_id', license.id);

        const totalDevices = totalDevicesCount || 0;

        // Se já existe qualquer dispositivo (ativo ou não), bloquear novo registro
        if (totalDevices > 0) {
          await supabase.from('license_logs').insert({
            license_id: license.id,
            license_key: upperLicenseKey,
            action: 'new_device_blocked',
            ip_address: clientIP,
            device_fingerprint,
            metadata: { 
              reason: 'license_already_activated',
              existing_devices: totalDevices 
            }
          });

          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'LICENSE_ALREADY_ACTIVATED', 
              message: 'Esta licença já foi ativada em outro dispositivo e não pode ser usada novamente'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Primeiro dispositivo - registrar
        await supabase.from('license_devices').insert({
          license_id: license.id,
          device_fingerprint,
          device_name: device_name || null,
          ip_address: clientIP,
          device_info: device_info || {},
        });

        await supabase.from('license_logs').insert({
          license_id: license.id,
          license_key: upperLicenseKey,
          action: 'device_activated',
          ip_address: clientIP,
          device_fingerprint,
          metadata: { device_name, first_activation: true }
        });

        devicesRemaining = 0; // Sem dispositivos restantes após ativação
      }

      // Verificar se tem dispositivo registrado
      const { count: deviceCount } = await supabase
        .from('license_devices')
        .select('*', { count: 'exact', head: true })
        .eq('license_id', license.id)
        .eq('is_active', true);

      devicesRemaining = deviceCount && deviceCount > 0 ? 0 : 1;
    }

    // Update last_validated_at and activated_at if first validation
    const updateData: Record<string, any> = {
      last_validated_at: new Date().toISOString()
    };

    if (!license.activated_at) {
      updateData.activated_at = new Date().toISOString();
    }

    await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', license.id);

    // Log successful validation
    await supabase.from('license_logs').insert({
      license_id: license.id,
      license_key: upperLicenseKey,
      action: 'validated',
      ip_address: clientIP,
      device_fingerprint: device_fingerprint || null,
    });

    // Get customer name from linked transaction
    const customerName = license.transactions?.customer_name || null;

    return new Response(
      JSON.stringify({ 
        valid: true, 
        status: license.status,
        devices_remaining: devicesRemaining,
        devices_max: license.max_devices,
        customer_name: customerName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Validation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, error: 'SERVER_ERROR', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
