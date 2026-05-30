package com.securewealth

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SecureQuantumCryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SecureQuantumCrypto"
    }

    @ReactMethod
    fun generateKemKeypair(promise: Promise) {
        try {
            val res = SecureQuantumCrypto.nativeGenerateKemKeypair()
            promise.resolve(res)
        } catch (t: Throwable) {
            promise.reject("NATIVE_ERROR", t.message)
        }
    }

    @ReactMethod
    fun kemEncrypt(publicKeyB64: String, promise: Promise) {
        try {
            val res = SecureQuantumCrypto.nativeKemEncrypt(publicKeyB64)
            promise.resolve(res)
        } catch (t: Throwable) {
            promise.reject("NATIVE_ERROR", t.message)
        }
    }

    @ReactMethod
    fun kemDecrypt(privateKeyB64: String, ciphertextB64: String, promise: Promise) {
        try {
            val res = SecureQuantumCrypto.nativeKemDecrypt(privateKeyB64, ciphertextB64)
            promise.resolve(res)
        } catch (t: Throwable) {
            promise.reject("NATIVE_ERROR", t.message)
        }
    }

    @ReactMethod
    fun generateSignKeypair(promise: Promise) {
        try {
            val res = SecureQuantumCrypto.nativeGenerateSignKeypair()
            promise.resolve(res)
        } catch (t: Throwable) {
            promise.reject("NATIVE_ERROR", t.message)
        }
    }

    @ReactMethod
    fun sign(privateKeyB64: String, messageB64: String, promise: Promise) {
        try {
            val res = SecureQuantumCrypto.nativeSign(privateKeyB64, messageB64)
            promise.resolve(res)
        } catch (t: Throwable) {
            promise.reject("NATIVE_ERROR", t.message)
        }
    }

    @ReactMethod
    fun verify(publicKeyB64: String, messageB64: String, signatureB64: String, promise: Promise) {
        try {
            val ok = SecureQuantumCrypto.nativeVerify(publicKeyB64, messageB64, signatureB64)
            promise.resolve(ok)
        } catch (t: Throwable) {
            promise.reject("NATIVE_ERROR", t.message)
        }
    }

    @ReactMethod
    fun storeWrappedPrivateKey(alias: String, privateKeyB64: String, promise: Promise) {
        try {
            // wrap using keystore
            val wrapped = SecureQuantumCrypto.nativeWrapWithKeystore(alias, privateKeyB64)
            val file = reactContext.filesDir.resolve("$alias.key")
            file.writeBytes(android.util.Base64.decode(wrapped, android.util.Base64.NO_WRAP))
            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("STORE_ERROR", t.message)
        }
    }

    @ReactMethod
    fun loadWrappedPrivateKey(alias: String, promise: Promise) {
        try {
            val file = reactContext.filesDir.resolve("$alias.key")
            if (!file.exists()) {
                promise.resolve(null)
                return
            }
            val wrappedBytes = file.readBytes()
            val wrappedB64 = android.util.Base64.encodeToString(wrappedBytes, android.util.Base64.NO_WRAP)
            val plainB64 = SecureQuantumCrypto.nativeUnwrapWithKeystore(alias, wrappedB64)
            promise.resolve(plainB64)
        } catch (t: Throwable) {
            promise.reject("LOAD_ERROR", t.message)
        }
    }
}
