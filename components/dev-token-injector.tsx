"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";

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

    const testToken = process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN;
    const guestToken = Cookies.get("guest_menu_token");

    // Auto-inject test token if not already set
    if (testToken && !guestToken) {
      Cookies.set("guest_menu_token", testToken, {
        expires: 1, // 1 day
        sameSite: "Lax",
      });

      console.log(
        "[Dev Mode] Auto-injected test token: guest_menu_token set in cookie",
      );
    }
  }, []);

  return null; // This component doesn't render anything
}
