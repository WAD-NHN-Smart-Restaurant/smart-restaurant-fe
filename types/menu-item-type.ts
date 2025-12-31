import {
  MenuItemFilterForm,
  MenuItemFormData,
  MenuItemStatus,
} from "@/schema/menu-item-schema";

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  prepTimeMinutes?: number;
  status: MenuItemStatus;
  isChefRecommended?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  menuCategories: {
    name: string;
  };
  menuItemPhotos: MenuItemPhoto[];
  menuItemModifierGroups: ModifierGroup[];
}

export interface MenuItemPhoto {
  id: string;
  menuItemId: string;
  url: string;
  storageKey?: string;
  isPrimary?: boolean;
  createdAt: string;
}

export interface ModifierOption {
  id: string;
  groupId: string;
  name: string;
  priceAdjustment?: number;
  status?: string;
  createdAt: string;
}

export interface ModifierGroup {
  id: string;
  restaurantId: string;
  name: string;
  selectionType: string;
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  displayOrder?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
  modifierOptions: ModifierOption[];
}

// Re-export schema types and enum to maintain compatibility
export { MenuItemStatus } from "@/schema/menu-item-schema";
export type MenuItemFilter = MenuItemFilterForm;
export type CreateMenuItemRequest = MenuItemFormData;
export type UpdateMenuItemRequest = MenuItemFormData;
