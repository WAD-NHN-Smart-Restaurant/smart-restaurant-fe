import { useSafeQuery } from "@/hooks/use-safe-query";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} from "@/api/category-api";
import {
  CategoryFilterForm,
  UpdateCategoryForm,
} from "@/schema/category-schema";
import { CategoryStatus } from "@/types/category-type";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeMutation } from "@/hooks/use-safe-mutation";

// Query keys
const CATEGORY_KEYS = {
  all: ["categories"] as const,
  lists: () => [...CATEGORY_KEYS.all, "list"] as const,
  list: (filters: CategoryFilterForm) =>
    [...CATEGORY_KEYS.lists(), filters] as const,
  details: () => [...CATEGORY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...CATEGORY_KEYS.details(), id] as const,
};

/**
 * Hook to fetch categories with filtering
 */
export const useCategoriesQuery = (filters?: CategoryFilterForm) => {
  return useSafeQuery(
    CATEGORY_KEYS.list(filters || {}),
    async () => {
      const response = await getCategories(filters);
      return response;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );
};

/**
 * Hook to fetch single category by ID
 */
export const useCategoryQuery = (id: string, enabled: boolean = true) => {
  return useSafeQuery(
    CATEGORY_KEYS.detail(id),
    async ({ signal: _ }) => {
      const response = await getCategoryById(id);
      return response;
    },
    {
      enabled: !!id && enabled,
      staleTime: 5 * 60 * 1000,
    },
  );
};

/**
 * Hook to create new category
 */
export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useSafeMutation(createCategory, {
    successMessage: "Category created successfully!",
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
    },
  });
};

/**
 * Hook to update category
 */
export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useSafeMutation(
    ({ id, data }: { id: string; data: UpdateCategoryForm }) =>
      updateCategory(id, data),
    {
      successMessage: "Category updated successfully!",
      onSuccess: (_, { id }) => {
        // Invalidate specific category and list
        queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(id) });
        queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
      },
    },
  );
};

/**
 * Hook to update category status
 */
export const useUpdateCategoryStatusMutation = () => {
  const queryClient = useQueryClient();

  return useSafeMutation(
    ({ id, status }: { id: string; status: CategoryStatus }) =>
      updateCategoryStatus(id, status),
    {
      successMessage: "Category status updated successfully!",
      onSuccess: (_, { id }) => {
        // Invalidate specific category and list
        queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(id) });
        queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
      },
    },
  );
};

/**
 * Hook to delete category
 */
export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useSafeMutation(deleteCategory, {
    successMessage: "Category deleted successfully!",
    onSuccess: () => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
    },
  });
};
