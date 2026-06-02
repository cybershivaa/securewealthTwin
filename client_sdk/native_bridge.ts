// React Native bridge TypeScript stubs for PQ primitives and secure storage

export type KeyPair = { publicKey: string; privateKey?: string };

const NativeSecure = {
  // PQ KEM
  generateKemKeypair: async (): Promise<KeyPair> => {
    throw new Error('Native module not implemented')
  },
  kemEncrypt: async (publicKeyB64: string): Promise<{ ciphertext_b64: string; shared_secret_b64: string }> => {
    throw new Error('Native module not implemented')
  },
  kemDecrypt: async (privateKeyB64: string, ciphertext_b64: string): Promise<string> => {
    throw new Error('Native module not implemented')
  },
  // PQ signatures
  generateSignKeypair: async (): Promise<KeyPair> => {
    throw new Error('Native module not implemented')
  },
  sign: async (privateKeyB64: string, message: string): Promise<string> => {
    throw new Error('Native module not implemented')
  },
  verify: async (publicKeyB64: string, message: string, signatureB64: string): Promise<boolean> => {
    throw new Error('Native module not implemented')
  },
  // Secure storage wrappers
  storePrivateKey: async (alias: string, privateKeyB64: string): Promise<void> => {
    throw new Error('Native module not implemented')
  },
  loadPrivateKey: async (alias: string): Promise<string | null> => {
    throw new Error('Native module not implemented')
  },
}

export default NativeSecure
