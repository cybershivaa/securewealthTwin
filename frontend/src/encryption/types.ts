export interface HandshakeResponse {
  session_id: string;
  server_nonce_b64: string;
  server_kyber_public_b64: string;
  server_dilithium_public_b64: string;
  server_signature_b64: string;
}

export interface SecureEnvelope {
  version: string;
  session_id: string;
  request_id: string;
  timestamp: string;
  nonce_b64: string;
  aad_b64: string;
  ciphertext_b64: string;
  signature_b64: string;
}

export interface SecureSession {
  sessionId: string;
  deviceId: string;
  clientNonceB64: string;
  serverNonceB64: string;
  sessionKeyB64: string;
  serverKyberPublicB64: string;
  serverDilithiumPublicB64: string;
  clientDilithiumPublicB64: string;
  expiresAt: string;
}

export interface ClientDilithiumKeyPair {
  publicKeyB64: string;
  privateKeyB64: string;
}
