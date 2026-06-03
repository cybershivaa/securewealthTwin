/**
 * Validation utilities for form inputs
 */

export const Validators = {
  /**
   * Validate mobile number
   * @param {string} mobile - Mobile number to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateMobile: (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobile) {
      return { isValid: false, error: 'Mobile number is required' };
    }
    if (!mobileRegex.test(mobile)) {
      return { isValid: false, error: 'Enter a valid 10-digit mobile number' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Enter a valid email address' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate OTP
   * @param {string} otp - OTP to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateOTP: (otp) => {
    if (!otp) {
      return { isValid: false, error: 'OTP is required' };
    }
    if (!/^\d{6}$/.test(otp)) {
      return { isValid: false, error: 'OTP must be 6 digits' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate password
   * @param {string} password - Password to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validatePassword: (password) => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: 'Password must contain number' };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return { isValid: false, error: 'Password must contain special character' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate MPIN
   * @param {string} mpin - MPIN to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateMPIN: (mpin) => {
    if (!mpin) {
      return { isValid: false, error: 'MPIN is required' };
    }
    if (!/^\d{4,6}$/.test(mpin)) {
      return { isValid: false, error: 'MPIN must be 4-6 digits' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate PAN
   * @param {string} pan - PAN to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validatePAN: (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pan) {
      return { isValid: false, error: 'PAN is required' };
    }
    if (!panRegex.test(pan)) {
      return { isValid: false, error: 'Enter a valid PAN' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate Aadhaar
   * @param {string} aadhaar - Aadhaar to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateAadhaar: (aadhaar) => {
    if (!aadhaar) {
      return { isValid: false, error: 'Aadhaar is required' };
    }
    if (!/^\d{12}$/.test(aadhaar)) {
      return { isValid: false, error: 'Aadhaar must be 12 digits' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate account number
   * @param {string} accountNumber - Account number to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateAccountNumber: (accountNumber) => {
    if (!accountNumber) {
      return { isValid: false, error: 'Account number is required' };
    }
    if (!/^\d{10,20}$/.test(accountNumber)) {
      return { isValid: false, error: 'Enter a valid account number' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate username
   * @param {string} username - Username to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateUsername: (username) => {
    if (!username) {
      return { isValid: false, error: 'Username is required' };
    }
    if (username.length < 4) {
      return { isValid: false, error: 'Username must be at least 4 characters' };
    }
    if (!/^[a-zA-Z0-9_]*$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers and underscore' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate full name
   * @param {string} name - Name to validate
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateFullName: (name) => {
    if (!name) {
      return { isValid: false, error: 'Full name is required' };
    }
    if (name.length < 3) {
      return { isValid: false, error: 'Name must be at least 3 characters' };
    }
    return { isValid: true, error: '' };
  },

  /**
   * Validate date of birth
   * @param {string} dob - DOB in YYYY-MM-DD format
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateDOB: (dob) => {
    if (!dob) {
      return { isValid: false, error: 'Date of birth is required' };
    }
    const date = new Date(dob);
    const age = new Date().getFullYear() - date.getFullYear();
    if (age < 18) {
      return { isValid: false, error: 'You must be at least 18 years old' };
    }
    return { isValid: true, error: '' };
  },
};
