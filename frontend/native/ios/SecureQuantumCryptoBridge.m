#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SecureQuantumCrypto, NSObject)

RCT_EXTERN_METHOD(generateDilithiumKeyPair:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(kyberEncapsulate:(NSString *)publicKeyB64 resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(signDilithium:(NSString *)messageB64 privateKeyB64:(NSString *)privateKeyB64 resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(verifyDilithium:(NSString *)messageB64 signatureB64:(NSString *)signatureB64 publicKeyB64:(NSString *)publicKeyB64 resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(storeWrappedPrivateKey:(NSString *)alias privateKeyB64:(NSString *)privateKeyB64 resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(loadWrappedPrivateKey:(NSString *)alias resolve:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
