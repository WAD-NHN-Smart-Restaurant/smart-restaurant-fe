/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "react-toastify";

type SafeQueryOptions<TData> = Omit<
  UseQueryOptions<TData, unknown, TData>,
  "queryFn" | "queryKey"
> & {
  hideErrorSnackbar?: boolean;
  errorMessage?: string;
  onError?: (error: any) => void;
  onSuccess?: (data: TData) => void;
  onSettled?: (data: TData | undefined, error: any) => void;
};

/**
 * useSafeQuery - wrapper cho useQuery với auto error handling và snackbar
 * Uses React Query v5+ approach with stable callbacks
 */
export function useSafeQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: ({ signal }: { signal: AbortSignal }) => Promise<TData>,
  options?: SafeQueryOptions<TData>,
): UseQueryResult<TData, unknown> {
  const {
    hideErrorSnackbar,
    errorMessage,
    onError,
    onSuccess,
    onSettled,
    ...queryOptions
  } = options || {};

  const handleError = useCallback(
    (error: any) => {
      if (!hideErrorSnackbar) {
        const message = errorMessage || error?.message || "Đã có lỗi xảy ra";
        toast.error(message);
      }

      if (onError) {
        onError(error);
      }
    },
    [hideErrorSnackbar, errorMessage, onError],
  );

  const handleSettled = useCallback(
    (data: TData | undefined, error: any) => {
      if (onSettled) {
        onSettled(data, error);
      }
    },
    [onSettled],
  );

  const wrappedQueryFn = useCallback(
    async ({ signal }: { signal: AbortSignal }): Promise<TData> => {
      try {
        const result = await queryFn({ signal });
        onSuccess?.(result);
        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [queryFn, handleError, onSuccess],
  );

  const query = useQuery<TData, unknown>({
    queryKey,
    queryFn: wrappedQueryFn,
    ...queryOptions,
    retry: queryOptions?.retry ?? false,
  });

  if ((query.isSuccess || query.isError) && onSettled) {
    handleSettled(query.data, query.error);
  }

  return query;
}
