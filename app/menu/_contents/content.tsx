"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  GuestCategory,
  GuestMenuItem,
  GuestMenuQueryParams,
} from "@/types/guest-menu-type";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useGuestMenuQuery } from "./use-guest-menu-query";
import { LoadingState } from "../_components/loading-state";
import { CategorySection } from "../_components/category-section";
import { MenuItemDetailDialog } from "../_components/menu-item-detail-dialog";
import { MenuFiltersSection, MenuFilters } from "../_components/menu-filters";
import Cookies from "js-cookie";

const GUEST_TOKEN_COOKIE = "guest_menu_token";

export function GuestMenuPreviewContent() {
  const [selectedItem, setSelectedItem] = useState<GuestMenuItem | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tokenFromUrl = searchParams.get("token") || undefined;
  const tableId = searchParams.get("table") || undefined;

  // Handle token management on mount
  useEffect(() => {
    if (tokenFromUrl) {
      const existingToken = Cookies.get(GUEST_TOKEN_COOKIE);

      // Save or update token in cookie if it's different
      if (!existingToken || existingToken !== tokenFromUrl) {
        Cookies.set(GUEST_TOKEN_COOKIE, tokenFromUrl, {
          expires: 7, // Cookie expires in 7 days
          sameSite: "lax",
        });
      }

      // Remove token from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("token");

      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      router.replace(newUrl, { scroll: false });
    }
  }, [tokenFromUrl, searchParams, pathname, router]);

  // Get token from cookie if not in URL
  const token = tokenFromUrl || Cookies.get(GUEST_TOKEN_COOKIE);

  // Read filters from URL search params
  const filters: MenuFilters = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      sortBy:
        (searchParams.get("sortBy") as MenuFilters["sortBy"]) || undefined,
      sortOrder:
        (searchParams.get("sortOrder") as MenuFilters["sortOrder"]) ||
        undefined,
      chefRecommended:
        searchParams.get("chefRecommended") === "true" || undefined,
    }),
    [searchParams],
  );

  // Handle filter changes and update URL
  const handleFiltersChange = useCallback(
    (newFilters: MenuFilters) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update or remove each filter param
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== false) {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      // Preserve token and table params if they exist
      if (tableId) params.set("table", tableId);

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname, tableId],
  );

  // Memoize query parameters
  const queryParams: GuestMenuQueryParams = useMemo(
    () => ({
      categoryId: filters.categoryId,
      page: 1,
      limit: 100, // Get all items for preview
      table: tableId,
    }),
    [filters.categoryId, tableId],
  );
  const { data, isLoading, isError } = useGuestMenuQuery(queryParams);

  const handleItemClick = useCallback((item: GuestMenuItem) => {
    setSelectedItem(item);
    setIsItemDialogOpen(true);
  }, []);

  const handleCloseItemDialog = useCallback(() => {
    setIsItemDialogOpen(false);
    setSelectedItem(null);
  }, []);

  // Get categories and apply client-side filtering and sorting
  const categories = useMemo(() => {
    let items = data?.data?.items || [];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items
        .map((category) => ({
          ...category,
          menuItems: category.menuItems.filter(
            (item) =>
              item.name.toLowerCase().includes(searchLower) ||
              item.description?.toLowerCase().includes(searchLower),
          ),
        }))
        .filter((category) => category.menuItems.length > 0);
    }

    // Apply chef recommended filter
    if (filters.chefRecommended) {
      items = items
        .map((category) => ({
          ...category,
          menuItems: category.menuItems.filter(
            (item) => item.isChefRecommended,
          ),
        }))
        .filter((category) => category.menuItems.length > 0);
    }

    // Apply sorting
    if (filters.sortBy && filters.sortOrder) {
      items = items.map((category) => ({
        ...category,
        menuItems: [...category.menuItems].sort((a, b) => {
          let compareValue = 0;
          switch (filters.sortBy) {
            case "name":
              compareValue = a.name.localeCompare(b.name);
              break;
            case "price":
              compareValue = a.price - b.price;
              break;
            case "prepTime":
              compareValue = a.prepTimeMinutes - b.prepTimeMinutes;
              break;
          }
          return filters.sortOrder === "asc" ? compareValue : -compareValue;
        }),
      }));
    }

    return items;
  }, [data?.data?.items, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Guest Menu</h1>
          <p className="text-gray-600 mt-2">Browse our delicious menu items</p>
        </div>

        {/* Menu Filters */}
        <MenuFiltersSection
          filters={filters}
          categories={[]}
          onFiltersChange={handleFiltersChange}
        />

        {/* Content */}
        <div>
          {isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load menu data. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {isLoading && <LoadingState />}

          {!isLoading && !isError && categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {filters.search
                  ? "No menu items found matching your search."
                  : "No menu items available."}
              </p>
            </div>
          )}

          {!isLoading && !isError && categories.length > 0 && (
            <div className="space-y-8">
              {categories.map((category: GuestCategory) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  onItemClick={handleItemClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu Item Detail Dialog */}
      <MenuItemDetailDialog
        item={selectedItem}
        isOpen={isItemDialogOpen}
        onClose={handleCloseItemDialog}
      />
    </div>
  );
}
