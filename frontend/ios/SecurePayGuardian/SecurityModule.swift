import Foundation
import LocalAuthentication
import UIKit

@objc(SecurityModule)
class SecurityModule: NSObject {
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc func isUsbDebugging(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(false)
  }
  
  @objc func isDeveloperModeEnabled(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(false)
  }
  
  @objc func isScreenRecording(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(UIScreen.main.isCaptured)
    }
  }
  
  @objc func getInstalledPackages(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve("[]") // iOS sandbox prevents package scanning
  }
  
  @objc func getDeviceBuildInfo(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    #if targetEnvironment(simulator)
    let isSimulator = true
    #else
    let isSimulator = false
    #endif
    
    let info: [String: Any] = [
      "isEmulator": isSimulator,
      "isDebugBuild": false,
      "buildType": "release",
      "buildTags": ""
    ]
    
    if let jsonData = try? JSONSerialization.data(withJSONObject: info, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
      resolve(jsonString)
    } else {
      resolve("{}")
    }
  }
  
  @objc func isJailbroken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    var jailbroken = false
    
    // Check common jailbreak paths
    let paths = [
      "/Applications/Cydia.app",
      "/Library/MobileSubstrate/MobileSubstrate.dylib",
      "/bin/bash",
      "/usr/sbin/sshd",
      "/etc/apt",
      "/private/var/lib/apt/",
      "/usr/bin/ssh"
    ]
    for path in paths {
      if FileManager.default.fileExists(atPath: path) {
        jailbroken = true
        break
      }
    }
    
    // Check writing permission in system directory
    if !jailbroken {
      let testString = "SecurePayJailbreakCheck"
      do {
        try testString.write(toFile: "/private/jailbreak.txt", atomically: true, encoding: .utf8)
        try FileManager.default.removeItem(atPath: "/private/jailbreak.txt")
        jailbroken = true
      } catch {
        // failed to write, which is normal for sandboxed non-jailbroken app
      }
    }
    
    resolve(jailbroken)
  }
  
  @objc func authenticateBiometrics(_ title: String, subtitle: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    var error: NSError?
    
    // Check if biometric authentication is available
    if context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) {
      context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: subtitle) { success, evaluateError in
        resolve(success)
      }
    } else {
      // Device is not secure (no passcode or biometrics set up), allow passing
      resolve(true)
    }
  }
}
