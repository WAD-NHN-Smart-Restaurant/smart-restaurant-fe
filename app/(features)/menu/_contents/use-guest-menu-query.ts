import { getGuestMenu } from "@/api/guest-menu-api";
import type { GuestMenuQueryParams } from "@/types/guest-menu-type";
import { useSafeQuery } from "@/hooks/use-safe-query";
import Cookies from "js-cookie";
import { GUEST_TOKEN_COOKIE } from "./content";

const GUEST_MENU_QUERY_KEYS = {
  all: ["guest-menu"] as const,
  lists: () => [...GUEST_MENU_QUERY_KEYS.all, "list"] as const,
  list: (params?: GuestMenuQueryParams) =>
    [...GUEST_MENU_QUERY_KEYS.lists(), params] as const,
};

/**
 * Hook to fetch guest menu with filtering, searching, and pagination
 */
export const useGuestMenuQuery = (params?: GuestMenuQueryParams) => {
  // Token is injected via axios interceptor from cookie, so we just need to check if it exists
  const hasToken = !!Cookies.get(GUEST_TOKEN_COOKIE);

  return useSafeQuery(
    GUEST_MENU_QUERY_KEYS.list(params),
    () => getGuestMenu(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: hasToken, // Enable query if token exists in cookie or env
    },
  );
};
