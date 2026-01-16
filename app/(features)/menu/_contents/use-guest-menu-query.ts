import { getGuestMenu, getGuestMenuCategories } from "@/api/guest-menu-api";
import type { GuestMenuQueryParams } from "@/types/guest-menu-type";
import { useSafeQuery } from "@/hooks/use-safe-query";
import Cookies from "js-cookie";

const GUEST_MENU_QUERY_KEYS = {
  all: ["guest-menu"] as const,
  lists: () => [...GUEST_MENU_QUERY_KEYS.all, "list"] as const,
  list: (params?: GuestMenuQueryParams) =>
    [...GUEST_MENU_QUERY_KEYS.lists(), params] as const,
};

const GUEST_MENU_CATEGORY_QUERY_KEYS = {
  all: ["guest-menu-categories"] as const,
  lists: () => [...GUEST_MENU_CATEGORY_QUERY_KEYS.all, "list"] as const,
  list: (token: string) =>
    [...GUEST_MENU_CATEGORY_QUERY_KEYS.lists(), token] as const,
};

const GUEST_TOKEN_COOKIE = "guest_menu_token";

/**
 * Hook to fetch guest menu with filtering, searching, and pagination
 */
export const useGuestMenuQuery = (params?: GuestMenuQueryParams) => {
  // Get token from cookie if not provided
  const hasToken =
    !!params?.token ||
    !!Cookies.get("guest_menu_token") ||
    !!process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN;

  const queryParams = {
    ...params,
    token:
      params?.token ||
      Cookies.get(GUEST_TOKEN_COOKIE) ||
      process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN ||
      "",
  };

  return useSafeQuery(
    GUEST_MENU_QUERY_KEYS.list(queryParams),
    () => getGuestMenu(queryParams),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: hasToken, // Enable query only if token exists
    },
  );
};

export const useGuestCategoryMenuQuery = (token: string) => {
  return useSafeQuery(
    GUEST_MENU_CATEGORY_QUERY_KEYS.list(token),
    () => getGuestMenuCategories(token),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!token, // Enable query only if token and categoryId exist
    },
  );
};
