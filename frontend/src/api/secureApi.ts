import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { Buffer } from 'buffer';
import { randomBytes } from 'react-native-quick-crypto';

import { aes256GcmDecrypt, aes256GcmEncrypt, buildEnvelopeSignatureInput, buildRequestAad } from '../encryption/crypto';
import { signDilithium, verifyDilithium } from '../encryption/nativeCrypto';
import type { SecureEnvelope, SecureSession } from '../encryption/types';
import { loadAccessToken, loadDeviceDilithiumKeyPair, loadSecureSession, storeAccessToken } from '../secure-storage/keychain';
import { assertPinnedHost } from '../security/certificatePinning';

function isEnvelope(value: unknown): value is SecureEnvelope {
  return Boolean(value && typeof value === 'object' && 'ciphertext_b64' in value && 'signature_b64' in value);
}

function generateRequestId(): string {
  return Buffer.from(randomBytes(16)).toString('hex');
}

export class SecureApiClient {
  private readonly client: AxiosInstance;

  constructor(private readonly baseURL: string) {
    assertPinnedHost(new URL(baseURL).hostname);
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (config) => this.encryptRequest(config));
    this.client.interceptors.response.use(async (response) => this.decryptResponse(response), async (error) => Promise.reject(await this.normalizeError(error)));
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(path, config);
    return response.data;
  }

  async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(path, data, config);
    return response.data;
  }

  private async encryptRequest(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    const session = await loadSecureSession();
    if (!session || this.isPlainEndpoint(config.url)) {
      const token = await loadAccessToken();
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
      return config;
    }

    const requestId = generateRequestId();
    const timestamp = new Date().toISOString();
    const method = (config.method ?? 'GET').toUpperCase();
    const path = config.url ?? '/';
    const aad = buildRequestAad(session.sessionId, requestId, timestamp, method, path);
    const plaintext = Buffer.from(JSON.stringify(config.data ?? {}), 'utf8');
    const encrypted = aes256GcmEncrypt(plaintext, session.sessionKeyB64, aad);

    const envelopeBase = {
      version: '1',
      session_id: session.sessionId,
      request_id: requestId,
      timestamp,
      nonce_b64: encrypted.ivB64,
      aad_b64: aad.toString('base64'),
      ciphertext_b64: encrypted.ciphertextB64,
    };
    const privateKeyPair = await loadDeviceDilithiumKeyPair();
    if (!privateKeyPair) {
      throw new Error('Device Dilithium key pair is missing');
    }

    const signature = await signDilithium(buildEnvelopeSignatureInput(envelopeBase).toString('base64'), privateKeyPair.privateKeyB64);
    const envelope: SecureEnvelope = { ...envelopeBase, signature_b64: signature };

    config.data = envelope;
    config.headers = { ...config.headers, 'X-Encrypted-Transport': '1' };

    return config;
  }

  private async decryptResponse(response: AxiosResponse): Promise<AxiosResponse> {
    const data = response.data;
    if (!isEnvelope(data)) {
      return response;
    }

    const session = await loadSecureSession();
    if (!session) {
      throw new Error('Missing secure session for encrypted response');
    }

    const payload = buildEnvelopeSignatureInput({
      version: data.version,
      session_id: data.session_id,
      request_id: data.request_id,
      timestamp: data.timestamp,
      nonce_b64: data.nonce_b64,
      aad_b64: data.aad_b64,
      ciphertext_b64: data.ciphertext_b64,
    });
    const isValid = await verifyDilithium(payload.toString('base64'), data.signature_b64, session.serverDilithiumPublicB64);
    if (!isValid) {
      throw new Error('Response signature verification failed');
    }

    const plaintext = aes256GcmDecrypt(data.ciphertext_b64, session.sessionKeyB64, data.nonce_b64, Buffer.from(data.aad_b64, 'base64'));
    response.data = JSON.parse(plaintext.toString('utf8'));
    return response;
  }

  private async normalizeError(error: AxiosError): Promise<Error> {
    if (error.response?.data && isEnvelope(error.response.data)) {
      return new Error('Encrypted API request rejected');
    }
    return new Error(error.message);
  }

  private isPlainEndpoint(url?: string): boolean {
    if (!url) {
      return true;
    }
    return ['/secure/public-keys', '/secure/handshake', '/health'].some((path) => url.includes(path));
  }
}

export async function persistAccessToken(token: string): Promise<void> {
  await storeAccessToken(token);
}
