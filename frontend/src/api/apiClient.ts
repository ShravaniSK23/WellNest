import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '../types/api.types';

// Default backend URL per prompt instructions: http://localhost:4000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Listener for session expiration events
type SessionExpiryListener = (reason?: string) => void;
const sessionExpiryListeners: Set<SessionExpiryListener> = new Set();

export const subscribeToSessionExpiry = (listener: SessionExpiryListener) => {
  sessionExpiryListeners.add(listener);
  return () => {
    sessionExpiryListeners.delete(listener);
  };
};

export const notifySessionExpiry = (reason?: string) => {
  sessionExpiryListeners.forEach((listener) => listener(reason));
};

// Request interceptor: Attach stored token if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('wellnest_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle error responses & session timeouts
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    const isRegisterEndpoint = error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isLoginEndpoint && !isRegisterEndpoint) {
      const errorCode = error.response.data?.error?.code;
      const message = error.response.data?.error?.message || 'Your session has expired. Please log in again.';

      if (
        errorCode === 'SESSION_TIMEOUT' ||
        errorCode === 'SESSION_REVOKED' ||
        errorCode === 'INVALID_TOKEN' ||
        errorCode === 'NO_TOKEN' ||
        !errorCode
      ) {
        notifySessionExpiry(message);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to safely extract user-friendly error message from API error
 */
export const formatApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    if (apiError?.message) {
      return apiError.message;
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    if (error.response?.status === 423) {
      return apiError?.error?.message || 'Account locked due to failed attempts. Please try again later.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection to the server.';
    }
    if (!error.response) {
      return 'Unable to connect to the WellNest server. Please ensure the backend is running at http://localhost:4000.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
