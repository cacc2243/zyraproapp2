// ============================================
// LOVABLE PROXY - VERSÃO SIMPLES
// ============================================
// Aceita license_key diretamente no body
// Sem E2E encryption, sem session tokens complexos

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Generate message ID
function generateMessageId(prefix: string): string {
  const chars = "0123456789abcdefghjkmnpqrstvwxyz";
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  let timePart = "";
  let t = timestamp;
  for (let i = 0; i < 10; i++) {
    timePart = chars[t % 32] + timePart;
    t = Math.floor(t / 32);
  }

  let randomPart = "";
  for (let i = 0; i < 16; i++) {
    randomPart += chars[randomBytes[i] % 32];
  }

  return `${prefix}_${timePart}${randomPart}`;
}

// Validate license directly
async function validateLicense(
  supabase: any,
  licenseKey: string,
  deviceFingerprint: string
): Promise<{ valid: boolean; licenseId?: string; error?: string }> {
  
  // Find license
  const { data: license, error } = await supabase
    .from("licenses")
    .select("id, status, max_devices")
    .eq("license_key", licenseKey.toUpperCase())
    .maybeSingle();

  if (error || !license) {
    // Try transactions table for legacy licenses
    const { data: txLicense } = await supabase
      .from("transactions")
      .select("id, license_key, access_granted")
      .eq("license_key", licenseKey.toUpperCase())
      .maybeSingle();

    if (txLicense && txLicense.access_granted) {
      return { valid: true, licenseId: txLicense.id };
    }

    return { valid: false, error: "LICENSE_NOT_FOUND" };
  }

  if (license.status !== "active") {
    return { valid: false, error: "LICENSE_INACTIVE" };
  }

  // Check device
  if (deviceFingerprint) {
    const { data: device } = await supabase
      .from("license_devices")
      .select("id, is_active")
      .eq("license_id", license.id)
      .eq("device_fingerprint", deviceFingerprint)
      .maybeSingle();

    if (device && !device.is_active) {
      return { valid: false, error: "DEVICE_DEACTIVATED" };
    }

    // Update last seen
    if (device) {
      await supabase
        .from("license_devices")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", device.id);
    }
  }

  return { valid: true, licenseId: license.id };
}

// Upload image to storage
async function uploadImageToStorage(
  supabase: any,
  imageData: string,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const timestamp = Date.now();
    const randomId = crypto.getRandomValues(new Uint8Array(4))
      .reduce((acc, v) => acc + v.toString(16).padStart(2, '0'), '');
    const extension = fileName.split('.').pop() || 'png';
    const uniqueFileName = `${timestamp}-${randomId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('extension-uploads')
      .upload(uniqueFileName, binaryData, {
        contentType: mimeType || 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('[PROXY] Image upload error:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('extension-uploads')
      .getPublicUrl(uniqueFileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[PROXY] Image upload failed:', error);
    return null;
  }
}

// Fetch with retry
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 2,
  timeout: number = 15000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

// Proxy to Lovable API
async function proxyToLovable(
  userToken: string,
  projectId: string,
  message: string,
  files: unknown[] = [],
  supabase?: any
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const poolToken = Deno.env.get("POOL_AUTH_TOKEN");
  
  // Try pool token first, then fallback to user token
  const tokensToTry = [
    ...(poolToken ? [{ token: poolToken, label: "pool" }] : []),
    ...(userToken && userToken !== "validate-only" ? [{ token: userToken, label: "user" }] : []),
  ];
  
  if (tokensToTry.length === 0) {
    console.log("[PROXY] No valid tokens available");
    return { success: false, error: "NO_TOKEN" };
  }
  
  console.log("[PROXY] Tokens available:", tokensToTry.map(t => t.label).join(", "), "| Project:", projectId);

  const messageId = generateMessageId("umsg");
  const aiMessageId = generateMessageId("aimsg");

  // Process image files
  let processedFiles: unknown[] = [];
  if (files && files.length > 0 && supabase) {
    for (const file of files as any[]) {
      if (file.data && file.data.startsWith('data:image')) {
        const imageUrl = await uploadImageToStorage(
          supabase,
          file.data,
          file.name || 'image.png',
          file.type || 'image/png'
        );
        if (imageUrl) {
          processedFiles.push({
            type: 'image',
            url: imageUrl,
            name: file.name || 'image.png'
          });
        }
      } else if (file.url) {
        processedFiles.push(file);
      }
    }
  }

  // Try each token
  for (const tokenInfo of tokensToTry) {
    console.log(`[PROXY] Trying ${tokenInfo.label} token...`);
    
    const prioritizedCombinations = [
      {
        name: "E2+P1",
        url: `https://api.lovable.dev/projects/${projectId}/chat`,
        payload: { projectId, message, attachment: null },
      },
      {
        name: "E2+P5",
        url: `https://api.lovable.dev/projects/${projectId}/chat`,
        payload: {
          id: messageId,
          message,
          files: processedFiles.length > 0 ? processedFiles : (files || []),
          selected_elements: [],
          debug_mode: false,
          view: "preview",
          ai_message_id: aiMessageId,
          current_page: "/",
          model: null,
          integration_metadata: { browser: { preview_viewport_width: 1920, preview_viewport_height: 1080 } },
        },
      },
      {
        name: "E1+P1",
        url: `https://api.lovable.dev/api/projects/${projectId}/chat`,
        payload: { projectId, message, attachment: null },
      },
      {
        name: "E1+P5",
        url: `https://api.lovable.dev/api/projects/${projectId}/chat`,
        payload: {
          id: messageId,
          message,
          files: processedFiles.length > 0 ? processedFiles : (files || []),
          selected_elements: [],
          debug_mode: false,
          view: "preview",
          ai_message_id: aiMessageId,
          current_page: "/",
          model: null,
          integration_metadata: { browser: { preview_viewport_width: 1920, preview_viewport_height: 1080 } },
        },
      },
    ];

    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokenInfo.token}`,
      "Content-Type": "application/json",
      "X-Client-Git-SHA": "69f7df6f219339f148ee84d4a85a4937da7895f4",
    };

    let tokenFailed = false;
    
    for (const combo of prioritizedCombinations) {
      try {
        console.log(`[PROXY] [${tokenInfo.label}] Trying ${combo.name}`);

        const response = await fetchWithRetry(
          combo.url,
          {
            method: "POST",
            headers,
            body: JSON.stringify(combo.payload),
          },
          2,
          15000
        );

        const responseText = await response.text();

        if (response.ok || response.status === 202) {
          console.log(`[PROXY] ✅ SUCCESS with ${tokenInfo.label} token + ${combo.name}`, response.status);
          return {
            success: true,
            data: {
              endpoint: combo.url,
              combination: combo.name,
              tokenType: tokenInfo.label,
              status: response.status,
              messageId,
              aiMessageId,
            },
          };
        }

        console.log(`[PROXY] ❌ Failed ${combo.name}: ${response.status}`);
        
        // If token is invalid, skip remaining combinations for this token
        if (response.status === 401 || response.status === 403) {
          console.log(`[PROXY] Token ${tokenInfo.label} is invalid, trying next token...`);
          tokenFailed = true;
          break;
        }

      } catch (error) {
        console.log(`[PROXY] ❌ Error ${combo.name}:`, error);
      }

      await new Promise(r => setTimeout(r, 50));
    }
    
    // If token didn't fail due to auth, don't try other tokens
    if (!tokenFailed) {
      break;
    }
  }

  return { success: false, error: "ALL_ENDPOINTS_FAILED" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { license_key, device_fingerprint, integrity_hash, token, projectId, message, files } = body;

    // Validate required fields
    if (!license_key || !device_fingerprint) {
      return new Response(
        JSON.stringify({ success: false, error: "MISSING_CREDENTIALS" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!token || !projectId || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "MISSING_PARAMETERS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate license
    const licenseResult = await validateLicense(supabase, license_key, device_fingerprint);

    if (!licenseResult.valid) {
      console.log("[PROXY] License validation failed:", licenseResult.error);
      return new Response(
        JSON.stringify({ success: false, error: licenseResult.error }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Proxy to Lovable
    const proxyResult = await proxyToLovable(token, projectId, message, files || [], supabase);

    // Log (fire and forget)
    try {
      await supabase.from("extension_logs").insert({
        license_key: license_key.toUpperCase(),
        log_type: proxyResult.success ? "success" : "error",
        message: proxyResult.success 
          ? `Proxy success: ${(proxyResult.data as any)?.combination || 'unknown'}` 
          : `Proxy failed: ${proxyResult.error}`,
        metadata: {
          projectId,
          combination: (proxyResult.data as any)?.combination,
        },
        device_fingerprint,
      });
    } catch {
      // Ignore logging errors
    }

    return new Response(JSON.stringify(proxyResult), {
      status: proxyResult.success ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PROXY] Server error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "SERVER_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
