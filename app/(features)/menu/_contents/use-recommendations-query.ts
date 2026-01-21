import { getRecommendedMenuItems } from "@/api/guest-menu-api";
import { useSafeQuery } from "@/hooks/use-safe-query";

const RECOMMENDATIONS_QUERY_KEYS = {
  all: ["menu-recommendations"] as const,
  byItem: (itemId: string) =>
    [...RECOMMENDATIONS_QUERY_KEYS.all, itemId] as const,
};

/**
 * Hook to fetch recommended menu items
 */
export const useRecommendationsQuery = (menuItemId: string, limit = 6) => {
  return useSafeQuery(
    RECOMMENDATIONS_QUERY_KEYS.byItem(menuItemId),
    () => getRecommendedMenuItems(menuItemId, limit),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!menuItemId,
    },
  );
};
