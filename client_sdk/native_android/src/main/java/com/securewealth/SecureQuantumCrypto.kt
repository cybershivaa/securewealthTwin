package com.securewealth

object SecureQuantumCrypto {
    init {
        try {
            System.loadLibrary("securequantum")
        } catch (t: Throwable) {
            // Library not available — native fallback will be unavailable
        }
    }

    external fun nativeGenerateKemKeypair(): String
    external fun nativeKemEncrypt(publicKeyB64: String): String
    external fun nativeKemDecrypt(privateKeyB64: String, ciphertextB64: String): String
    external fun nativeGenerateSignKeypair(): String
    external fun nativeSign(privateKeyB64: String, messageB64: String): String
    external fun nativeVerify(publicKeyB64: String, messageB64: String, signatureB64: String): Boolean
    external fun nativeWrapWithKeystore(alias: String, plainB64: String): String
    external fun nativeUnwrapWithKeystore(alias: String, wrappedB64: String): String
    external fun nativeAesGcmWrap(keyB64: String, plainB64: String): String
    external fun nativeAesGcmUnwrap(keyB64: String, wrappedB64: String): String
}
