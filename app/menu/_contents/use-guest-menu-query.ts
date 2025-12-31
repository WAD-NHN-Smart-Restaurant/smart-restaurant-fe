import { getGuestMenu } from "@/api/guest-menu-api";
import type { GuestMenuQueryParams } from "@/types/guest-menu-type";
import { useSafeQuery } from "@/hooks/use-safe-query";

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
  return useSafeQuery(
    GUEST_MENU_QUERY_KEYS.list(params),
    () => getGuestMenu(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: params?.token ? true : false,
    },
  );
};
