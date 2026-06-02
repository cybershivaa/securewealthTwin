// Bridge header to expose C functions to Swift/Objective-C
#ifndef SecureQuantumBridge_h
#define SecureQuantumBridge_h

// Declare C functions from your PQ library here, e.g.:
// const char* pq_generate_kem_keypair();
// const char* pq_kem_encapsulate(const char* public_b64);
// Functions provided by oqs_wrapper.c (if built):
extern char *oqs_generate_kem_keypair_json(void);
extern char *oqs_kem_encapsulate_json(const char *public_b64);
extern char *oqs_generate_sig_keypair_json(void);

#endif /* SecureQuantumBridge_h */
