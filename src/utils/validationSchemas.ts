import * as yup from 'yup';

export const mobileSchema = yup.object().shape({
  mobile: yup
    .string()
    .matches(/^\d{10}$/, 'Must be 10 digits')
    .required('Mobile is required'),
});

export const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
});

export const emailSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required'),
});

export const personalDetailsSchema = yup.object().shape({
  fullName: yup.string().min(3, 'Min 3 chars').required('Full name required'),
  dob: yup.string().required('DOB required'),
  gender: yup.string().required('Gender required'),
  pan: yup
    .string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .required('PAN required'),
});

export const bankDetailsSchema = yup.object().shape({
  accountNumber: yup
    .string()
    .min(10, 'Invalid account')
    .required('Account required'),
  cif: yup.string().required('CIF required'),
  cardLast6: yup
    .string()
    .matches(/^\d{6}$/, 'Must be 6 digits')
    .required('Card details required'),
});

export const securitySchema = yup.object().shape({
  username: yup.string().min(6, 'Min 6 chars').required('Username required'),
  password: yup
    .string()
    .min(8, 'Min 8 chars')
    .matches(/[A-Z]/, 'Must have uppercase')
    .matches(/[a-z]/, 'Must have lowercase')
    .matches(/[0-9]/, 'Must have number')
    .matches(/[^A-Za-z0-9]/, 'Must have special char')
    .required('Password required'),
  mpin: yup
    .string()
    .matches(/^\d{4,6}$/, 'MPIN must be 4-6 digits')
    .required('MPIN required'),
});

export const loginSchema = yup.object().shape({
  username: yup.string().required('Username required'),
  password: yup.string().required('Password required'),
});
