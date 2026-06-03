package com.securewealth

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

object KeystoreHelper {
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val AES_MODE = "AES/GCM/NoPadding"

    fun ensureAesKey(alias: String) {
        val ks = KeyStore.getInstance(ANDROID_KEYSTORE)
        ks.load(null)
        if (!ks.containsAlias(alias)) {
            val kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
            val spec = KeyGenParameterSpec.Builder(
                alias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
            kg.init(spec)
            kg.generateKey()
        }
    }

    fun wrapWithKeystore(alias: String, plainB64: String): String {
        ensureAesKey(alias)
        val ks = KeyStore.getInstance(ANDROID_KEYSTORE)
        ks.load(null)
        val secretKeyEntry = ks.getEntry(alias, null) as KeyStore.SecretKeyEntry
        val secretKey = secretKeyEntry.secretKey

        val cipher = Cipher.getInstance(AES_MODE)
        val iv = ByteArray(12)
        SecureRandom().nextBytes(iv)
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec)
        val plain = Base64.decode(plainB64, Base64.NO_WRAP)
        val cipherText = cipher.doFinal(plain)

        // output: iv || ciphertext
        val out = ByteArray(iv.size + cipherText.size)
        System.arraycopy(iv, 0, out, 0, iv.size)
        System.arraycopy(cipherText, 0, out, iv.size, cipherText.size)
        return Base64.encodeToString(out, Base64.NO_WRAP)
    }

    fun unwrapWithKeystore(alias: String, wrappedB64: String): String? {
        val ks = KeyStore.getInstance(ANDROID_KEYSTORE)
        ks.load(null)
        if (!ks.containsAlias(alias)) return null
        val secretKeyEntry = ks.getEntry(alias, null) as KeyStore.SecretKeyEntry
        val secretKey = secretKeyEntry.secretKey

        val data = Base64.decode(wrappedB64, Base64.NO_WRAP)
        if (data.size < 12) return null
        val iv = data.copyOfRange(0, 12)
        val cipherText = data.copyOfRange(12, data.size)

        val cipher = Cipher.getInstance(AES_MODE)
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)
        val plain = cipher.doFinal(cipherText)
        return Base64.encodeToString(plain, Base64.NO_WRAP)
    }
}
