"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import type {
  GuestMenuItem,
  GuestMenuQueryParams,
} from "@/types/guest-menu-type";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useGuestMenuCategoriesQuery } from "./use-guest-menu-categories";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useGuestMenuQuery } from "./use-guest-menu-query";
import { LoadingState } from "../_components/loading-state";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { formatPrice } from "@/utils/format";
import Cookies from "js-cookie";
import { PopularityIndicator } from "../_components/popularity-indicator";
import Image from "next/image";

interface MenuFilters {
  search?: string;
  categoryId?: string;
  sortBy?: "name" | "price" | "popularity";
  sortOrder?: "asc" | "desc";
  chefRecommended?: boolean;
}

export const GUEST_TOKEN_COOKIE = "guest_menu_token";

export function GuestMenuPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tokenFromUrl = searchParams.get("token") || undefined;
  const tableIdFromUrl =
    searchParams.get("table") ||
    process.env.NEXT_PUBLIC_TEST_TABLE_ID ||
    undefined;
  const tableNumberFromUrl =
    searchParams.get("tableNumber") ||
    process.env.NEXT_PUBLIC_TEST_TABLE_NUMBER ||
    undefined;

  const [tableId] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      return (
        tableIdFromUrl || localStorage.getItem("guest_table_id") || undefined
      );
    }
    return tableIdFromUrl;
  });
  // State to trigger re-render when localStorage is updated
  const [tableNumber, setTableNumber] = useState<string | undefined>(() => {
    // Initialize from localStorage on first render
    if (typeof window !== "undefined") {
      return localStorage.getItem("guest_table_number") || undefined;
    }
    return undefined;
  });

  // Handle token management on mount
  useEffect(() => {
    const handleTokenManagement = async () => {
      if (tokenFromUrl) {
        console.log("Found token in URL:", tokenFromUrl);
        const existingToken = Cookies.get(GUEST_TOKEN_COOKIE);
        console.log("Found token in cookie:", existingToken);
        // Save or update token in cookie if it's different
        if (!existingToken || existingToken !== tokenFromUrl) {
          Cookies.set(GUEST_TOKEN_COOKIE, tokenFromUrl, {
            expires: 7, // Cookie expires in 7 days
            sameSite: "lax",
          });
        }

        if (tableId) {
          localStorage.setItem("guest_table_id", tableId);
          console.log("Saved tableId from URL to localStorage:", tableId);
        }
        if (tableNumberFromUrl) {
          localStorage.setItem("guest_table_number", tableNumberFromUrl);
          setTableNumber(tableNumberFromUrl);

          //Remove token from URL (only if it came from URL)
          const params = new URLSearchParams(searchParams.toString());
          params.delete("token");

          const newUrl = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname;

          router.replace(newUrl, { scroll: false });
        }
      }
    };

    handleTokenManagement();
    // }, [tokenFromUrl, tableNumberFromUrl, searchParams, pathname, router]);
  }, [tokenFromUrl, router]);

  // Token is persisted in cookie above when present in URL

  // Read filters from URL search params
  const filters: MenuFilters = useMemo(
    () => ({
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      sortBy:
        (searchParams.get("sortBy") as "name" | "price" | "popularity") ||
        undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
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

  // Memoize query parameters for menu items
  const queryParams: GuestMenuQueryParams = useMemo(
    () => ({
      search: filters.search,
      categoryId: filters.categoryId,
      chefRecommended: filters.chefRecommended,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: 1,
      limit: 100, // Get all items for preview
      table: tableId,
    }),
    [
      filters.search,
      filters.categoryId,
      filters.chefRecommended,
      filters.sortBy,
      filters.sortOrder,
      tableId,
    ],
  );

  // Get token from cookie
  const token = Cookies.get(GUEST_TOKEN_COOKIE);

  // Fetch menu items
  const {
    data: itemsData,
    isLoading: isItemsLoading,
    isError: isItemsError,
  } = useGuestMenuQuery(queryParams);

  // Fetch categories separately
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useGuestMenuCategoriesQuery(token);

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

  // Get all categories (unfiltered)
  const allCategories = useMemo(() => {
    if (!categoriesData) return [];
    return Array.isArray(categoriesData) ? categoriesData : [];
  }, [categoriesData]);

  // Get menu items from backend - already filtered and sorted
  const menuItems = useMemo(() => {
    if (!itemsData?.data?.items) {
      return [];
    }
    // Backend returns flat array of menu items, already filtered and sorted
    return itemsData.data.items;
  }, [itemsData]);

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
            value={filters.sortBy || ""}
            onChange={(e) => {
              const newSortBy = e.target.value as
                | "name"
                | "price"
                | "popularity"
                | "";
              handleFiltersChange({
                ...filters,
                sortBy: newSortBy || undefined,
                // Reset sortOrder if clearing sortBy
                sortOrder: newSortBy ? filters.sortOrder || "asc" : undefined,
              });
            }}
          >
            <option value="">Sort by</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="popularity">Popularity</option>
          </select>
          {filters.sortBy && (
            <button
              className="px-3 py-1.5 rounded-full text-sm border border-gray-300 bg-white whitespace-nowrap"
              onClick={() =>
                handleFiltersChange({
                  ...filters,
                  sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                })
              }
            >
              {filters.sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          )}
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
        {allCategories.map((category) => (
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
        {(isItemsError || isCategoriesError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load menu data. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {(isItemsLoading || isCategoriesLoading) && <LoadingState />}

        {!isItemsLoading &&
          !isCategoriesLoading &&
          !isItemsError &&
          !isCategoriesError &&
          menuItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {filters.search
                  ? "No menu items found matching your search."
                  : "No menu items available."}
              </p>
            </div>
          )}

        {!isItemsLoading &&
          !isCategoriesLoading &&
          !isItemsError &&
          !isCategoriesError &&
          menuItems.length > 0 && (
            <>
              {menuItems.map((item) => {
                // Get primary photo or first photo
                const primaryPhoto =
                  item.menuItemPhotos?.find((photo) => photo.isPrimary) ||
                  item.menuItemPhotos?.[0];

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
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<span class="text-4xl">🍽️</span>';
                            }
                          }}
                        />
                      ) : (
                        <span className="text-4xl">🍽️</span>
                      )}
                    </div>
                    <div className="menu-item-info">
                      <div>
                        <div className="menu-item-name">{item.name}</div>
                        {/* Rating & Popularity */}
                        <div
                          className="menu-item-rating"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {item.averageRating && item.reviewCount ? (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span style={{ color: "#f59e0b" }}>
                                {"★".repeat(Math.round(item.averageRating))}
                                {"☆".repeat(5 - Math.round(item.averageRating))}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                ({item.reviewCount}{" "}
                                {item.reviewCount === 1 ? "review" : "reviews"})
                              </span>
                            </span>
                          ) : (
                            <span
                              style={{ fontSize: "0.875rem", color: "#9ca3af" }}
                            >
                              ☆☆☆☆☆ (0 reviews)
                            </span>
                          )}
                          {item.popularity && item.popularity > 0 && (
                            <PopularityIndicator
                              popularity={item.popularity}
                              variant="inline"
                            />
                          )}
                        </div>
                        {/* Status Badge */}
                        <span
                          className={`menu-item-status ${item.status === "available" ? "available" : item.status === "sold_out" ? "sold-out" : "unavailable"}`}
                        >
                          ●{" "}
                          {item.status === "available"
                            ? "Available"
                            : item.status === "sold_out"
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
              })}
            </>
          )}
      </div>
    </MobileLayout>
  );
}
