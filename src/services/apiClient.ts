import axios from 'axios';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach tokens
api.interceptors.request.use((cfg) => {
  // Attach bearer token if available from storage
  // In production, use react-native-secure-storage or similar
  const token = localStorage?.getItem?.('accessToken');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Handle 401 - token expired
    if (err.response?.status === 401) {
      // Trigger token refresh or logout
      // dispatch logout or refresh token action
    }
    return Promise.reject(err);
  }
);

export default api;

