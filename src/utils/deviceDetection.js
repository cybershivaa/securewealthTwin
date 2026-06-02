import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

/**
 * Device Detection and Security Checks
 */

export const DeviceDetection = {
  /**
   * Check if device is rooted
   */
  isDeviceRooted: async () => {
    try {
      if (Platform.OS === 'android') {
        const rooted = await DeviceInfo.isEmulator();
        return rooted;
      }
      return false;
    } catch (error) {
      console.error('Root detection error:', error);
      return false;
    }
  },

  /**
   * Check if device is emulator
   */
  isEmulator: async () => {
    try {
      return await DeviceInfo.isEmulator();
    } catch (error) {
      console.error('Emulator detection error:', error);
      return false;
    }
  },

  /**
   * Get device info
   */
  getDeviceInfo: async () => {
    try {
      const deviceInfo = {
        deviceId: await DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        model: DeviceInfo.getModel(),
        brand: DeviceInfo.getBrand(),
        systemVersion: Platform.Version,
        osType: Platform.OS,
        appVersion: await DeviceInfo.getVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
      };
      return deviceInfo;
    } catch (error) {
      console.error('Get device info error:', error);
      return null;
    }
  },

  /**
   * Check for developer options enabled
   */
  isDeveloperModeEnabled: async () => {
    try {
      if (Platform.OS === 'android') {
        // This is a simplified check - in production use native module
        const debuggable = await DeviceInfo.isDebugModeEnabled?.();
        return debuggable || false;
      }
      return false;
    } catch (error) {
      console.error('Developer mode check error:', error);
      return false;
    }
  },

  /**
   * Check screen overlay
   */
  hasScreenOverlay: () => {
    try {
      // This requires native implementation
      // Placeholder implementation
      return false;
    } catch (error) {
      console.error('Screen overlay check error:', error);
      return false;
    }
  },

  /**
   * Comprehensive device security check
   */
  performSecurityCheck: async () => {
    try {
      const checks = {
        isRooted: await DeviceDetection.isDeviceRooted(),
        isEmulator: await DeviceDetection.isEmulator(),
        isDeveloperMode: await DeviceDetection.isDeveloperModeEnabled(),
        hasScreenOverlay: DeviceDetection.hasScreenOverlay(),
      };

      const isSafe = !checks.isRooted && 
                     !checks.isEmulator && 
                     !checks.isDeveloperMode && 
                     !checks.hasScreenOverlay;

      return {
        isSafe,
        checks,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Security check error:', error);
      return {
        isSafe: false,
        checks: {},
        error: error.message,
      };
    }
  },

  /**
   * Get device fingerprint hash
   */
  getDeviceFingerprint: async () => {
    try {
      const deviceId = await DeviceInfo.getUniqueId();
      return deviceId;
    } catch (error) {
      console.error('Get device fingerprint error:', error);
      return null;
    }
  },
};
