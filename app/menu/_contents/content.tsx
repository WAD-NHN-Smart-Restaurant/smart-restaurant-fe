"use client";

import { useCallback, useMemo, useEffect } from "react";
import type {
  GuestCategory,
  GuestMenuItem,
  GuestMenuQueryParams,
} from "@/types/guest-menu-type";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface MenuFilters {
  search?: string;
  categoryId?: string;
  sortByPopularity?: boolean;
  chefRecommended?: boolean;
}

// Extended type for menu items with popularity score from backend
interface GuestMenuItemWithPopularity extends GuestMenuItem {
  popularity?: number;
}
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useGuestMenuQuery } from "./use-guest-menu-query";
import { LoadingState } from "../_components/loading-state";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { formatPrice } from "@/utils/format";
import Cookies from "js-cookie";
import Image from "next/image";

const GUEST_TOKEN_COOKIE = "guest_menu_token";

export function GuestMenuPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tokenFromUrl = searchParams.get("token") || undefined;
  const tableId = searchParams.get("table") || undefined;
  const tableNumber = searchParams.get("tableNumber") || undefined;

  // Handle token management on mount
  useEffect(() => {
    let tokenToUse = tokenFromUrl;

    // For local testing: use test token from env if no URL token
    if (!tokenToUse && process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN) {
      tokenToUse = process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN;
      console.log("Using test token from environment");
    }

    if (tokenToUse) {
      const existingToken = Cookies.get(GUEST_TOKEN_COOKIE);

      // Save or update token in cookie if it's different
      if (!existingToken || existingToken !== tokenToUse) {
        Cookies.set(GUEST_TOKEN_COOKIE, tokenToUse, {
          expires: 7, // Cookie expires in 7 days
          sameSite: "lax",
        });
      }

      // Decode JWT to get tableId and tableNumber, save to localStorage
      try {
        const payload = JSON.parse(atob(tokenToUse.split(".")[1]));
        if (payload.tableId) {
          localStorage.setItem("guest_table_id", payload.tableId);
          console.log("Saved tableId to localStorage:", payload.tableId);
        }
        if (payload.tableNumber) {
          localStorage.setItem(
            "guest_table_number",
            String(payload.tableNumber),
          );
          console.log(
            "Saved tableNumber to localStorage:",
            payload.tableNumber,
          );
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
      }

      // Remove token from URL (only if it came from URL)
      if (tokenFromUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("token");

        const newUrl = params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname;

        router.replace(newUrl, { scroll: false });
      }
    }

    // Save tableNumber from URL to localStorage (override if provided)
    if (tableNumber) {
      localStorage.setItem("guest_table_number", tableNumber);
    }
  }, [tokenFromUrl, tableNumber, searchParams, pathname, router]);

  // Token is persisted in cookie above when present in URL

  // Read filters from URL search params
  const filters: MenuFilters = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      sortByPopularity:
        searchParams.get("sortByPopularity") === "true" || undefined,
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
      if (tableNumber) params.set("tableNumber", tableNumber);

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname, tableId, tableNumber],
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

  const handleItemClick = useCallback(
    (item: GuestMenuItem) => {
      const params = new URLSearchParams();
      if (tableId) params.set("table", tableId);
      if (tableNumber) params.set("tableNumber", tableNumber);
      const queryString = params.toString();
      router.push(`/menu/${item.id}${queryString ? `?${queryString}` : ""}`);
    },
    [router, tableId, tableNumber],
  );

  // Get all categories for tabs (unfiltered)
  const allCategories = useMemo(() => {
    return data?.data?.items || [];
  }, [data?.data?.items]);

  // Get filtered categories and apply client-side filtering and sorting
  const categories = useMemo(() => {
    let items = data?.data?.items || [];

    // Apply category filter
    if (filters.categoryId) {
      items = items.filter((cat) => cat.id === filters.categoryId);
    }

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

    // Apply popularity sorting (descending - most popular first)
    if (filters.sortByPopularity) {
      items = items.map((category) => ({
        ...category,
        menuItems: [...category.menuItems].sort((a, b) => {
          // Sort by popularity score from backend
          const aScore = (a as GuestMenuItemWithPopularity).popularity || 0;
          const bScore = (b as GuestMenuItemWithPopularity).popularity || 0;
          return bScore - aScore;
        }),
      }));
    }

    return items;
  }, [data?.data?.items, filters]);

  return (
    <MobileLayout>
      <MobileHeader title="Smart Restaurant" tableNumber={tableNumber} />

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search menu items..."
          value={filters.search || ""}
          onChange={(e) =>
            handleFiltersChange({
              ...filters,
              search: e.target.value || undefined,
            })
          }
        />
      </div>

      {/* Sort and Filter Bar */}
      <div className="px-4 py-3 bg-white border-b space-y-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
              filters.chefRecommended
                ? "bg-yellow-500 text-white border-yellow-500"
                : "bg-white text-gray-700 border-gray-300"
            }`}
            onClick={() =>
              handleFiltersChange({
                ...filters,
                chefRecommended: !filters.chefRecommended,
              })
            }
          >
            ⭐ Chef Recommend
          </button>
          <select
            className="px-3 py-1.5 rounded-full text-sm border border-gray-300 bg-white"
            value={filters.sortByPopularity ? "popularity" : ""}
            onChange={(e) => {
              handleFiltersChange({
                ...filters,
                sortByPopularity: e.target.value === "popularity" || undefined,
              });
            }}
          >
            <option value="">Sort by</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        <button
          className={`category-tab ${!filters.categoryId ? "active" : ""}`}
          onClick={() =>
            handleFiltersChange({ ...filters, categoryId: undefined })
          }
        >
          All
        </button>
        {allCategories.map((category: GuestCategory) => (
          <button
            key={category.id}
            className={`category-tab ${filters.categoryId === category.id ? "active" : ""}`}
            onClick={() =>
              handleFiltersChange({ ...filters, categoryId: category.id })
            }
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="content menu-list" style={{ paddingBottom: "80px" }}>
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
          <>
            {categories.map((category: GuestCategory) =>
              category.menuItems.map((item) => {
                // Get primary photo or first photo
                const primaryPhoto =
                  item.menuItemPhotos.find((photo) => photo.isPrimary) ||
                  item.menuItemPhotos[0];

                const isAvailable = item.status === "available";
                return (
                  <div
                    key={item.id}
                    className={`menu-item ${!isAvailable ? "opacity-60 cursor-not-allowed" : ""}`}
                    onClick={() => isAvailable && handleItemClick(item)}
                    style={!isAvailable ? { pointerEvents: "none" } : {}}
                  >
                    <div className="menu-item-image">
                      {primaryPhoto?.url ? (
                        <Image
                          src={primaryPhoto.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="100px"
                        />
                      ) : (
                        <span className="text-4xl">🍽️</span>
                      )}
                    </div>
                    <div className="menu-item-info">
                      <div>
                        <div className="menu-item-name">{item.name}</div>
                        {/* Rating */}
                        <div className="menu-item-rating">
                          ☆☆☆☆☆ (0 reviews)
                        </div>
                        {/* Status Badge */}
                        <span
                          className={`menu-item-status ${item.status === "available" ? "available" : "sold-out"}`}
                        >
                          ●{" "}
                          {item.status === "available"
                            ? "Available"
                            : item.status === "out_of_stock"
                              ? "Sold Out"
                              : "Unavailable"}
                        </span>
                      </div>
                      <div className="menu-item-bottom">
                        <span className="menu-item-price">
                          {formatPrice(item.price)}
                        </span>
                        {item.status === "available" && (
                          <button
                            className="add-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }),
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
