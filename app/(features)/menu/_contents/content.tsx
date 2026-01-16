"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import type {
  GuestCategory,
  GuestMenuItem,
  GuestMenuQueryParams,
} from "@/types/guest-menu-type";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getTableInfo } from "@/api/table-api";

interface MenuFilters {
  search?: string;
  categoryId?: string;
  sortBy?: "popularity" | "price" | "name";
  sortOrder?: "asc" | "desc";
  chefRecommended?: boolean;
}

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useGuestMenuQuery,
  useGuestCategoryMenuQuery,
} from "./use-guest-menu-query";
import { LoadingState } from "../_components/loading-state";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { formatPrice } from "@/utils/format";
import Cookies from "js-cookie";
import Image from "next/image";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

const GUEST_TOKEN_COOKIE = "guest_menu_token";

export function GuestMenuPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tokenFromUrl = searchParams.get("token") || undefined;
  const tableId = searchParams.get("table") || undefined;
  const tableNumberFromUrl = searchParams.get("tableNumber") || undefined;
  const [isMounted, setIsMounted] = useState(false);

  // State to trigger re-render when localStorage is updated
  // Initialize as undefined to avoid hydration mismatch
  const [tableNumber, setTableNumber] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
    // Load table number from localStorage after mount to avoid hydration issues
    if (typeof window !== "undefined") {
      const storedTableNumber = localStorage.getItem("guest_table_number");
      if (storedTableNumber) {
        setTableNumber(storedTableNumber);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle token management on mount
  useEffect(() => {
    if (!isMounted) return;

    const handleTokenManagement = async () => {
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
            expires: 7, // TODO: Adjust expiration as needed
            sameSite: "lax",
          });
        }

        // Decode JWT to get tableId and tableNumber, save to localStorage
        try {
          const payload = JSON.parse(atob(tokenToUse.split(".")[1]));
          console.log("JWT Payload:", payload); // Debug: see full payload

          if (payload.tableId) {
            localStorage.setItem("guest_table_id", payload.tableId);
            console.log("Saved tableId to localStorage:", payload.tableId);
          }

          // Handle table number: use from JWT if available, otherwise fetch from backend
          if (payload.tableNumber) {
            localStorage.setItem(
              "guest_table_number",
              String(payload.tableNumber),
            );
            setTableNumber(String(payload.tableNumber));
            console.log(
              "Saved tableNumber from JWT to localStorage:",
              payload.tableNumber,
            );
          } else if (payload.tableId) {
            // Fetch table info from backend to get table_number
            try {
              const tableInfo = await getTableInfo(payload.tableId);
              if (tableInfo.table_number) {
                localStorage.setItem(
                  "guest_table_number",
                  String(tableInfo.table_number),
                );
                setTableNumber(String(tableInfo.table_number));
                console.log(
                  "Fetched and saved tableNumber from backend:",
                  tableInfo.table_number,
                );
              }
            } catch (error) {
              console.error("Failed to fetch table info:", error);
            }
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

      // Save tableNumber from URL to localStorage (always prioritize URL param)
      if (tableNumberFromUrl) {
        localStorage.setItem("guest_table_number", tableNumberFromUrl);
        setTableNumber(tableNumberFromUrl);
        console.log(
          "Saved tableNumber from URL to localStorage:",
          tableNumberFromUrl,
        );
      }
    };

    handleTokenManagement();
  }, [
    isMounted,
    tokenFromUrl,
    tableNumberFromUrl,
    searchParams,
    pathname,
    router,
  ]);

  // Token is persisted in cookie above when present in URL
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
      if (tableNumber) params.set("tableNumber", tableNumber);

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname, tableId, tableNumber],
  );

  // Memoize query parameters
  const queryParams: GuestMenuQueryParams = useMemo(
    () => ({
      token: token || "", // Pass the actual token from cookie/URL
      categoryId: filters.categoryId,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      chefRecommended: filters.chefRecommended,
      page: 1,
      limit: 100, // Get all items for preview
      table: tableId,
    }),
    [token, filters, tableId],
  );
  const { data, isLoading, isError } = useGuestMenuQuery(queryParams);
  const { data: categoriesData } = useGuestCategoryMenuQuery(token || "");

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
    const items = data?.data?.items || [];
    const categoryMap = new Map<string, GuestCategory>();

    items.forEach((item: GuestMenuItem) => {
      if (!categoryMap.has(item.categoryId)) {
        categoryMap.set(item.categoryId, {
          id: item.categoryId,
          name: item.categoryName,
          description: undefined,
          status: "active" as const,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          displayOrder: 0,
          restaurantId: item.restaurantId,
          menuItems: [],
        });
      }
      categoryMap.get(item.categoryId)!.menuItems.push(item);
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data?.data?.items]);

  // Get filtered categories and apply client-side filtering and sorting
  const categories: GuestCategory[] = useMemo(() => {
    const items = data?.data?.items || [];
    const categoryMap = new Map<string, GuestCategory>();

    // Build categories from menu items
    items.forEach((item: GuestMenuItem) => {
      if (!categoryMap.has(item.categoryId)) {
        categoryMap.set(item.categoryId, {
          id: item.categoryId,
          name: item.categoryName,
          description: undefined,
          status: "active" as const,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          displayOrder: 0,
          restaurantId: item.restaurantId,
          menuItems: [],
        });
      }
      categoryMap.get(item.categoryId)!.menuItems.push(item);
    });

    let categoriesArray = Array.from(categoryMap.values());

    // Apply category filter
    if (filters.categoryId) {
      categoriesArray = categoriesArray.filter(
        (cat: GuestCategory) => cat.id === filters.categoryId,
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      categoriesArray = categoriesArray
        .map((category: GuestCategory) => ({
          ...category,
          menuItems: category.menuItems.filter(
            (item: GuestMenuItem) =>
              item.name.toLowerCase().includes(searchLower) ||
              item.description?.toLowerCase().includes(searchLower),
          ),
        }))
        .filter((category: GuestCategory) => category.menuItems.length > 0);
    }

    // Apply chef recommended filter
    if (filters.chefRecommended) {
      categoriesArray = categoriesArray
        .map((category: GuestCategory) => ({
          ...category,
          menuItems: category.menuItems.filter(
            (item: GuestMenuItem) => item.isChefRecommended,
          ),
        }))
        .filter((category: GuestCategory) => category.menuItems.length > 0);
    }

    // Note: Sorting is handled by the backend API
    // The items are already sorted by the backend based on sortBy and sortOrder params

    return categoriesArray.sort((a, b) => a.name.localeCompare(b.name));
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
            value={filters.sortBy === "popularity" && filters.sortOrder === "desc" ? "popularity" : ""}
            onChange={(e) => {
              if (e.target.value === "popularity") {
                handleFiltersChange({
                  ...filters,
                  sortBy: "popularity",
                  sortOrder: "desc",
                });
              } else {
                handleFiltersChange({
                  ...filters,
                  sortBy: undefined,
                  sortOrder: undefined,
                });
              }
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
            {categories.map((category) =>
              category.menuItems.map((item) => {
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
                        {/* Rating */}
                        <div className="menu-item-rating">
                          ☆☆☆☆☆ (0 reviews)
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
              }),
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}
