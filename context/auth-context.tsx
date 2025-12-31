"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSafeQuery } from "@/hooks/use-safe-query";
import { useSafeMutation } from "@/hooks/use-safe-mutation";
import {
  loginApi,
  registerApi,
  logoutApi,
  getCurrentUser,
  checkAuthStatus,
} from "@/api/auth-api";
import { tokenManager } from "@/libs/api-request";
import { AUTH_PATHS, PATHS } from "@/data/path";
import { LoginFormData, RegisterFormData, User } from "@/types/auth-type";

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  isLoginLoading: boolean;
  isRegisterLoading: boolean;
  isLogoutLoading: boolean;
  loginError: Error | null;
  registerError: Error | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Query keys
const AUTH_QUERY_KEYS = {
  user: ["auth", "user"] as const,
  status: ["auth", "status"] as const,
};

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check authentication status
  const { data: isAuthenticated = false, isLoading: isAuthLoading } =
    useSafeQuery(AUTH_QUERY_KEYS.status, checkAuthStatus, {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
      hideErrorSnackbar: true, // Silent auth check
    });

  // Get current user
  const { data: user = null, isLoading: isUserLoading } = useSafeQuery(
    AUTH_QUERY_KEYS.user,
    getCurrentUser,
    {
      enabled: isAuthenticated,
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: false,
      hideErrorSnackbar: true, // Silent user fetch
    },
  );

  // Login mutation
  const loginMutation = useSafeMutation(loginApi, {
    successMessage: "Login successful!",
    errorMessage: "Login failed. Please check your credentials.",
    onSuccess: async () => {
      // Invalidate and refetch auth queries
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });

      // Redirect to dashboard
      router.refresh();
      router.push(PATHS.TABLES.INDEX);
    },
  });

  // Register mutation
  const registerMutation = useSafeMutation(registerApi, {
    successMessage: "Registration successful! Please login.",
    errorMessage: "Registration failed. Please try again.",
    onSuccess: async () => {
      // Invalidate and refetch auth queries
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });

      // Redirect to login
      router.push(AUTH_PATHS.LOGIN);
    },
  });

  // Logout mutation
  const logoutMutation = useSafeMutation(logoutApi, {
    successMessage: "Logged out successfully",
    hideErrorSnackbar: true, // Handle error silently
    onSuccess: async () => {
      // Clear all cached data
      queryClient.clear();

      // Redirect to login
      router.push(AUTH_PATHS.LOGIN);
    },
    onError: () => {
      // Even if logout fails on server, clear local data and redirect
      queryClient.clear();
      router.push(AUTH_PATHS.LOGIN);
    },
  });

  // Initialize auth state on mount
  useEffect(() => {
    // Check if tokens exist in storage
    if (tokenManager.hasValidTokens()) {
      // Tokens exist, query will automatically run due to enabled: isAuthenticated
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
    }
  }, [queryClient]);

  // Auth functions
  const login = async (credentials: LoginFormData) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: RegisterFormData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isAuthLoading || isUserLoading,
    login,
    register,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error as Error | null,
    registerError: registerMutation.error as Error | null,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook for authentication checks
export const useAuthCheck = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isUnauthenticated: !isAuthenticated && !isLoading,
  };
};
