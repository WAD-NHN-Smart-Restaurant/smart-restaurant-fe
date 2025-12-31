"use client";

// Custom hook that wraps useMutation to provide error handling and user feedback

import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "react-toastify";

export function useSafeMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<
    UseMutationOptions<TData, unknown, TVariables>,
    "mutationFn"
  > & {
    hideErrorSnackbar?: boolean;
    errorMessage?: string;
    successMessage?: string;
  },
): UseMutationResult<TData, unknown, TVariables> {
  return useMutation<TData, unknown, TVariables>({
    mutationFn,
    ...options,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any, variables, context, mutation) => {
      if (!options?.hideErrorSnackbar) {
        const message =
          options?.errorMessage || err?.message || "Đã có lỗi xảy ra";

        toast.error(message);
      }
      // Pass all 4 arguments if user provided onError
      options?.onError?.(err, variables, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      // Pass all 4 arguments if user provided onSuccess
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
