/**
 * Common Constants
 */

export const SCREEN_NAMES = {
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  REGISTRATION: 'Registration',
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings',
};

export const REGISTRATION_STEPS = {
  MOBILE: 1,
  EMAIL: 2,
  PERSONAL_INFO: 3,
  ACCOUNT_INFO: 4,
  CREDENTIALS: 5,
  FACE_ID: 6,
  DEVICE_BIOMETRIC: 7,
  SUCCESS: 8,
};

export const LOGIN_METHODS = {
  CREDENTIALS: 'credentials',
  OTP: 'otp',
  MPIN: 'mpin',
  BIOMETRIC: 'biometric',
};

export const OTP_TYPES = {
  REGISTRATION: 'REGISTRATION',
  LOGIN: 'LOGIN',
  VERIFICATION: 'VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
};

export const KYC_STATUS = {
  INCOMPLETE: 'INCOMPLETE',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

export const ACCOUNT_TYPES = [
  { label: 'Savings', value: 'SAVINGS' },
  { label: 'Current', value: 'CURRENT' },
  { label: 'Salary', value: 'SALARY' },
];

export const API_TIMEOUTS = {
  SHORT: 10000,    // 10 seconds
  MEDIUM: 30000,   // 30 seconds
  LONG: 60000,     // 60 seconds
};

export const TOKEN_EXPIRY = {
  ACCESS: 900000,      // 15 minutes
  REFRESH: 2592000000, // 30 days
  OTP: 600000,         // 10 minutes
  SESSION: 1800000,    // 30 minutes
};

export const RATE_LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_OTP_ATTEMPTS: 5,
  MAX_OTP_REQUESTS: 3,
  ATTEMPT_TIMEOUT: 300000, // 5 minutes
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  INVALID_OTP: 'Invalid OTP. Please try again.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'User already registered.',
  ACCOUNT_NOT_LINKED: 'Bank account not found. Please verify your details.',
  DEVICE_NOT_TRUSTED: 'Device not recognized. Please verify again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
};

export const SUCCESS_MESSAGES = {
  OTP_SENT: 'OTP sent successfully.',
  OTP_VERIFIED: 'OTP verified successfully.',
  LOGIN_SUCCESSFUL: 'Login successful.',
  REGISTRATION_SUCCESSFUL: 'Registration successful.',
  LOGOUT_SUCCESSFUL: 'Logged out successfully.',
  DEVICE_REGISTERED: 'Device registered successfully.',
  BIOMETRIC_REGISTERED: 'Biometric registered successfully.',
};

export const VALIDATION_RULES = {
  MOBILE_LENGTH: 10,
  OTP_LENGTH: 6,
  MPIN_MIN: 4,
  MPIN_MAX: 6,
  PASSWORD_MIN: 8,
  USERNAME_MIN: 4,
  PAN_LENGTH: 10,
  AADHAAR_LENGTH: 12,
  ACCOUNT_NUMBER_MIN: 10,
  ACCOUNT_NUMBER_MAX: 20,
};

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  SEND_EMAIL_OTP: '/auth/send-email-otp',
  VERIFY_EMAIL_OTP: '/auth/verify-email-otp',
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGIN_OTP: '/auth/login-otp',
  LOGIN_MPIN: '/auth/login-mpin',
  LOGIN_BIOMETRIC: '/auth/login-biometric',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // Account
  VERIFY_ACCOUNT: '/account/verify',
  GET_ACCOUNT: '/account/get',

  // Device
  REGISTER_DEVICE: '/device/register',
  GET_DEVICES: '/device/list',
  REMOVE_DEVICE: '/device/remove',

  // User
  GET_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile/update',
  GET_SETTINGS: '/user/settings',
  UPDATE_SETTINGS: '/user/settings/update',

  // Utility
  CHECK_USERNAME: '/auth/check-username',
  CHECK_EMAIL: '/auth/check-email',
};

export const BIOMETRIC_TYPES = {
  FINGERPRINT: 'FINGERPRINT',
  FACE: 'FACE',
  IRIS: 'IRIS',
};

export const DEVICE_OS = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  WEB: 'WEB',
};

export const ACTION_TYPES = {
  // Auth actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  MPIN_CHANGE: 'MPIN_CHANGE',

  // Account actions
  ACCOUNT_LINK: 'ACCOUNT_LINK',
  ACCOUNT_UNLINK: 'ACCOUNT_UNLINK',

  // Device actions
  DEVICE_REGISTER: 'DEVICE_REGISTER',
  DEVICE_REMOVE: 'DEVICE_REMOVE',

  // Biometric actions
  BIOMETRIC_REGISTER: 'BIOMETRIC_REGISTER',
  BIOMETRIC_REMOVE: 'BIOMETRIC_REMOVE',
};

export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
};
