import apiRequest from "@/libs/api-request";
import type { ApiPaginatedResponse, ApiResponse } from "@/types/api-type";
import { Category } from "@/types/category-type";
import type {
  GuestMenuItem,
  GuestMenuQueryParams,
} from "@/types/guest-menu-type";

const GUEST_MENU_API = {
  GET_MENU: "menu",
  GET_CATEGORIES: "menu/categories",
};

/**
 * Get guest menu with filtering, searching, and pagination
 * Backend returns camelCase data via DTOs
 */
export const getGuestMenu = async (
  params?: GuestMenuQueryParams,
): Promise<ApiPaginatedResponse<GuestMenuItem>> => {
  const response = await apiRequest.get<ApiPaginatedResponse<GuestMenuItem>>(
    GUEST_MENU_API.GET_MENU,
    {
      params: params,
    },
  );
  return response.data;
};

export const getGuestMenuCategories = async (
  token: string,
): Promise<Category[]> => {
  if (!token) {
    console.warn("No token provided for getGuestMenuCategories");
    return [];
  }
  try {
    const response = await apiRequest.get<ApiResponse<Category[]>>(
      GUEST_MENU_API.GET_CATEGORIES,
      { params: { token } },
    );
    // Handle various response structures
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch guest menu categories:", error);
    return [];
  }
};
