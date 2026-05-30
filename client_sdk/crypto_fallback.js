// Minimal WebCrypto-based helpers for AES-GCM and HKDF (fallback only)
// Usage in browser/Node 18+ where Web Crypto is available.

const utf8 = new TextEncoder();
const dec = new TextDecoder();

async function hkdf(ikm, salt, info = new Uint8Array([]), length = 32) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8);
  return new Uint8Array(derived);
}

async function generateKey() {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function encrypt(plaintextBytes, keyBytes, aadBytes = null) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aadBytes }, key, plaintextBytes);
  return { iv: new Uint8Array(iv), ciphertext: new Uint8Array(ct) };
}

async function decrypt(iv, ciphertext, keyBytes, aadBytes = null) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aadBytes }, key, ciphertext);
  return new Uint8Array(pt);
}

module.exports = { hkdf, generateKey, encrypt, decrypt };
