import axios from 'axios';
import { errorToast } from '../utils/toast';

// Backend is running on port 5012 (configured in launchSettings.json)
const DEFAULT_BASE_URL = 'http://localhost:5012/api';
const AUTH_TOKEN_KEY = 'medisales.auth.token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds for large exports and reports
  withCredentials: true, // Enable cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Use sessionStorage for per-tab session isolation
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
      return Promise.reject(error);
    }

    let errorMessage = 'An unexpected error occurred. Please try again later.';

    // Handle timeout errors explicitly
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. The operation took too long to complete. Please try again.';
      errorToast(errorMessage);
      return Promise.reject(error);
    }

    if (error.response) {
      // Server responded with a status code outside the 2xx range
      const { status, data } = error.response;
      if (status === 401) {
        // Specific handling for unauthorized access
        errorMessage = 'Unauthorized. Please log in again.';
        // Optionally, redirect to login page
        // window.location.href = '/login';
      } else if (status === 400 && data?.errors) {
        // Handle validation errors from ASP.NET Core
        const validationErrors = Object.values(data.errors).flat();
        errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
      } else if (data?.message) {
        // Use server-provided error message if available
        errorMessage = data.message;
      } else if (status >= 500) {
        errorMessage = 'Server error. Please contact support.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'Network error. Please check your connection.';
    }

    errorToast(errorMessage);

    return Promise.reject(error);
  },
);

export default api;
