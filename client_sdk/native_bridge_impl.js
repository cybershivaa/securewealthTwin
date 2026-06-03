// Implementation that prefers native module if available, otherwise uses JS fallback
const { NativeModules, Platform } = require('react-native')
const NativeSecure = NativeModules.SecureQuantumCrypto || null
const fallback = require('../crypto_fallback')

async function generateKemKeypair() {
  if (NativeSecure && NativeSecure.generateKemKeypair) {
    return NativeSecure.generateKemKeypair()
  }
  // Fallback: indicate that PQ is not available
  throw new Error('Native PQ not available; use server handshake with JS fallback')
}

async function kemEncrypt(publicKeyB64) {
  if (NativeSecure && NativeSecure.kemEncrypt) {
    return NativeSecure.kemEncrypt(publicKeyB64)
  }
  throw new Error('Native PQ not available')
}

async function kemDecrypt(privateKeyB64, ciphertextB64) {
  if (NativeSecure && NativeSecure.kemDecrypt) {
    return NativeSecure.kemDecrypt(privateKeyB64, ciphertextB64)
  }
  throw new Error('Native PQ not available')
}

async function generateSignKeypair() {
  if (NativeSecure && NativeSecure.generateSignKeypair) {
    return NativeSecure.generateSignKeypair()
  }
  throw new Error('Native PQ not available')
}

async function sign(privateKeyB64, message) {
  if (NativeSecure && NativeSecure.sign) {
    return NativeSecure.sign(privateKeyB64, message)
  }
  throw new Error('Native PQ not available')
}

async function verify(publicKeyB64, message, signatureB64) {
  if (NativeSecure && NativeSecure.verify) {
    return NativeSecure.verify(publicKeyB64, message, signatureB64)
  }
  throw new Error('Native PQ not available')
}

module.exports = {
  generateKemKeypair,
  kemEncrypt,
  kemDecrypt,
  generateSignKeypair,
  sign,
  verify,
}
