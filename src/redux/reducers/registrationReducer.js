/**
 * Registration Reducer
 */

const initialState = {
  step: 1,
  mobileNumber: null,
  email: null,
  fullName: null,
  dob: null,
  pan: null,
  aadhaar: null,
  gender: null,
  accountNumber: null,
  cifNumber: null,
  cardLast6: null,
  username: null,
  password: null,
  mpin: null,
  biometricEnabled: false,
  deviceId: null,
  isLoading: false,
  error: null,
  registrationComplete: false,
};

const registrationReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_REGISTRATION_STEP':
      return {
        ...state,
        step: action.payload,
      };
    case 'UPDATE_REGISTRATION_DATA':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_MOBILE_NUMBER':
      return {
        ...state,
        mobileNumber: action.payload,
      };
    case 'SET_EMAIL':
      return {
        ...state,
        email: action.payload,
      };
    case 'SET_PERSONAL_INFO':
      return {
        ...state,
        fullName: action.payload.fullName,
        dob: action.payload.dob,
        pan: action.payload.pan,
        aadhaar: action.payload.aadhaar,
        gender: action.payload.gender,
      };
    case 'SET_ACCOUNT_INFO':
      return {
        ...state,
        accountNumber: action.payload.accountNumber,
        cifNumber: action.payload.cifNumber,
        cardLast6: action.payload.cardLast6,
      };
    case 'SET_CREDENTIALS':
      return {
        ...state,
        username: action.payload.username,
        password: action.payload.password,
        mpin: action.payload.mpin,
      };
    case 'SET_BIOMETRIC':
      return {
        ...state,
        biometricEnabled: action.payload,
      };
    case 'REGISTRATION_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'REGISTRATION_SUCCESS':
      return {
        ...state,
        isLoading: false,
        registrationComplete: true,
        error: null,
      };
    case 'REGISTRATION_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'RESET_REGISTRATION':
      return initialState;
    default:
      return state;
  }
};

export default registrationReducer;
