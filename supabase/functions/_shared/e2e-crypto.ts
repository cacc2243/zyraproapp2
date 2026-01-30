// === E2E ENCRYPTION UTILITIES ===
// Shared cryptographic utilities for full E2E encryption

// Generate ECDH key pair for Diffie-Hellman key exchange
export async function generateECDHKeyPair(): Promise<{
  publicKey: string;
  privateKey: CryptoKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );

  // Export public key as base64
  const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

  return {
    publicKey: publicKeyBase64,
    privateKey: keyPair.privateKey,
  };
}

// Import client's public key from base64
export async function importClientPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    "raw",
    publicKeyBuffer,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    false,
    []
  );
}

// Derive shared secret using ECDH
export async function deriveSharedKey(
  privateKey: CryptoKey,
  clientPublicKey: CryptoKey
): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: clientPublicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt data with AES-GCM
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data)
  );

  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    ciphertext: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

// Decrypt data with AES-GCM
export async function decryptData(
  iv: string,
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  const ivBytes = new Uint8Array(iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const dataBytes = new Uint8Array(ciphertext.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    dataBytes
  );

  return new TextDecoder().decode(decrypted);
}

// Store ephemeral keys for later retrieval (in-memory for edge function lifecycle)
const ephemeralKeys = new Map<string, { privateKey: CryptoKey; expiresAt: number }>();

export function storeEphemeralKey(nonce: string, privateKey: CryptoKey, ttlMs: number = 300000): void {
  ephemeralKeys.set(nonce, {
    privateKey,
    expiresAt: Date.now() + ttlMs,
  });
  
  // Cleanup expired keys
  for (const [key, value] of ephemeralKeys.entries()) {
    if (value.expiresAt < Date.now()) {
      ephemeralKeys.delete(key);
    }
  }
}

export function getEphemeralKey(nonce: string): CryptoKey | null {
  const entry = ephemeralKeys.get(nonce);
  if (!entry || entry.expiresAt < Date.now()) {
    ephemeralKeys.delete(nonce);
    return null;
  }
  return entry.privateKey;
}

export function deleteEphemeralKey(nonce: string): void {
  ephemeralKeys.delete(nonce);
}
