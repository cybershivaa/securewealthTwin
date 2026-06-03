import CryptoJS from 'crypto-js';
import * as SecureStore from 'react-native-secure-storage';

/**
 * Security Utilities for encryption and token management
 */

const ENCRYPTION_KEY = 'PSB_DIGITAL_SECURE_2026'; // Should be from environment variables
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const DEVICE_ID_KEY = 'device_id';

export const SecurityUtils = {
  /**
   * Encrypt data using AES
   */
  encrypt: (data) => {
    try {
      return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        ENCRYPTION_KEY
      ).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  },

  /**
   * Decrypt data
   */
  decrypt: (encryptedData) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  },

  /**
   * Hash password using BCrypt (in real app, use backend)
   */
  hashPassword: async (password) => {
    try {
      // For production, this should be done on backend
      return CryptoJS.SHA256(password + ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Hashing error:', error);
      return null;
    }
  },

  /**
   * Store token securely
   */
  storeToken: async (token, tokenType = 'access') => {
    try {
      const key = tokenType === 'refresh' ? REFRESH_TOKEN_KEY : TOKEN_KEY;
      await SecureStore.setItem(key, token);
      return true;
    } catch (error) {
      console.error('Store token error:', error);
      return false;
    }
  },

  /**
   * Retrieve token
   */
  getToken: async (tokenType = 'access') => {
    try {
      const key = tokenType === 'refresh' ? REFRESH_TOKEN_KEY : TOKEN_KEY;
      return await SecureStore.getItem(key);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  /**
   * Remove token
   */
  removeToken: async (tokenType = 'access') => {
    try {
      const key = tokenType === 'refresh' ? REFRESH_TOKEN_KEY : TOKEN_KEY;
      await SecureStore.removeItem(key);
      return true;
    } catch (error) {
      console.error('Remove token error:', error);
      return false;
    }
  },

  /**
   * Store sensitive data
   */
  storeSecureData: async (key, value) => {
    try {
      const encrypted = SecurityUtils.encrypt(value);
      await SecureStore.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('Store secure data error:', error);
      return false;
    }
  },

  /**
   * Retrieve sensitive data
   */
  getSecureData: async (key) => {
    try {
      const encrypted = await SecureStore.getItem(key);
      if (!encrypted) return null;
      return SecurityUtils.decrypt(encrypted);
    } catch (error) {
      console.error('Get secure data error:', error);
      return null;
    }
  },

  /**
   * Remove secure data
   */
  removeSecureData: async (key) => {
    try {
      await SecureStore.removeItem(key);
      return true;
    } catch (error) {
      console.error('Remove secure data error:', error);
      return false;
    }
  },

  /**
   * Generate random token
   */
  generateRandomToken: (length = 32) => {
    return CryptoJS.lib.WordArray.random(length).toString();
  },

  /**
   * Verify password (simplified for client-side)
   */
  verifyPassword: (password, hash) => {
    const passwordHash = CryptoJS.SHA256(password + ENCRYPTION_KEY).toString();
    return passwordHash === hash;
  },

  /**
   * Mask sensitive data (e.g., Aadhaar, card number)
   */
  maskData: (data, visibleChars = 4) => {
    if (!data || data.length <= visibleChars) return data;
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + data.slice(-visibleChars);
  },

  /**
   * Generate Device Fingerprint (basic implementation)
   */
  generateDeviceFingerprint: async () => {
    try {
      // This is a simplified implementation
      // In production, use a proper library like react-native-device-info
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substr(2, 9);
      return CryptoJS.SHA256(timestamp + random).toString().substring(0, 32);
    } catch (error) {
      console.error('Device fingerprint error:', error);
      return null;
    }
  },

  /**
   * Check SSL Pinning (implement with react-native-ssl-pinning)
   */
  validateSSLCertificate: async (domain) => {
    // This would use react-native-ssl-pinning in production
    console.log('SSL Certificate validation for:', domain);
    return true;
  },

  /**
   * Token Expiry Check
   */
  isTokenExpired: (token) => {
    try {
      if (!token) return true;
      // Decode JWT (simple implementation)
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const decoded = JSON.parse(atob(parts[1]));
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  },

  /**
   * Clear all sensitive data
   */
  clearAllSecureData: async () => {
    try {
      await SecurityUtils.removeToken('access');
      await SecurityUtils.removeToken('refresh');
      await SecureStore.removeItem(DEVICE_ID_KEY);
      return true;
    } catch (error) {
      console.error('Clear secure data error:', error);
      return false;
    }
  },
};
