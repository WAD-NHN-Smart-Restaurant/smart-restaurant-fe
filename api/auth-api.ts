import api, { tokenManager } from "@/libs/api-request";
import {
  LoginFormData,
  RegisterFormData,
  LoginResponse,
  RegisterResponse,
  User,
  EmailConfirmationData,
  ConfirmEmailResponse,
  ResetPasswordFormData,
  ResetPasswordResponse,
  UpdatePasswordFormData,
  UpdatePasswordResponse,
  CurrentUserResponse,
} from "@/types/auth-type";
import {
  registerResponseSchema,
  confirmEmailResponseSchema,
  resetPasswordResponseSchema,
  updatePasswordResponseSchema,
} from "@/schema/auth-schema";
import { ApiResponse } from "@/types/api-type";

const AUTH_API = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  REFRESH_TOKEN: "/api/auth/refresh",
  EMAIL_CONFIRM: "/api/auth/confirm",
  ME: "/api/auth/me",
  RESET_PASSWORD: "/api/auth/reset-password",
  UPDATE_PASSWORD: "/api/auth/update-password",
  RESEND_CONFIRMATION: "/api/auth/resend-confirmation",
};

/**
 * Login with email and password
 */
export const loginApi = async (
  credentials: LoginFormData,
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginFormData, LoginResponse>(
      AUTH_API.LOGIN,
      credentials,
    );
    console.log("Login response data:", response.data);
    return response.data;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Register a new user
 */
export const registerApi = async (
  userData: RegisterFormData,
): Promise<RegisterResponse> => {
  try {
    const response = await api.post<RegisterFormData, RegisterResponse>(
      AUTH_API.REGISTER,
      userData,
    );
    return response.data;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Logout current user
 */
export const logoutApi = async (): Promise<void> => {
  try {
    await api.post<void>(AUTH_API.LOGOUT);
  } catch (error) {
    console.error("Server logout error:", error);
  } finally {
    // Clear tokens locally
    tokenManager.clearTokens();
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<ApiResponse<CurrentUserResponse>>(
      AUTH_API.ME,
    );

    return response.data.data.data;
  } catch (error: unknown) {
    console.error("Get current user error:", error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    if (!tokenManager.hasValidTokens()) {
      return false;
    }
    console.log("Tokens found, validating...");
    // Try to fetch current user to validate token
    await getCurrentUser();
    console.log("User is authenticated");
    return true;
  } catch {
    // If user fetch fails, clear tokens and return false
    console.log("User is not authenticated, clearing tokens");
    tokenManager.clearTokens();
    return false;
  }
};

/**
 * Confirm email with OTP token
 */
export const confirmEmailApi = async (
  data: EmailConfirmationData,
): Promise<ConfirmEmailResponse> => {
  try {
    const response = await api.post<
      EmailConfirmationData,
      ConfirmEmailResponse
    >(AUTH_API.EMAIL_CONFIRM, data);
    return response.data;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPasswordApi = async (
  data: ResetPasswordFormData,
): Promise<ResetPasswordResponse> => {
  try {
    const response = await api.post<
      ResetPasswordFormData,
      ResetPasswordResponse
    >(AUTH_API.RESET_PASSWORD, data);
    return response.data;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Update password
 */
export const updatePasswordApi = async (
  data: UpdatePasswordFormData,
): Promise<UpdatePasswordResponse> => {
  try {
    const response = await api.post<
      { newPassword: string },
      UpdatePasswordResponse
    >(AUTH_API.UPDATE_PASSWORD, { newPassword: data.newPassword });
    return response.data;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Resend email confirmation
 */
export const resendConfirmationApi = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post<
      { email: string },
      { success: boolean; message: string }
    >(AUTH_API.RESEND_CONFIRMATION, { email });
    return response.data;
  } catch (error: unknown) {
    throw error;
  }
};
