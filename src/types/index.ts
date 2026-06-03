export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  fullName?: string;
  mobile?: string;
  email?: string;
}

export type OTPType = {
  code: string;
  expiresAt: string;
};
