#include <jni.h>
#include <string>

// Placeholder JNI wrapper functions. Replace with calls into your PQ C library.
// These functions return JSON strings or base64-encoded values as needed.

extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeGenerateKemKeypair(JNIEnv* env, jobject /* this */) {
    extern char *oqs_generate_kem_keypair_json(void);
    char *res = oqs_generate_kem_keypair_json();
    if (!res) {
        const char *empty = "{\"public\":\"\",\"private\":\"\"}";
        return env->NewStringUTF(empty);
    }
    jstring out = env->NewStringUTF(res);
    free(res);
    return out;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeKemEncrypt(JNIEnv* env, jobject /* this */, jstring publicKeyB64) {
    const char* pk = env->GetStringUTFChars(publicKeyB64, 0);
    extern char *oqs_kem_encapsulate_json(const char *public_b64);
    char *res = oqs_kem_encapsulate_json(pk);
    env->ReleaseStringUTFChars(publicKeyB64, pk);
    if (!res) {
        const char *empty = "{\"ciphertext_b64\":\"\",\"shared_secret_b64\":\"\"}";
        return env->NewStringUTF(empty);
    }
    jstring out = env->NewStringUTF(res);
    free(res);
    return out;
}

// For decapsulation, reuse oqs_kem_encapsulate_json or implement a separate API as needed.
// Use oqs_kem_decapsulate_b64 to decapsulate and return shared secret base64
extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeKemDecrypt(JNIEnv* env, jobject /* this */, jstring privateKeyB64, jstring ciphertextB64) {
    const char* sk = env->GetStringUTFChars(privateKeyB64, 0);
    const char* ct = env->GetStringUTFChars(ciphertextB64, 0);
    extern char *oqs_kem_decapsulate_b64(const char *private_b64, const char *ciphertext_b64);
    char *res = oqs_kem_decapsulate_b64(sk, ct);
    env->ReleaseStringUTFChars(privateKeyB64, sk);
    env->ReleaseStringUTFChars(ciphertextB64, ct);
    if (!res) {
        const char *empty = "";
        return env->NewStringUTF(empty);
    }
    jstring out = env->NewStringUTF(res);
    free(res);
    return out;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeGenerateSignKeypair(JNIEnv* env, jobject /* this */) {
    extern char *oqs_generate_sig_keypair_json(void);
    char *res = oqs_generate_sig_keypair_json();
    if (!res) {
        const char *empty = "{\"public\":\"\",\"private\":\"\"}";
        return env->NewStringUTF(empty);
    }
    jstring out = env->NewStringUTF(res);
    free(res);
    return out;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeSign(JNIEnv* env, jobject /* this */, jstring privateKeyB64, jstring messageB64) {
    const char* sk = env->GetStringUTFChars(privateKeyB64, 0);
    const char* msg = env->GetStringUTFChars(messageB64, 0);
    extern char *oqs_sign_b64(const char *private_b64, const char *message_b64);
    char *res = oqs_sign_b64(sk, msg);
    env->ReleaseStringUTFChars(privateKeyB64, sk);
    env->ReleaseStringUTFChars(messageB64, msg);
    if (!res) {
        const char *empty = "";
        return env->NewStringUTF(empty);
    }
    jstring out = env->NewStringUTF(res);
    free(res);
    return out;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeVerify(JNIEnv* env, jobject /* this */, jstring publicKeyB64, jstring messageB64, jstring signatureB64) {
    const char* pk = env->GetStringUTFChars(publicKeyB64, 0);
    const char* msg = env->GetStringUTFChars(messageB64, 0);
    const char* sig = env->GetStringUTFChars(signatureB64, 0);
    extern int oqs_verify_b64(const char *public_b64, const char *message_b64, const char *signature_b64);
    int ok = oqs_verify_b64(pk, msg, sig);
    env->ReleaseStringUTFChars(publicKeyB64, pk);
    env->ReleaseStringUTFChars(messageB64, msg);
    env->ReleaseStringUTFChars(signatureB64, sig);
    return ok ? JNI_TRUE : JNI_FALSE;
}

// Keystore wrap/unwrap via calling Kotlin KeystoreHelper.INSTANCE
extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeWrapWithKeystore(JNIEnv* env, jobject /* this */, jstring alias, jstring plainB64) {
    const char* alias_c = env->GetStringUTFChars(alias, 0);
    const char* plain_c = env->GetStringUTFChars(plainB64, 0);
    jstring result = NULL;
    jclass ksClass = env->FindClass("com/securewealth/KeystoreHelper");
    if (ksClass) {
        jfieldID instF = env->GetStaticFieldID(ksClass, "INSTANCE", "Lcom/securewealth/KeystoreHelper;");
        if (instF) {
            jobject inst = env->GetStaticObjectField(ksClass, instF);
            jmethodID wrapM = env->GetMethodID(ksClass, "wrapWithKeystore", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;");
            if (wrapM && inst) {
                jstring a = env->NewStringUTF(alias_c);
                jstring p = env->NewStringUTF(plain_c);
                jobject out = env->CallObjectMethod(inst, wrapM, a, p);
                result = (jstring)out;
                env->DeleteLocalRef(a);
                env->DeleteLocalRef(p);
            }
        }
    }
    env->ReleaseStringUTFChars(alias, alias_c);
    env->ReleaseStringUTFChars(plainB64, plain_c);
    if (!result) {
        const char *empty = "";
        return env->NewStringUTF(empty);
    }
    return result;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeUnwrapWithKeystore(JNIEnv* env, jobject /* this */, jstring alias, jstring wrappedB64) {
    const char* alias_c = env->GetStringUTFChars(alias, 0);
    const char* wrapped_c = env->GetStringUTFChars(wrappedB64, 0);
    jstring result = NULL;
    jclass ksClass = env->FindClass("com/securewealth/KeystoreHelper");
    if (ksClass) {
        jfieldID instF = env->GetStaticFieldID(ksClass, "INSTANCE", "Lcom/securewealth/KeystoreHelper;");
        if (instF) {
            jobject inst = env->GetStaticObjectField(ksClass, instF);
            jmethodID unwrapM = env->GetMethodID(ksClass, "unwrapWithKeystore", "(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;");
            if (unwrapM && inst) {
                jstring a = env->NewStringUTF(alias_c);
                jstring w = env->NewStringUTF(wrapped_c);
                jobject out = env->CallObjectMethod(inst, unwrapM, a, w);
                result = (jstring)out;
                env->DeleteLocalRef(a);
                env->DeleteLocalRef(w);
            }
        }
    }
    env->ReleaseStringUTFChars(alias, alias_c);
    env->ReleaseStringUTFChars(wrappedB64, wrapped_c);
    if (!result) {
        const char *empty = "";
        return env->NewStringUTF(empty);
    }
    return result;
}

// Native C AES-GCM wrap/unwrap (requires OpenSSL at build time)
extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeAesGcmWrap(JNIEnv* env, jobject /* this */, jstring keyB64, jstring plainB64) {
    const char* key = env->GetStringUTFChars(keyB64, 0);
    const char* plain = env->GetStringUTFChars(plainB64, 0);
    extern char *oqs_aes_gcm_wrap_b64(const char *key_b64, const char *plain_b64);
    char *res = oqs_aes_gcm_wrap_b64(key, plain);
    env->ReleaseStringUTFChars(keyB64, key);
    env->ReleaseStringUTFChars(plainB64, plain);
    if (!res) {
        const char *empty = "";
        return env->NewStringUTF(empty);
    }
    jstring out = env->NewStringUTF(res);
    free(res);
    return out;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_securewealth_SecureQuantumCrypto_nativeAesGcmUnwrap(JNIEnv* env, jobject /* this */, jstring keyB64, jstring wrappedB64) {
    const char* key = env->GetStringUTFChars(keyB64, 0);
    const char* wrapped = env->GetStringUTFChars(wrappedB64, 0);
    extern char *oqs_aes_gcm_unwrap_b64(const char *key_b64, const char *wrapped_b64);
    char *res = oqs_aes_gcm_unwrap_b64(key, wrapped);
    env->ReleaseStringUTFChars(keyB64, key);
    env->ReleaseStringUTFChars(wrappedB64, wrapped);
    if (!res) {
        const char *empty = "";
        return env->NewStringUTF(empty);
    }
    jstring out = env->NewStringUTF(res);
    free(res);
    return out;
}
