"use client";

import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { omit } from "lodash";
import { toast } from "react-toastify";

type SafeInfiniteQueryOptions<TData, TError = unknown> = Omit<
  UseInfiniteQueryOptions<TData, TError, InfiniteData<TData>>,
  "queryFn" | "queryKey"
> & {
  getNextPageParam: (lastPage: TData, allPages: TData[]) => unknown | undefined;
  hideErrorSnackbar?: boolean;
  errorMessage?: string;
  onError?: (error: TError) => void;
  onSuccess?: (data: InfiniteData<TData>) => void;
  onSettled?: (
    data: InfiniteData<TData> | undefined,
    error: TError | null,
  ) => void;
};

/**
 * useSafeInfiniteQuery - wrapper cho useInfiniteQuery với auto error handling và snackbar
 * Uses React Query v5+ approach with stable callbacks
 */
export function useSafeInfiniteQuery<TData, TError = unknown>(
  queryKey: readonly unknown[],
  queryFn: (context: {
    pageParam: unknown;
    signal: AbortSignal;
  }) => Promise<TData>,
  options?: SafeInfiniteQueryOptions<TData, TError>,
): UseInfiniteQueryResult<InfiniteData<TData>, TError> {
  // Create stable callbacks using useCallback
  const handleError = useCallback(
    (error: TError) => {
      if (!options?.hideErrorSnackbar) {
        const message =
          options?.errorMessage ||
          (error as unknown as Error)?.message ||
          "Đã có lỗi xảy ra";
        toast.error(message);
      }

      options?.onError?.(error);
    },
    [options],
  );

  // Create wrapper queryFn that handles callbacks
  const wrappedQueryFn = useCallback(
    async (context: {
      pageParam: unknown;
      signal: AbortSignal;
    }): Promise<TData> => {
      try {
        const data = await queryFn(context);
        // Note: For infinite queries, we can't call onSuccess here as we don't have the full InfiniteData
        // The success callback will be handled when the query state changes
        return data;
      } catch (error) {
        handleError(error as TError);
        throw error;
      }
    },
    [queryFn, handleError],
  );

  const query = useInfiniteQuery<TData, TError, InfiniteData<TData>>({
    queryKey,
    queryFn: wrappedQueryFn,
    ...omit(options, [
      "onError",
      "onSuccess",
      "onSettled",
      "hideErrorSnackbar",
      "errorMessage",
    ]),
  });

  // Handle success callback when query state changes
  if (query.isSuccess && query.data && options?.onSuccess) {
    options.onSuccess(query.data);
  }

  // Handle settled callback when query state changes
  if ((query.isSuccess || query.isError) && options?.onSettled) {
    options.onSettled(query.data, query.error);
  }

  return query;
}
