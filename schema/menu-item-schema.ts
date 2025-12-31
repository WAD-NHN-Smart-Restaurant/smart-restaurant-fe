import { z } from "zod";

// Enums
export enum MenuItemStatus {
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
  SOLD_OUT = "sold_out",
}

// Base menu item schema for creation/update
export const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  categoryId: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().optional(),
  prepTimeMinutes: z.number().min(0, "Prep time must be positive").optional(),
  status: z.nativeEnum(MenuItemStatus).default(MenuItemStatus.AVAILABLE),
  isChefRecommended: z.boolean().default(false),
});

// Form schema for menu item creation/edit form
export const menuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  categoryId: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().optional(),
  prepTimeMinutes: z.number().min(0, "Prep time must be positive").optional(),
  status: z
    .string()
    .refine(
      (value) =>
        Object.values(MenuItemStatus).includes(value as MenuItemStatus),
      {
        message: "Invalid status",
      },
    ),
  isChefRecommended: z.boolean(),
});

// Status options for dropdowns
export const MENU_ITEM_STATUS_OPTIONS = [
  { value: MenuItemStatus.AVAILABLE, label: "Available" },
  { value: MenuItemStatus.UNAVAILABLE, label: "Unavailable" },
  { value: MenuItemStatus.SOLD_OUT, label: "Sold Out" },
] as const;

// Filter schema for menu items list
export const menuItemFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.nativeEnum(MenuItemStatus).optional(),
  sortBy: z
    .enum(["name", "price", "createdAt", "popularity"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
});

// Photo upload schema
export const menuItemPhotoSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      "File size must be less than 5MB",
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type,
        ),
      "File must be an image (JPEG, PNG, or WebP)",
    ),
});

// Attach modifier groups schema
export const attachModifierGroupsSchema = z.object({
  groupIds: z.array(z.string().uuid("Invalid group ID")),
});

// Type inference from schemas
export type MenuItemForm = z.infer<typeof menuItemSchema>;
export type MenuItemFormData = z.infer<typeof menuItemFormSchema>;
export type CreateMenuItemForm = z.infer<typeof menuItemSchema>;
export type UpdateMenuItemForm = z.infer<typeof menuItemSchema>;
export type MenuItemFilterForm = z.infer<typeof menuItemFilterSchema>;
export type MenuItemPhotoForm = z.infer<typeof menuItemPhotoSchema>;
export type AttachModifierGroupsForm = z.infer<
  typeof attachModifierGroupsSchema
>;
