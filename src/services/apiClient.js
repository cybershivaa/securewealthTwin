import axios from 'axios';
import { SecurityUtils } from '../utils/securityUtils';

/**
 * API Configuration and Instances
 */

// API Base URL - Update based on environment
const API_BASE_URL = 'http://api.psb.local:8080/api'; // Development
// const API_BASE_URL = 'https://api.psb.com/api'; // Production

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecurityUtils.getToken('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding token to request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecurityUtils.getToken('refresh');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, newRefreshToken } = response.data;

        await SecurityUtils.storeToken(accessToken, 'access');
        if (newRefreshToken) {
          await SecurityUtils.storeToken(newRefreshToken, 'refresh');
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Handle logout here
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
