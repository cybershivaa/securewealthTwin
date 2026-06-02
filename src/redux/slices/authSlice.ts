import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

export const sendOtp = createAsyncThunk('auth/sendOtp', async (mobile: string, thunkAPI) => {
  const res = await authService.sendMobileOtp(mobile);
  return res.data;
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ mobile, otp }: any, thunkAPI) => {
  const res = await authService.verifyMobileOtp(mobile, otp);
  return res.data;
});

export const register = createAsyncThunk('auth/register', async (payload: any, thunkAPI) => {
  const res = await authService.registerUser(payload);
  return res.data;
});

export const login = createAsyncThunk('auth/login', async ({ username, password }: any, thunkAPI) => {
  const res = await authService.login(username, password);
  return res.data;
});

export const loginWithMpin = createAsyncThunk('auth/loginMpin', async ({ mobile, mpin }: any, thunkAPI) => {
  const res = await authService.loginWithMpin(mobile, mpin);
  return res.data;
});

const slice = createSlice({
  name: 'auth',
  initialState: {
    loading: false,
    error: null as string | null,
    token: null as string | null,
    refreshToken: null as string | null,
    user: null as any,
    isAuthenticated: false,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(sendOtp.fulfilled, (s) => {
        s.loading = false;
      })
      .addCase(sendOtp.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || 'Failed to send OTP';
      })
      .addCase(verifyOtp.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(verifyOtp.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload?.data?.token) {
          s.token = a.payload.data.token;
          s.refreshToken = a.payload.data.refreshToken;
          s.isAuthenticated = true;
        }
      })
      .addCase(verifyOtp.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || 'Invalid OTP';
      })
      .addCase(register.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.data;
      })
      .addCase(register.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || 'Registration failed';
      })
      .addCase(login.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload?.data?.token) {
          s.token = a.payload.data.token;
          s.refreshToken = a.payload.data.refreshToken;
          s.user = { id: a.payload.data.userId };
          s.isAuthenticated = true;
        }
      })
      .addCase(login.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || 'Login failed';
      })
      .addCase(loginWithMpin.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(loginWithMpin.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload?.data?.token) {
          s.token = a.payload.data.token;
          s.refreshToken = a.payload.data.refreshToken;
          s.user = { id: a.payload.data.userId };
          s.isAuthenticated = true;
        }
      })
      .addCase(loginWithMpin.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || 'MPIN login failed';
      });
  },
});

export const { logout, clearError } = slice.actions;
export default slice.reducer;
