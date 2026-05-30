import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'react-native-quick-crypto';
import { Buffer } from 'buffer';

export interface AesEnvelope {
  ivB64: string;
  ciphertextB64: string;
}

function canonicalize(input: unknown): string {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return JSON.stringify(input);
  }

  const entries = Object.entries(input as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    normalized[key] = value;
  }
  return JSON.stringify(normalized);
}

export function canonicalJsonBytes(input: unknown): Buffer {
  return Buffer.from(canonicalize(input), 'utf8');
}

export function randomB64(size = 32): string {
  return randomBytes(size).toString('base64');
}

export function sha256B64(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('base64');
}

export function deriveSessionKey(sharedSecretB64: string, saltB64: string, info = 'SecureWealth Twin session key'): string {
  const key = hkdfSync(
    'sha256',
    Buffer.from(sharedSecretB64, 'base64'),
    Buffer.from(saltB64, 'base64'),
    Buffer.from(info, 'utf8'),
    32,
  );
  return Buffer.from(key).toString('base64');
}

export function aes256GcmEncrypt(plaintext: Buffer, keyB64: string, aad?: Buffer): AesEnvelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(keyB64, 'base64'), iv);
  if (aad) {
    cipher.setAAD(aad);
  }
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  return {
    ivB64: iv.toString('base64'),
    ciphertextB64: ciphertext.toString('base64'),
  };
}

export function aes256GcmDecrypt(ciphertextB64: string, keyB64: string, ivB64: string, aad?: Buffer): Buffer {
  const raw = Buffer.from(ciphertextB64, 'base64');
  const ciphertext = raw.subarray(0, raw.length - 16);
  const authTag = raw.subarray(raw.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(keyB64, 'base64'), Buffer.from(ivB64, 'base64'));
  if (aad) {
    decipher.setAAD(aad);
  }
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function buildRequestAad(sessionId: string, requestId: string, timestamp: string, method: string, path: string): Buffer {
  return canonicalJsonBytes({
    session_id: sessionId,
    request_id: requestId,
    timestamp,
    method: method.toUpperCase(),
    path,
  });
}

export function buildEnvelopeSignatureInput(envelope: {
  version: string;
  session_id: string;
  request_id: string;
  timestamp: string;
  nonce_b64: string;
  aad_b64: string;
  ciphertext_b64: string;
}): Buffer {
  return canonicalJsonBytes(envelope);
}
