"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
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
import { createClient } from "@/libs/supabase/client";
import { AUTH_PATHS, PATHS } from "@/data/path";
import { LoginFormData, RegisterFormData, User } from "@/types/auth-type";
import { AuthRequiredModal } from "@/components/auth-required-modal";

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
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Query keys
const AUTH_QUERY_KEYS = {
  user: ["auth", "user"] as const,
  status: ["auth", "status"] as const,
};

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_ROUTES = [
  AUTH_PATHS.LOGIN,
  AUTH_PATHS.REGISTER,
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/callback",
];

const GUEST_ROUTES = [
  PATHS.MENU.INDEX,
  "/checkout",
  "/order-info",
];

const isGuestRoute = (pathname: string) => {
  return GUEST_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const supabase = createClient(); // Create client inside component
  const [showAuthModal, setShowAuthModal] = useState(false);

  console.log("AuthProvider mounting, pathname:", pathname);
  
  // Check authentication status (skip for public routes and guest routes)
  const { data: isAuthenticated = false, isLoading: isAuthLoading } =
    useSafeQuery(AUTH_QUERY_KEYS.status, checkAuthStatus, {
      enabled: true, // Skip auth check on guest routes
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
      hideErrorSnackbar: true, // Silent auth check
    });

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    // Extra safety: Never redirect if there's a hash in the URL (token exchange)
    const hasHashFragment =
      typeof window !== "undefined" && window.location.hash.length > 0;

    // Don't show modal on auth pages or guest-allowed routes
    const isAuthPage = AUTH_ROUTES.some((route) => pathname?.startsWith(route));

    if (
      !isAuthLoading &&
      !isAuthenticated &&
      !hasHashFragment &&
      !isAuthPage // Don't show modal on auth pages
      && !isGuestRoute(pathname) // Don't show modal on guest routes
    ) {
      console.log("User not authenticated, showing auth modal");
      setShowAuthModal(true);
    } else if (isAuthPage || isGuestRoute(pathname)) {
      // Close modal if user navigates to auth or guest pages
      setShowAuthModal(false);
    }
  }, [isAuthLoading, isAuthenticated, pathname]);

  // Get current user (skip for public routes and guest routes)
  const { data: user = null, isLoading: isUserLoading } = useSafeQuery(
    AUTH_QUERY_KEYS.user,
    getCurrentUser,
    {
      enabled: isAuthenticated, // Only fetch user when authenticated
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

      // TODO: Redirect to ordered history instead of menu
      // router.refresh();
      router.push(PATHS.MENU.INDEX);
    },
  });

  // Register mutation
  const registerMutation = useSafeMutation(registerApi, {
    successMessage: "Registration successful! Please verify your email.",
    errorMessage: "Registration failed. Please try again.",
    onSuccess: async (data) => {
      // Get email from response
      const email = data?.data?.user?.email || "";

      // Invalidate and refetch auth queries
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });

      // Redirect to verify-email page
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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

  // Supabase auth state change listener
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "Supabase Auth Event:",
        event,
        "Session:",
        session?.user?.email,
        "Pathname:",
        pathname,
      );
      if (event === "INITIAL_SESSION") {
        // handle initial session
        if (session) {
          // User is already authenticated
          queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
          queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
        }
      } else if (event === "SIGNED_IN") {
        // handle sign in event
        console.log(
          "SIGNED_IN event - current path:",
          window.location.pathname,
        );
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });

        // router.refresh();

        // const currentPath = window.location.pathname;
        // if (!currentPath.startsWith('/reset-password')) {
        //   // TODO: Redirect to ordered history instead of menu
        //   router.push(PATHS.MENU.INDEX);
        // } else {
        //   console.log('Staying on reset-password page');
        // }
      } else if (event === "SIGNED_OUT") {
        // handle sign out event
        console.log("SIGNED_OUT event - pathname:", window.location.pathname);

        // Don't redirect if we're on a recovery/callback page (token exchange in progress)
        const currentPath = window.location.pathname;
        const isOnRecoveryPage =
          currentPath.includes("/reset-password") ||
          currentPath.includes("/callback");
        const hasHashToken = window.location.hash.includes("access_token");

        if (!isOnRecoveryPage && !hasHashToken) {
          console.log("Redirecting to login from SIGNED_OUT");
          queryClient.clear();
          router.push(AUTH_PATHS.LOGIN);
        } else {
          console.log("Staying on page - token exchange in progress");
        }
      } else if (event === "PASSWORD_RECOVERY") {
        // handle password recovery event
        // Redirect to reset password page
        router.push("/reset-password");
      } else if (event === "TOKEN_REFRESHED") {
        // handle token refreshed event
        // Token has been refreshed, update queries
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.status });
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
      } else if (event === "USER_UPDATED") {
        // handle user updated event
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
      }
    });

    // Cleanup function to unsubscribe
    return () => {
      data.subscription.unsubscribe();
    };
  }, [queryClient, router, supabase]);

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
    <>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
      <AuthRequiredModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
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
