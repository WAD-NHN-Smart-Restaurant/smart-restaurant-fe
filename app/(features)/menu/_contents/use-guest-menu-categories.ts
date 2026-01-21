import { getGuestMenuCategories } from "@/api/guest-menu-api";
import { useSafeQuery } from "@/hooks/use-safe-query";
import Cookies from "js-cookie";
import { GUEST_TOKEN_COOKIE } from "./content";

const GUEST_MENU_CATEGORIES_QUERY_KEYS = {
  all: ["guest-menu-categories"] as const,
  lists: () => [...GUEST_MENU_CATEGORIES_QUERY_KEYS.all, "list"] as const,
  list: (token?: string) =>
    [...GUEST_MENU_CATEGORIES_QUERY_KEYS.lists(), token] as const,
};

/**
 * Hook to fetch guest menu categories
 */
export const useGuestMenuCategoriesQuery = (token?: string) => {
  // Token from parameter or from cookie
  const tokenToUse = token || Cookies.get(GUEST_TOKEN_COOKIE);

  return useSafeQuery(
    GUEST_MENU_CATEGORIES_QUERY_KEYS.list(tokenToUse),
    async () => {
      if (!tokenToUse) {
        console.warn("No guest token available for categories query");
        return [];
      }
      const result = await getGuestMenuCategories(tokenToUse);
      return result ?? [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!tokenToUse, // Enable query if token exists
      retry: 1,
      hideErrorSnackbar: true, // Optional: Don't show error toast for guest routes
    },
  );
};
