"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { GUEST_TOKEN_COOKIE } from "@/app/(features)/menu/_contents/content";

/**
 * Development Cookie Injector
 * Auto-injects test table token for local development
 */
export function DevTokenInjector() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const guestToken = Cookies.get(GUEST_TOKEN_COOKIE);

    // Auto-inject test token if not already set
    if (!guestToken) {
      return;
    }
  }, []);

  return null; // This component doesn't render anything
}
