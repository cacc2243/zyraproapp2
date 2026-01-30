import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Listar todos os arquivos no bucket
    const { data: files, error: listError } = await supabase.storage
      .from('extension-uploads')
      .list();

    if (listError) {
      console.error('[CLEANUP] List error:', listError);
      return new Response(
        JSON.stringify({ error: 'LIST_FAILED', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!files || files.length === 0) {
      console.log('[CLEANUP] No files to clean');
      return new Response(
        JSON.stringify({ success: true, deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar arquivos com mais de 15 minutos
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const oldFiles = files.filter(file => {
      // O nome do arquivo começa com timestamp
      const timestamp = parseInt(file.name.split('-')[0]);
      if (isNaN(timestamp)) return false;
      return new Date(timestamp) < fifteenMinutesAgo;
    });

    if (oldFiles.length === 0) {
      console.log('[CLEANUP] No old files to clean');
      return new Response(
        JSON.stringify({ success: true, deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deletar arquivos antigos
    const filesToDelete = oldFiles.map(f => f.name);
    const { error: deleteError } = await supabase.storage
      .from('extension-uploads')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('[CLEANUP] Delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'DELETE_FAILED', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CLEANUP] Deleted ${filesToDelete.length} files`);

    return new Response(
      JSON.stringify({ success: true, deleted: filesToDelete.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CLEANUP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
