import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// Extend InternalAxiosRequestConfig to include _retry flag

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const UNAUTHORIZED_STATUS = 401;
const API_BASE_URL = process.env.NEXT_PUBLIC_HOSTNAME;

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});

// Token management utilities
export const tokenManager = {
  setAccessToken: (token: string) => {
    // Tokens should be set by backend via Set-Cookie header
    // This is only for fallback/local testing purposes
    Cookies.set(ACCESS_TOKEN_KEY, token, {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      expires: 1 / 24, // 1 hour
    });
  },

  getAccessToken: (): string | null => {
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  },

  clearTokens: () => {
    // Cookies.remove(ACCESS_TOKEN_KEY);
  },

  hasValidTokens: (): boolean => {
    return !!tokenManager.getAccessToken();
  },
};
axiosInstance.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === UNAUTHORIZED_STATUS) {
      // window.location.href = `${window.origin}/login`;
    }

    return Promise.reject(error.response.data);
  },
);

// Type-safe API wrapper
const api = {
  get: <TResponse = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<TResponse>> => {
    return axiosInstance.get<TResponse>(url, config);
  },

  post: <TRequest = unknown, TResponse = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<TResponse>> => {
    return axiosInstance.post<TResponse>(url, data, config);
  },

  put: <TRequest = unknown, TResponse = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<TResponse>> => {
    return axiosInstance.put<TResponse>(url, data, config);
  },

  patch: <TRequest = unknown, TResponse = unknown>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<TResponse>> => {
    return axiosInstance.patch<TResponse>(url, data, config);
  },

  delete: <TResponse = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<TResponse>> => {
    return axiosInstance.delete<TResponse>(url, config);
  },
};

// Export typed API instance
export default api;
