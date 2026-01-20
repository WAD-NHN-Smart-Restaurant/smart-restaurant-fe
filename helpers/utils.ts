import { AUTH_PATHS, PROTECTED_PATHS, PUBLIC_PATHS } from "@/data/path";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PathType = "auth" | "protected" | "public";

// Unified path checker function
export const isPathType = (path: string, type: PathType): boolean => {
  switch (type) {
    case "auth":
      return Object.values(AUTH_PATHS).includes(
        path as unknown as (typeof AUTH_PATHS)[keyof typeof AUTH_PATHS],
      );

    case "protected": {
      // Flatten nested PROTECTED_PATHS structure
      const allProtectedPaths: string[] = [];

      Object.values(PROTECTED_PATHS).forEach((value) => {
        if (typeof value === "object" && value !== null) {
          Object.values(value).forEach((nestedValue) => {
            if (typeof nestedValue === "string") {
              allProtectedPaths.push(nestedValue);
            }
          });
        } else if (typeof value === "string") {
          allProtectedPaths.push(value);
        }
      });

      // Check if path matches or starts with any protected path
      return allProtectedPaths.some(
        (protectedPath) =>
          path === protectedPath || path.startsWith(protectedPath + "/"),
      );
    }

    case "public": {
      // Flatten nested PUBLIC_PATHS structure
      const allPublicPaths: string[] = [];

      Object.values(PUBLIC_PATHS).forEach((value) => {
        if (typeof value === "object" && value !== null) {
          Object.values(value).forEach((nestedValue) => {
            if (typeof nestedValue === "string") {
              allPublicPaths.push(nestedValue);
            }
          });
        } else if (typeof value === "string") {
          allPublicPaths.push(value);
        }
      });

      // Check if path matches or starts with any public path
      return allPublicPaths.some(
        (publicPath) =>
          path === publicPath || path.startsWith(publicPath + "/"),
      );
    }

    default:
      return false;
  }
};

export const isAuthPath = (path: string): boolean => isPathType(path, "auth");
export const isProtectedPath = (path: string): boolean =>
  isPathType(path, "protected");
export const isPublicPath = (path: string): boolean =>
  isPathType(path, "public");
