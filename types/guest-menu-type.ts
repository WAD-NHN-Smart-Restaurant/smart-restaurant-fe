// Guest Menu Types - Read-only display types
export interface GuestMenuItemPhoto {
  id: string;
  url: string;
  createdAt: string;
  isPrimary: boolean;
  storageKey: string;
  menuItemId: string;
}

export interface GuestModifierOption {
  id: string;
  name: string;
  status: "active" | "inactive";
  groupId: string;
  createdAt: string;
  priceAdjustment: number;
}

export interface GuestModifierGroup {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  isRequired: boolean;
  displayOrder: number;
  restaurantId: string;
  maxSelections: number;
  minSelections: number;
  selectionType: "single" | "multiple";
  modifierOptions: GuestModifierOption[];
}

export interface GuestMenuItemModifierGroup {
  modifierGroups: GuestModifierGroup;
}

export interface GuestMenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  prepTimeMinutes: number;
  status: "available" | "unavailable" | "sold_out";
  isChefRecommended: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  menuItemPhotos: GuestMenuItemPhoto[];
  menuItemModifierGroups: GuestMenuItemModifierGroup[];
}

export interface GuestCategory {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  description?: string;
  displayOrder: number;
  restaurantId: string;
  menuItems: GuestMenuItem[];
}

// Query parameters for API calls
export interface GuestMenuQueryParams {
  table?: string;
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

// API Response types
export interface GuestMenuPagination {
  total: number;
  totalPages: number;
  page?: number;
  limit?: number;
}

export interface GuestMenuResponse {
  success: boolean;
  data: {
    items: GuestCategory[];
    pagination: GuestMenuPagination;
  };
}
