import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token, x-device-fingerprint, x-integrity-hash',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validar session token
    const sessionToken = req.headers.get('x-session-token');
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'NO_SESSION_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar sessão válida
    const { data: session, error: sessionError } = await supabase
      .from('license_sessions')
      .select('id, license_id, expires_at')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'INVALID_SESSION' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageData, fileName, mimeType } = await req.json();

    if (!imageData || !fileName) {
      return new Response(
        JSON.stringify({ error: 'MISSING_IMAGE_DATA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decodificar base64
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Gerar nome único
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const extension = fileName.split('.').pop() || 'png';
    const uniqueFileName = `${timestamp}-${randomId}.${extension}`;

    // Upload para o bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('extension-uploads')
      .upload(uniqueFileName, binaryData, {
        contentType: mimeType || 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('[UPLOAD] Error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'UPLOAD_FAILED', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar URL pública
    const { data: publicUrlData } = supabase.storage
      .from('extension-uploads')
      .getPublicUrl(uniqueFileName);

    console.log(`[UPLOAD] Success: ${uniqueFileName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrlData.publicUrl,
        fileName: uniqueFileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
