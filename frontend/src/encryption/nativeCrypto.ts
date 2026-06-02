import { NativeModules } from 'react-native';

type QuantumBridge = {
  generateDilithiumKeyPair(): Promise<{ publicKeyB64: string; privateKeyB64: string }>;
  kyberEncapsulate(publicKeyB64: string): Promise<{ ciphertextB64: string; sharedSecretB64: string }>;
  signDilithium(messageB64: string, privateKeyB64: string): Promise<string>;
  verifyDilithium(messageB64: string, signatureB64: string, publicKeyB64: string): Promise<boolean>;
};

const bridge = NativeModules.SecureQuantumCrypto as QuantumBridge | undefined;

function requireBridge(): QuantumBridge {
  if (!bridge) {
    throw new Error('SecureQuantumCrypto native module is not installed');
  }
  return bridge;
}

export async function generateDilithiumKeyPair() {
  return requireBridge().generateDilithiumKeyPair();
}

export async function kyberEncapsulate(publicKeyB64: string) {
  return requireBridge().kyberEncapsulate(publicKeyB64);
}

export async function signDilithium(messageB64: string, privateKeyB64: string) {
  return requireBridge().signDilithium(messageB64, privateKeyB64);
}

export async function verifyDilithium(messageB64: string, signatureB64: string, publicKeyB64: string) {
  return requireBridge().verifyDilithium(messageB64, signatureB64, publicKeyB64);
}
