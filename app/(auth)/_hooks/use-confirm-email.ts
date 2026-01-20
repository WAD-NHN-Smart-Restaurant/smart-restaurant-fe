import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { resendConfirmationApi } from "@/api/auth-api";

export function useResendConfirmEmail(
  options?: Omit<
    UseMutationOptions<{ success: boolean; message: string }, Error, string>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: (email: string) => resendConfirmationApi(email),
    ...options,
  });
}
