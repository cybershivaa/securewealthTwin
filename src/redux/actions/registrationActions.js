/**
 * Registration Actions
 */

export const setRegistrationStep = (step) => ({
  type: 'SET_REGISTRATION_STEP',
  payload: step,
});

export const setMobileNumber = (mobileNumber) => ({
  type: 'SET_MOBILE_NUMBER',
  payload: mobileNumber,
});

export const setEmail = (email) => ({
  type: 'SET_EMAIL',
  payload: email,
});

export const setPersonalInfo = (fullName, dob, pan, aadhaar, gender) => ({
  type: 'SET_PERSONAL_INFO',
  payload: { fullName, dob, pan, aadhaar, gender },
});

export const setAccountInfo = (accountNumber, cifNumber, cardLast6) => ({
  type: 'SET_ACCOUNT_INFO',
  payload: { accountNumber, cifNumber, cardLast6 },
});

export const setCredentials = (username, password, mpin) => ({
  type: 'SET_CREDENTIALS',
  payload: { username, password, mpin },
});

export const setBiometric = (enabled) => ({
  type: 'SET_BIOMETRIC',
  payload: enabled,
});

export const registrationLoading = () => ({
  type: 'REGISTRATION_LOADING',
});

export const registrationSuccess = () => ({
  type: 'REGISTRATION_SUCCESS',
});

export const registrationError = (error) => ({
  type: 'REGISTRATION_ERROR',
  payload: error,
});

export const resetRegistration = () => ({
  type: 'RESET_REGISTRATION',
});
