import apiRequest from "@/libs/api-request";
import type { ApiPaginatedResponse } from "@/types/api-type";
import type {
  GuestCategory,
  GuestMenuQueryParams,
} from "@/types/guest-menu-type";

const GUEST_MENU_API = {
  GET_MENU: "/api/menu",
};

/**
 * Get guest menu with filtering, searching, and pagination
 */
export const getGuestMenu = async (
  params?: GuestMenuQueryParams,
): Promise<ApiPaginatedResponse<GuestCategory>> => {
  const response = await apiRequest.get<ApiPaginatedResponse<GuestCategory>>(
    GUEST_MENU_API.GET_MENU,
    {
      params: params,
    },
  );
  return response.data;
};
