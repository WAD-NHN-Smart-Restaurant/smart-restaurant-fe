"use client";

import Cookies from "js-cookie";
import { GUEST_TOKEN_COOKIE } from "@/app/(features)/menu/_contents/content";

interface TableInfo {
  tableId: string;
  restaurantId: string;
  tableName?: string;
  tableNumber?: string;
}

/**
 * Hook to decode JWT token and extract table information
 */
export function useTableInfo(): TableInfo | null {
  try {
    // Get token from cookie or env
    const token = Cookies.get(GUEST_TOKEN_COOKIE);

    if (!token) return null;

    // Decode JWT (it's base64 encoded)
    const payload = token.split(".")[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload));

    return {
      tableId: decoded.tableId,
      restaurantId: decoded.restaurantId,
      tableName: decoded.tableName,
      tableNumber: decoded.tableNumber,
    };
  } catch (error) {
    console.error("Failed to decode table token:", error);
    return null;
  }
}
