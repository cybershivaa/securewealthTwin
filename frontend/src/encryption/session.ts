import { Buffer } from 'buffer';

import { deriveSessionKey, randomB64 } from './crypto';
import { generateDilithiumKeyPair, kyberEncapsulate, verifyDilithium } from './nativeCrypto';
import type { HandshakeResponse, SecureSession } from './types';
import { loadDeviceDilithiumKeyPair, loadSecureSession, storeDeviceDilithiumKeyPair, storeSecureSession } from '../secure-storage/keychain';

export interface SecureHandshakeRequest {
  client_nonce_b64: string;
  kem_ciphertext_b64: string;
  client_dilithium_public_b64: string;
  device_id: string;
}

export class SecureSessionManager {
  constructor(private readonly baseUrl: string, private readonly deviceId: string) {}

  async getActiveSession(): Promise<SecureSession | null> {
    return loadSecureSession();
  }

  async establishSession(): Promise<SecureSession> {
    const deviceKeyPair = await this.ensureDeviceDilithiumKeyPair();
    const publicKeyResponse = await fetch(`${this.baseUrl}/secure/public-keys`);
    if (!publicKeyResponse.ok) {
      throw new Error(`Secure key bootstrap failed: ${publicKeyResponse.status}`);
    }

    const bootstrap = (await publicKeyResponse.json()) as HandshakeResponse;
    const clientNonceB64 = randomB64(32);
    const kem = await kyberEncapsulate(bootstrap.server_kyber_public_b64);

    const handshakeResponse = await fetch(`${this.baseUrl}/secure/handshake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_nonce_b64: clientNonceB64,
        kem_ciphertext_b64: kem.ciphertextB64,
        client_dilithium_public_b64: deviceKeyPair.publicKeyB64,
        device_id: this.deviceId,
      } satisfies SecureHandshakeRequest),
    });

    if (!handshakeResponse.ok) {
      throw new Error(`Handshake rejected: ${handshakeResponse.status}`);
    }

    const handshake = (await handshakeResponse.json()) as HandshakeResponse;
    const responseSignaturePayload = Buffer.from(
      JSON.stringify({
        session_id: handshake.session_id,
        client_nonce_b64: clientNonceB64,
        server_nonce_b64: handshake.server_nonce_b64,
        device_id: this.deviceId,
      }, Object.keys({
        session_id: handshake.session_id,
        client_nonce_b64: clientNonceB64,
        server_nonce_b64: handshake.server_nonce_b64,
        device_id: this.deviceId,
      }).sort()),
      'utf8',
    );

    const verified = await verifyDilithium(
      responseSignaturePayload.toString('base64'),
      handshake.server_signature_b64,
      handshake.server_dilithium_public_b64,
    );

    if (!verified) {
      throw new Error('Server signature verification failed');
    }

    const sessionKeyB64 = deriveSessionKey(kem.sharedSecretB64, clientNonceB64);
    const session: SecureSession = {
      sessionId: handshake.session_id,
      deviceId: this.deviceId,
      clientNonceB64,
      serverNonceB64: handshake.server_nonce_b64,
      sessionKeyB64,
      serverKyberPublicB64: bootstrap.server_kyber_public_b64,
      serverDilithiumPublicB64: handshake.server_dilithium_public_b64,
      clientDilithiumPublicB64: deviceKeyPair.publicKeyB64,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    await storeSecureSession(session);
    return session;
  }

  private async ensureDeviceDilithiumKeyPair(): Promise<{ publicKeyB64: string; privateKeyB64: string }> {
    const existing = await loadDeviceDilithiumKeyPair();
    if (existing) {
      return existing;
    }

    const generated = await generateDilithiumKeyPair();
    await storeDeviceDilithiumKeyPair(generated);
    return generated;
  }
}
