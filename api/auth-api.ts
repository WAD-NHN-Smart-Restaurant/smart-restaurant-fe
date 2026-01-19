import api, { tokenManager } from "@/libs/api-request";
import {
  LoginFormData,
  RegisterFormData,
  LoginResponse,
  RegisterResponse,
  User,
  ResetPasswordFormData,
  ResetPasswordResponse,
  UpdatePasswordFormData,
  UpdatePasswordResponse,
  CurrentUserResponse,
} from "@/types/auth-type";
import { ApiResponse } from "@/types/api-type";

// Type for API error response from interceptor
interface ApiErrorPayload {
  status?: boolean;
  message?: string;
  [key: string]: unknown;
}

const AUTH_API = {
  LOGIN: "auth/login",
  REGISTER: "auth/register",
  LOGOUT: "auth/logout",
  REFRESH_TOKEN: "auth/refresh",
  EMAIL_CONFIRM: "auth/confirm",
  ME: "auth/me",
  RESET_PASSWORD: "auth/reset-password",
  UPDATE_PASSWORD: "auth/update-password",
  RESEND_CONFIRMATION: "auth/resend-confirmation",
};

/**
 * Generate guest token for anonymous access
 */
export const generateGuestToken = (tableToken: string): string => {
  // Return the provided table token (QR token from table)
  return tableToken;
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
    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as Error & {
        errors?: Array<{ message?: string }>;
      };
      const message =
        zodError.errors?.[0]?.message || "Registration validation failed";
      const registerError = new Error(message);
      throw registerError;
    }

    // Handle API error payloads from interceptor
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as ApiErrorPayload).message === "string"
    ) {
      throw new Error((error as ApiErrorPayload).message);
    }

    // Handle Error instances
    if (error instanceof Error) {
      throw new Error(error.message || "Registration failed");
    }

    // Handle unknown errors
    console.error("Unknown registration error:", error);
    throw new Error("Registration failed. Please try again.");
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

    // Handle nested response structure
    const userData = response.data?.data?.data || response.data?.data;
    if (!userData) {
      throw new Error("Invalid user data response");
    }
    return userData;
  } catch (error: unknown) {
    // Handle API error payloads from interceptor
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as ApiErrorPayload).message === "string"
    ) {
      console.error(
        "Get current user error:",
        (error as ApiErrorPayload).message,
      );
      throw new Error((error as ApiErrorPayload).message);
    }

    // Handle Error instances
    if (error instanceof Error) {
      console.error("Get current user error:", error.message);
      throw error;
    }

    // Handle unknown errors
    console.error("Get current user error:", error);
    throw new Error("Failed to fetch user data");
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
// export const confirmEmailApi = async (
//   data: EmailConfirmationData,
// ): Promise<ConfirmEmailResponse> => {
//   try {
//     const response = await api.post<
//       EmailConfirmationData,
//       ConfirmEmailResponse
//     >(AUTH_API.EMAIL_CONFIRM, data);
//     return response.data;
//   } catch (error: unknown) {
//     throw error;
//   }
// };

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
