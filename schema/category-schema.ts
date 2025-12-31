import { z } from "zod";
import { CategoryStatus } from "@/types/category-type";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  displayOrder: z
    .number()
    .min(1, "Display order must be at least 1")
    .max(9999, "Display order must be less than 10000"),
  status: z.nativeEnum(CategoryStatus),
});

export const categoryFilterSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(CategoryStatus).optional(),
  sortBy: z.enum(["name", "displayOrder", "itemCount", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const createCategorySchema = categorySchema;
export const updateCategorySchema = categorySchema;

export type CategoryForm = z.infer<typeof categorySchema>;
export type CategoryFilterForm = z.infer<typeof categoryFilterSchema>;
export type CreateCategoryForm = z.infer<typeof createCategorySchema>;
export type UpdateCategoryForm = z.infer<typeof updateCategorySchema>;
