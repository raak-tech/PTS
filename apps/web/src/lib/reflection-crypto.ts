import { scrypt as nodeScrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(nodeScrypt);
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(secret: string, salt: Uint8Array) {
  const keyBuffer = await scryptAsync(encoder.encode(secret), salt, 32);
  return new Uint8Array(keyBuffer as Buffer);
}

export function createRandomSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bytesToBase64(salt);
}

export async function encryptReflection(reflection: string, secret: string, saltBase64: string) {
  const salt = base64ToBytes(saltBase64);
  const keyBytes = await deriveKey(secret, salt);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(reflection)
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    meta: JSON.stringify({
      scheme: 'scrypt-aes-gcm-v1',
      salt: saltBase64,
      iv: bytesToBase64(iv),
    }),
  };
}

export function decryptReflectionPayload(
  payload: { ciphertext: string; meta: string },
  secret: string
) {
  const parsed = JSON.parse(payload.meta) as { salt: string; iv: string };
  return { parsed, secret };
}

export function reflectionCiphertextSummary(ciphertext: string) {
  return ciphertext.length > 80 ? `${ciphertext.slice(0, 77)}...` : ciphertext;
}
