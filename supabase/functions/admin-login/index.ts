import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// HMAC-SHA256 implementation for JWT signing
async function createHmacSha256(key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, data);
}

// Base64URL encoding (JWT compliant)
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Secure JWT token generation with HMAC-SHA256 (1 hour expiration for better security)
async function generateSecureToken(username: string, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour (reduced from 24 hours)
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret).buffer as ArrayBuffer;
  const dataBytes = encoder.encode(dataToSign).buffer as ArrayBuffer;
  const signature = await createHmacSha256(secretKey, dataBytes);
  const encodedSignature = arrayBufferToBase64Url(signature);

  return `${dataToSign}.${encodedSignature}`;
}

// Verify JWT token with HMAC-SHA256
export async function verifySecureToken(token: string, secret: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret).buffer as ArrayBuffer;
    const dataBytes = encoder.encode(dataToVerify).buffer as ArrayBuffer;
    const expectedSignature = await createHmacSha256(secretKey, dataBytes);
    const expectedEncodedSignature = arrayBufferToBase64Url(expectedSignature);

    if (encodedSignature !== expectedEncodedSignature) {
      return { valid: false };
    }

    const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}

// Password strength validation
function isStrongPassword(password: string): boolean {
  // Minimum 12 characters, at least one uppercase, one lowercase, one number
  const minLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return minLength && hasUpper && hasLower && hasNumber;
}

// Legacy SHA-256 hash for backwards compatibility during migration
async function hashPasswordSha256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const JWT_SECRET = Deno.env.get('JWT_SECRET');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (!JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username e password são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check credentials
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash')
      .eq('username', username)
      .maybeSingle();

    if (error || !adminUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let isValidPassword = false;
    const storedHash = adminUser.password_hash;

    // Check if hash is bcrypt format (starts with $2a$, $2b$, or $2y$)
    if (storedHash.startsWith('$2')) {
      // Verify using bcrypt (bcryptjs is sync but returns boolean)
      isValidPassword = bcrypt.compareSync(password, storedHash);
    } else {
      // Legacy SHA-256 hash - verify and migrate to bcrypt
      const sha256Hash = await hashPasswordSha256(password);
      if (sha256Hash === storedHash) {
        isValidPassword = true;
        
        // Migrate to bcrypt hash (work factor 12)
        const newBcryptHash = bcrypt.hashSync(password, 12);
        await supabase
          .from('admin_users')
          .update({ password_hash: newBcryptHash })
          .eq('id', adminUser.id);
        
        console.log(`Migrated password hash to bcrypt for user: ${username}`);
      }
    }

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais inválidas' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure JWT token
    const token = await generateSecureToken(username, JWT_SECRET);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        username: adminUser.username
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
