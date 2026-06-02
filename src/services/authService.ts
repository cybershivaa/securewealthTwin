import api from './apiClient';
import { ApiResponse, UserProfile } from '../types';

export const sendMobileOtp = async (mobile: string) => {
  return api.post<ApiResponse>('/auth/send-otp', { mobile });
};

export const verifyMobileOtp = async (mobile: string, otp: string) => {
  return api.post<ApiResponse<{ token: string; refreshToken: string; userId: string }>>('/auth/verify-otp', { mobile, otp });
};

export const registerUser = async (payload: any) => {
  return api.post<ApiResponse<UserProfile>>('/auth/register', payload);
};

export const login = async (username: string, password: string) => {
  return api.post<ApiResponse<{ token: string; refreshToken: string; userId: string }>>('/auth/login', { username, password });
};

export const loginWithMpin = async (mobile: string, mpin: string) => {
  return api.post<ApiResponse<{ token: string; refreshToken: string; userId: string }>>('/auth/login-mpin', { mobile, mpin });
};

export const refreshAccessToken = async (refreshToken: string) => {
  return api.post<ApiResponse<{ token: string }>>('/auth/refresh-token', { refreshToken });
};

export const checkUsername = async (username: string) => {
  return api.get<ApiResponse<{ available: boolean }>>(`/auth/check-username?username=${username}`);
};

export const checkEmail = async (email: string) => {
  return api.get<ApiResponse<{ available: boolean }>>(`/auth/check-email?email=${email}`);
};

export default {
  sendMobileOtp,
  verifyMobileOtp,
  registerUser,
  login,
  loginWithMpin,
  refreshAccessToken,
  checkUsername,
  checkEmail,
};
