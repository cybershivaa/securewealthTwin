import apiClient from './apiClient';

/**
 * Authentication API Service
 */

export const AuthService = {
  /**
   * Send OTP to mobile number
   */
  sendOTP: async (mobileNumber) => {
    try {
      const response = await apiClient.post('/auth/send-otp', {
        mobileNumber,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (mobileNumber, otp) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        mobileNumber,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Send email OTP
   */
  sendEmailOTP: async (email) => {
    try {
      const response = await apiClient.post('/auth/send-email-otp', {
        email,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify email OTP
   */
  verifyEmailOTP: async (email, otp) => {
    try {
      const response = await apiClient.post('/auth/verify-email-otp', {
        email,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Register user
   */
  register: async (registrationData) => {
    try {
      const response = await apiClient.post('/auth/register', registrationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Login with username and password
   */
  loginWithCredentials: async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Login with mobile OTP
   */
  loginWithMobileOTP: async (mobileNumber, otp) => {
    try {
      const response = await apiClient.post('/auth/login-otp', {
        mobileNumber,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Login with MPIN
   */
  loginWithMPIN: async (mobileNumber, mpin) => {
    try {
      const response = await apiClient.post('/auth/login-mpin', {
        mobileNumber,
        mpin,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Login with biometric
   */
  loginWithBiometric: async (mobileNumber, biometricToken) => {
    try {
      const response = await apiClient.post('/auth/login-biometric', {
        mobileNumber,
        biometricToken,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await apiClient.post('/auth/refresh-token', {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Forgot password - send OTP
   */
  forgotPassword: async (mobileNumber) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        mobileNumber,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (mobileNumber, otp, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        mobileNumber,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify account details
   */
  verifyAccountDetails: async (accountNumber, cifNumber, cardLast6) => {
    try {
      const response = await apiClient.post('/account/verify', {
        accountNumber,
        cifNumber,
        cardLast6,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Register device
   */
  registerDevice: async (deviceInfo) => {
    try {
      const response = await apiClient.post('/device/register', deviceInfo);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify username availability
   */
  checkUsernameAvailability: async (username) => {
    try {
      const response = await apiClient.get('/auth/check-username', {
        params: { username },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Verify email availability
   */
  checkEmailAvailability: async (email) => {
    try {
      const response = await apiClient.get('/auth/check-email', {
        params: { email },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
