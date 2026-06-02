import Foundation

@objc(SecureQuantumCrypto)
class SecureQuantumCrypto: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func generateKemKeypair(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    #if canImport(Foundation)
    if let cstr = oqs_generate_kem_keypair_json() {
      let str = String(cString: cstr)
      free(UnsafeMutableRawPointer(mutating: cstr))
      resolve(str)
      return
    }
    #endif
    let err = NSError(domain: "SecureQuantumCrypto", code: -1, userInfo: [NSLocalizedDescriptionKey: "generateKemKeypair failed or liboqs missing"]) 
    reject!("UNIMPLEMENTED", "generateKemKeypair not implemented", err)
  }

  @objc
  func kemEncrypt(_ publicKeyB64: NSString, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    #if canImport(Foundation)
    if let cstr = oqs_kem_encapsulate_json(publicKeyB64.utf8String) {
      let str = String(cString: cstr)
      free(UnsafeMutableRawPointer(mutating: cstr))
      resolve(str)
      return
    }
    #endif
    let err = NSError(domain: "SecureQuantumCrypto", code: -1, userInfo: [NSLocalizedDescriptionKey: "kemEncrypt failed or liboqs missing"]) 
    reject!("UNIMPLEMENTED", "kemEncrypt not implemented", err)
  }

  @objc
  func kemDecrypt(_ privateKeyB64: NSString, ciphertextB64: NSString, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    #if canImport(Foundation)
    if let cstr = oqs_kem_decapsulate_b64(privateKeyB64.utf8String, ciphertextB64.utf8String) {
      let str = String(cString: cstr)
      free(UnsafeMutableRawPointer(mutating: cstr))
      resolve(str)
      return
    }
    #endif
    let err = NSError(domain: "SecureQuantumCrypto", code: -1, userInfo: [NSLocalizedDescriptionKey: "kemDecrypt failed or liboqs missing"]) 
    reject!("UNIMPLEMENTED", "kemDecrypt not implemented", err)
  }

  @objc
  func generateSignKeypair(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    #if canImport(Foundation)
    if let cstr = oqs_generate_sig_keypair_json() {
      let str = String(cString: cstr)
      free(UnsafeMutableRawPointer(mutating: cstr))
      resolve(str)
      return
    }
    #endif
    let err = NSError(domain: "SecureQuantumCrypto", code: -1, userInfo: [NSLocalizedDescriptionKey: "generateSignKeypair failed or liboqs missing"]) 
    reject!("UNIMPLEMENTED", "generateSignKeypair not implemented", err)
  }

  @objc
  func sign(_ privateKeyB64: NSString, messageB64: NSString, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    #if canImport(Foundation)
    if let cstr = oqs_sign_b64(privateKeyB64.utf8String, messageB64.utf8String) {
      let str = String(cString: cstr)
      free(UnsafeMutableRawPointer(mutating: cstr))
      resolve(str)
      return
    }
    #endif
    let err = NSError(domain: "SecureQuantumCrypto", code: -1, userInfo: [NSLocalizedDescriptionKey: "sign failed or liboqs missing"]) 
    reject!("UNIMPLEMENTED", "sign not implemented", err)
  }

  @objc
  func verify(_ publicKeyB64: NSString, messageB64: NSString, signatureB64: NSString, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    #if canImport(Foundation)
    let ok = oqs_verify_b64(publicKeyB64.utf8String, messageB64.utf8String, signatureB64.utf8String)
    resolve(ok == 1)
    return
    #else
    let err = NSError(domain: "SecureQuantumCrypto", code: -1, userInfo: [NSLocalizedDescriptionKey: "verify not implemented"]) 
    reject!("UNIMPLEMENTED", "verify not implemented", err)
    #endif
  }
}
