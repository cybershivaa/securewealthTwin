#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef __has_include
# if __has_include(<oqs/oqs.h>)
#  include <oqs/oqs.h>
#  define HAVE_OQS 1
# else
#  define HAVE_OQS 0
# endif
#else
# define HAVE_OQS 0
#endif

#ifdef __has_include
# if __has_include(<openssl/evp.h>)
#  include <openssl/evp.h>
#  include <openssl/rand.h>
#  define HAVE_OPENSSL 1
# else
#  define HAVE_OPENSSL 0
# endif
#else
# define HAVE_OPENSSL 0
#endif

// Simple base64 encoder
static const char b64chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static char *b64_encode(const unsigned char *in, size_t len) {
    char *out;
    size_t elen = 4 * ((len + 2) / 3);
    out = malloc(elen + 1);
    if (!out) return NULL;
    char *p = out;
    for (size_t i = 0; i < len; i += 3) {
        int a = in[i];
        int b = (i + 1 < len) ? in[i+1] : 0;
        int c = (i + 2 < len) ? in[i+2] : 0;
        *p++ = b64chars[(a >> 2) & 0x3F];
        *p++ = b64chars[((a & 0x3) << 4) | ((b >> 4) & 0xF)];
        *p++ = (i + 1 < len) ? b64chars[((b & 0xF) << 2) | ((c >> 6) & 0x3)] : '=';
        *p++ = (i + 2 < len) ? b64chars[c & 0x3F] : '=';
    }
    *p = '\0';
    return out;
}

static unsigned char decode_table[256];

static void build_decode_table(void) {
    static int built = 0;
    if (built) return;
    for (int i = 0; i < 256; i++) decode_table[i] = 0x80;
    for (int i = 0; i < 64; i++) decode_table[(unsigned char)b64chars[i]] = i;
    decode_table['='] = 0;
    built = 1;
}

static unsigned char *b64_decode(const char *in, size_t len, size_t *out_len) {
    build_decode_table();
    if (!in) return NULL;
    size_t i = 0, o = 0;
    unsigned char *out = malloc((len * 3) / 4 + 4);
    if (!out) return NULL;
    unsigned char quad[4];
    while (i < len) {
        int q = 0;
        for (int k = 0; k < 4 && i < len; i++) {
            unsigned char c = (unsigned char)in[i];
            if (decode_table[c] == 0x80) continue; // skip invalid (whitespace)
            quad[k++] = decode_table[c];
            q = k;
        }
        if (q == 0) break;
        if (q >= 2) out[o++] = (quad[0] << 2) | (quad[1] >> 4);
        if (q >= 3) out[o++] = (quad[1] << 4) | (quad[2] >> 2);
        if (q >= 4) out[o++] = (quad[2] << 6) | quad[3];
    }
    *out_len = o;
    return out;
}

#if HAVE_OQS
#include <oqs/oqs.h>

char *oqs_generate_kem_keypair_json(void) {
    OQS_KEM *kem = NULL;
    char *result = NULL;
    kem = OQS_KEM_new(OQS_KEM_alg_kyber_768);
    if (!kem) return NULL;
    uint8_t *public_key = malloc(kem->length_public_key);
    uint8_t *private_key = malloc(kem->length_secret_key);
    if (!public_key || !private_key) goto cleanup;
    if (OQS_KEM_keypair(kem, public_key, private_key) != OQS_SUCCESS) goto cleanup;
    char *pub_b64 = b64_encode(public_key, kem->length_public_key);
    char *priv_b64 = b64_encode(private_key, kem->length_secret_key);
    size_t needed = strlen(pub_b64) + strlen(priv_b64) + 64;
    result = malloc(needed);
    if (result) snprintf(result, needed, "{\"public\":\"%s\",\"private\":\"%s\"}", pub_b64, priv_b64);
    free(pub_b64);
    free(priv_b64);
cleanup:
    if (public_key) free(public_key);
    if (private_key) free(private_key);
    if (kem) OQS_KEM_free(kem);
    return result;
}

char *oqs_kem_encapsulate_json(const char *public_b64) {
    OQS_KEM *kem = NULL;
    char *result = NULL;
    kem = OQS_KEM_new(OQS_KEM_alg_kyber_768);
    if (!kem) return NULL;
    // decode base64 public key
    size_t pk_len = kem->length_public_key;
    size_t decoded_len = 0;
    unsigned char *public_key = b64_decode(public_b64, strlen(public_b64), &decoded_len);
    if (!public_key || decoded_len != pk_len) goto cleanup;
    uint8_t *ciphertext = malloc(kem->length_ciphertext);
    uint8_t *shared_secret = malloc(kem->length_shared_secret);
    if (!ciphertext || !shared_secret) goto cleanup;
    if (OQS_KEM_encaps(kem, ciphertext, shared_secret, public_key) != OQS_SUCCESS) goto cleanup;
    char *ct_b64 = b64_encode(ciphertext, kem->length_ciphertext);
    char *ss_b64 = b64_encode(shared_secret, kem->length_shared_secret);
    size_t needed = strlen(ct_b64) + strlen(ss_b64) + 64;
    result = malloc(needed);
    if (result) snprintf(result, needed, "{\"ciphertext_b64\":\"%s\",\"shared_secret_b64\":\"%s\"}", ct_b64, ss_b64);
    free(ct_b64); free(ss_b64);
cleanup:
    if (public_key) free(public_key);
    if (ciphertext) free(ciphertext);
    if (shared_secret) free(shared_secret);
    if (kem) OQS_KEM_free(kem);
    return result;
}

char *oqs_kem_decapsulate_b64(const char *private_b64, const char *ciphertext_b64) {
    OQS_KEM *kem = NULL;
    char *result = NULL;
    kem = OQS_KEM_new(OQS_KEM_alg_kyber_768);
    if (!kem) return NULL;
    size_t sk_len = kem->length_secret_key;
    size_t ct_len = kem->length_ciphertext;
    size_t decoded_sk = 0, decoded_ct = 0;
    unsigned char *private_key = b64_decode(private_b64, strlen(private_b64), &decoded_sk);
    unsigned char *ciphertext = b64_decode(ciphertext_b64, strlen(ciphertext_b64), &decoded_ct);
    if (!private_key || !ciphertext) goto cleanup;
    if (decoded_sk != sk_len || decoded_ct != ct_len) goto cleanup;
    uint8_t *shared_secret = malloc(kem->length_shared_secret);
    if (!shared_secret) goto cleanup;
    if (OQS_KEM_decaps(kem, shared_secret, ciphertext, private_key) != OQS_SUCCESS) goto cleanup;
    char *ss_b64 = b64_encode(shared_secret, kem->length_shared_secret);
    size_t needed = strlen(ss_b64) + 32;
    result = malloc(needed);
    if (result) snprintf(result, needed, "%s", ss_b64);
    free(ss_b64);
cleanup:
    if (private_key) free(private_key);
    if (ciphertext) free(ciphertext);
    if (shared_secret) free(shared_secret);
    if (kem) OQS_KEM_free(kem);
    return result;
}

char *oqs_generate_sig_keypair_json(void) {
    OQS_SIG *sig = NULL;
    char *result = NULL;
    sig = OQS_SIG_new(OQS_SIG_alg_dilithium_2);
    if (!sig) return NULL;
    uint8_t *public_key = malloc(sig->length_public_key);
    uint8_t *private_key = malloc(sig->length_secret_key);
    if (!public_key || !private_key) goto cleanup;
    if (OQS_SIG_keypair(sig, public_key, private_key) != OQS_SUCCESS) goto cleanup;
    char *pub_b64 = b64_encode(public_key, sig->length_public_key);
    char *priv_b64 = b64_encode(private_key, sig->length_secret_key);
    size_t needed = strlen(pub_b64) + strlen(priv_b64) + 64;
    result = malloc(needed);
    if (result) snprintf(result, needed, "{\"public\":\"%s\",\"private\":\"%s\"}", pub_b64, priv_b64);
    free(pub_b64); free(priv_b64);
cleanup:
    if (public_key) free(public_key);
    if (private_key) free(private_key);
    if (sig) OQS_SIG_free(sig);
    return result;
}

char *oqs_sign_b64(const char *private_b64, const char *message_b64) {
    OQS_SIG *sig = NULL;
    char *out = NULL;
    sig = OQS_SIG_new(OQS_SIG_alg_dilithium_2);
    if (!sig) return NULL;
    size_t sk_len = sig->length_secret_key;
    size_t msg_len = 0, decoded_sk = 0;
    unsigned char *private_key = b64_decode(private_b64, strlen(private_b64), &decoded_sk);
    unsigned char *message = b64_decode(message_b64, strlen(message_b64), &msg_len);
    if (!private_key || !message) goto cleanup;
    if (decoded_sk != sk_len) goto cleanup;
    size_t sig_len = sig->length_signature;
    unsigned char *signature = malloc(sig_len);
    if (!signature) goto cleanup;
    if (OQS_SIG_sign(sig, signature, &sig_len, message, msg_len, private_key) != OQS_SUCCESS) goto cleanup;
    char *sig_b64 = b64_encode(signature, sig_len);
    out = strdup(sig_b64);
    free(sig_b64);
cleanup:
    if (private_key) free(private_key);
    if (message) free(message);
    if (signature) free(signature);
    if (sig) OQS_SIG_free(sig);
    return out;
}

int oqs_verify_b64(const char *public_b64, const char *message_b64, const char *signature_b64) {
    OQS_SIG *sig = NULL;
    int valid = 0;
    sig = OQS_SIG_new(OQS_SIG_alg_dilithium_2);
    if (!sig) return 0;
    size_t pk_len = sig->length_public_key;
    size_t msg_len = 0, sig_len = 0, decoded_pk = 0;
    unsigned char *public_key = b64_decode(public_b64, strlen(public_b64), &decoded_pk);
    unsigned char *message = b64_decode(message_b64, strlen(message_b64), &msg_len);
    unsigned char *signature = b64_decode(signature_b64, strlen(signature_b64), &sig_len);
    if (!public_key || !message || !signature) goto cleanup;
    if (decoded_pk != pk_len) goto cleanup;
    if (OQS_SIG_verify(sig, message, msg_len, signature, sig_len, public_key) == OQS_SUCCESS) valid = 1;
cleanup:
    if (public_key) free(public_key);
    if (message) free(message);
    if (signature) free(signature);
    if (sig) OQS_SIG_free(sig);
    return valid;
}

#endif // HAVE_OQS

#if HAVE_OPENSSL
// AES-GCM wrap/unwrap helpers using OpenSSL. Inputs and outputs are base64 strings.
static char *aes_gcm_wrap_b64(const unsigned char *key, size_t key_len, const unsigned char *plain, size_t plain_len) {
    unsigned char iv[12];
    if (RAND_bytes(iv, sizeof(iv)) != 1) return NULL;
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    if (!ctx) return NULL;
    int len = 0, ciphertext_len = 0;
    unsigned char *ciphertext = malloc(plain_len + 16);
    if (!ciphertext) { EVP_CIPHER_CTX_free(ctx); return NULL; }
    if (EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL) != 1) goto cleanup;
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_IVLEN, sizeof(iv), NULL) != 1) goto cleanup;
    if (EVP_EncryptInit_ex(ctx, NULL, NULL, key, iv) != 1) goto cleanup;
    if (EVP_EncryptUpdate(ctx, ciphertext, &len, plain, (int)plain_len) != 1) goto cleanup;
    ciphertext_len = len;
    if (EVP_EncryptFinal_ex(ctx, ciphertext + len, &len) != 1) goto cleanup;
    ciphertext_len += len;
    unsigned char tag[16];
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_GET_TAG, 16, tag) != 1) goto cleanup;
    // assemble out = iv || ciphertext || tag
    size_t out_len = sizeof(iv) + ciphertext_len + sizeof(tag);
    unsigned char *out = malloc(out_len);
    if (!out) goto cleanup;
    memcpy(out, iv, sizeof(iv));
    memcpy(out + sizeof(iv), ciphertext, ciphertext_len);
    memcpy(out + sizeof(iv) + ciphertext_len, tag, sizeof(tag));
    char *b64 = b64_encode(out, out_len);
    free(out);
    free(ciphertext);
    EVP_CIPHER_CTX_free(ctx);
    return b64;
cleanup:
    free(ciphertext);
    EVP_CIPHER_CTX_free(ctx);
    return NULL;
}

static char *aes_gcm_unwrap_b64(const unsigned char *key, size_t key_len, const char *wrapped_b64) {
    size_t wrapped_len = 0;
    unsigned char *wrapped = b64_decode(wrapped_b64, strlen(wrapped_b64), &wrapped_len);
    if (!wrapped || wrapped_len < 12 + 16) { if (wrapped) free(wrapped); return NULL; }
    unsigned char iv[12];
    memcpy(iv, wrapped, sizeof(iv));
    size_t ciphertext_len = wrapped_len - sizeof(iv) - 16;
    unsigned char *ciphertext = malloc(ciphertext_len);
    unsigned char tag[16];
    memcpy(ciphertext, wrapped + sizeof(iv), ciphertext_len);
    memcpy(tag, wrapped + sizeof(iv) + ciphertext_len, 16);
    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    if (!ctx) { free(wrapped); free(ciphertext); return NULL; }
    int len = 0, plain_len = 0;
    unsigned char *plain = malloc(ciphertext_len + 16);
    if (!plain) { EVP_CIPHER_CTX_free(ctx); free(wrapped); free(ciphertext); return NULL; }
    if (EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL) != 1) goto cleanup;
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_IVLEN, sizeof(iv), NULL) != 1) goto cleanup;
    if (EVP_DecryptInit_ex(ctx, NULL, NULL, key, iv) != 1) goto cleanup;
    if (EVP_DecryptUpdate(ctx, plain, &len, ciphertext, (int)ciphertext_len) != 1) goto cleanup;
    plain_len = len;
    if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_TAG, 16, tag) != 1) goto cleanup;
    if (EVP_DecryptFinal_ex(ctx, plain + len, &len) != 1) goto cleanup;
    plain_len += len;
    char *b64 = b64_encode(plain, plain_len);
    free(plain);
    free(ciphertext);
    free(wrapped);
    EVP_CIPHER_CTX_free(ctx);
    return b64;
cleanup:
    free(plain);
    free(ciphertext);
    free(wrapped);
    EVP_CIPHER_CTX_free(ctx);
    return NULL;
}

char *oqs_aes_gcm_wrap_b64(const char *key_b64, const char *plain_b64) {
    size_t key_len = 0;
    unsigned char *key = b64_decode(key_b64, strlen(key_b64), &key_len);
    if (!key) return NULL;
    size_t plain_len = 0;
    unsigned char *plain = b64_decode(plain_b64, strlen(plain_b64), &plain_len);
    if (!plain) { free(key); return NULL; }
    char *out = aes_gcm_wrap_b64(key, key_len, plain, plain_len);
    free(key);
    free(plain);
    return out;
}

char *oqs_aes_gcm_unwrap_b64(const char *key_b64, const char *wrapped_b64) {
    size_t key_len = 0;
    unsigned char *key = b64_decode(key_b64, strlen(key_b64), &key_len);
    if (!key) return NULL;
    char *out = aes_gcm_unwrap_b64(key, key_len, wrapped_b64);
    free(key);
    return out;
}
#endif // HAVE_OPENSSL

// Fallback stubs when liboqs isn't available
char *oqs_generate_kem_keypair_json(void) {
    return NULL;
}
char *oqs_kem_encapsulate_json(const char *public_b64) {
    return NULL;
}
char *oqs_generate_sig_keypair_json(void) {
    return NULL;
}
