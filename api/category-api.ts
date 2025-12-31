import api from "@/libs/api-request";
import { ApiResponse } from "@/types/api-type";
import { Category, CategoryStatus } from "@/types/category-type";
import {
  CreateCategoryForm,
  UpdateCategoryForm,
  CategoryFilterForm,
} from "@/schema/category-schema";

/**
 * Category API routes - calls Next.js API routes which serve as mock backend
 */
const CATEGORIES_API = {
  BASE: "/api/admin/menu/categories",
  BY_ID: (id: string) => `/api/admin/menu/categories/${id}`,
  STATUS: (id: string) => `/api/admin/menu/categories/${id}/status`,
};

/**
 * Get all categories with optional filtering and sorting
 */
export const getCategories = async (
  filters?: CategoryFilterForm,
): Promise<Category[]> => {
  const params = new URLSearchParams();

  if (filters?.search) params.append("search", filters.search);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const queryString = params.toString();
  const url = queryString
    ? `${CATEGORIES_API.BASE}?${queryString}`
    : CATEGORIES_API.BASE;

  const response = await api.get<ApiResponse<Category[]>>(url);

  return response.data.data || [];
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (
  id: string,
): Promise<ApiResponse<Category>> => {
  const response = await api.get<ApiResponse<Category>>(
    CATEGORIES_API.BY_ID(id),
  );
  return response.data;
};

/**
 * Create new category
 */
export const createCategory = async (
  data: CreateCategoryForm,
): Promise<ApiResponse<Category>> => {
  const response = await api.post<CreateCategoryForm, ApiResponse<Category>>(
    CATEGORIES_API.BASE,
    data,
  );
  return response.data;
};

/**
 * Update category details
 */
export const updateCategory = async (
  id: string,
  data: UpdateCategoryForm,
): Promise<ApiResponse<Category>> => {
  const response = await api.put<UpdateCategoryForm, ApiResponse<Category>>(
    CATEGORIES_API.BY_ID(id),
    data,
  );
  return response.data;
};

/**
 * Update category status (activate/deactivate)
 */
export const updateCategoryStatus = async (
  id: string,
  status: CategoryStatus,
): Promise<ApiResponse<Category>> => {
  const response = await api.patch<
    { status: CategoryStatus },
    ApiResponse<Category>
  >(CATEGORIES_API.STATUS(id), { status });
  return response.data;
};

/**
 * Delete category
 */
export const deleteCategory = async (
  id: string,
): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(
    CATEGORIES_API.BY_ID(id),
  );
  return response.data;
};
