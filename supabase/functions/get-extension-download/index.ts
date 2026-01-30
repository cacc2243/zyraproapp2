import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extension configurations - file paths in private storage bucket
const extensions: Record<string, { storagePath: string; password: string; fileName: string }> = {
  lovable: {
    storagePath: 'lovable/Zyra Pro 2026 V 8.1.zip',
    password: 'user006541153fw2dggdw2facw',
    fileName: 'Zyra_Pro_2026_V_8.1.zip'
  },
  // Future extensions can be added here
  // v0: { storagePath: 'v0/extension.zip', password: '...', fileName: 'v0-extension.zip' },
  // manus: { storagePath: 'manus/extension.zip', password: '...', fileName: 'manus-extension.zip' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { licenseKey, extensionId } = await req.json();

    if (!licenseKey || !extensionId) {
      return new Response(
        JSON.stringify({ error: 'License key and extension ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the license exists and is active
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('id, status')
      .eq('license_key', licenseKey)
      .single();

    if (licenseError || !license) {
      return new Response(
        JSON.stringify({ error: 'Invalid license key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (license.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'License is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Get extension configuration
    const extension = extensions[extensionId];

    if (!extension) {
      return new Response(
        JSON.stringify({ error: 'Extension not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a signed URL that expires in 10 minutes (600 seconds)
    // This creates a unique, temporary download link for each request
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('extensions')
      .createSignedUrl(extension.storagePath, 600, {
        download: extension.fileName // Forces download with proper filename
      });

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error generating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar link de download. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the download request
    await supabase.from('license_logs').insert({
      license_id: license.id,
      license_key: licenseKey,
      action: 'extension_download',
      metadata: { 
        extension_id: extensionId,
        signed_url_generated: true,
        expires_in_seconds: 600
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        downloadUrl: signedUrlData.signedUrl,
        extractPassword: extension.password,
        expiresIn: 600 // Tell frontend the link expires in 10 minutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
