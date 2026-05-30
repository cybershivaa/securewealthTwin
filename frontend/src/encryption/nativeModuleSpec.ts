export interface SecureQuantumCryptoSpec {
  generateDilithiumKeyPair(): Promise<{ publicKeyB64: string; privateKeyB64: string }>;
  kyberEncapsulate(publicKeyB64: string): Promise<{ ciphertextB64: string; sharedSecretB64: string }>;
  signDilithium(messageB64: string, privateKeyB64: string): Promise<string>;
  verifyDilithium(messageB64: string, signatureB64: string, publicKeyB64: string): Promise<boolean>;
}

export const SECURE_QUANTUM_CRYPTO_MODULE_NAME = 'SecureQuantumCrypto';
