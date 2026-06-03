import Foundation

@objc(SecureQuantumCrypto)
class SecureQuantumCrypto: NSObject {

  @objc
  func generateDilithiumKeyPair(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    reject("UNIMPLEMENTED", "Link the native Kyber/Dilithium library for iOS", nil)
  }

  @objc
  func kyberEncapsulate(_ publicKeyB64: NSString, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    reject("UNIMPLEMENTED", "Link the native Kyber/Dilithium library for iOS", nil)
  }

  @objc
  func signDilithium(_ messageB64: NSString, privateKeyB64: NSString, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    reject("UNIMPLEMENTED", "Link the native Kyber/Dilithium library for iOS", nil)
  }

  @objc
  func verifyDilithium(_ messageB64: NSString, signatureB64: NSString, publicKeyB64: NSString, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(false)
  }

  @objc
  func storeWrappedPrivateKey(_ alias: NSString, privateKeyB64: NSString, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let acc = alias as String
    let data = Data(base64Encoded: privateKeyB64 as String) ?? Data()
    let ok = KeychainHelper.store(keyData: data, account: acc)
    if ok {
      resolve(true)
    } else {
      reject("STORE_ERROR", "Failed to store key", nil)
    }
  }

  @objc
  func loadWrappedPrivateKey(_ alias: NSString, resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let acc = alias as String
    if let data = KeychainHelper.retrieve(account: acc) {
      let b64 = data.base64EncodedString()
      resolve(b64)
    } else {
      resolve(nil)
    }
  }
}
