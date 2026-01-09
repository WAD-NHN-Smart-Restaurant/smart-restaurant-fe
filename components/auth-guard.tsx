"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthCheck } from "@/context/auth-context";
import { PATHS } from "@/data/path";
import Link from "next/link";
import { isAuthPath, isProtectedPath } from "@/helpers/utils";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, isUnauthenticated } = useAuthCheck();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    const currentPath = pathname;
    const isCurrentPathProtected = isProtectedPath(currentPath);
    const isCurrentPathAuth = isAuthPath(currentPath);

    // If user is not authenticated and trying to access protected route
    if (isUnauthenticated && isCurrentPathProtected) {
      router.push(PATHS.LOGIN);
      return;
    }

    // If user is authenticated and trying to access auth pages (login, register)
    if (isAuthenticated && isCurrentPathAuth) {
      router.push(PATHS.TABLES.INDEX);
      return;
    }
  }, [isAuthenticated, isLoading, isUnauthenticated, pathname, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Render children if access is allowed
  return <>{children}</>;
};

// Loading spinner component
const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

// Protected route wrapper - only for specific protected pages
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { isAuthenticated, isLoading } = useAuthCheck();

  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You need to be logged in to access this page.
          </p>
          <Link
            href={PATHS.LOGIN}
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthCheck();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // TODO: Redirect to ordered history instead of tables
      router.push(PATHS.TABLES.INDEX);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};
