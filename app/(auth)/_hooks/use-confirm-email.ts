import { EmailConfirmationData } from "@/types/auth-type";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { confirmEmailApi } from "@/api/auth-api";

export function useConfirmEmail(
  options?: Omit<
    UseMutationOptions<unknown, Error, EmailConfirmationData>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: confirmEmailApi,
    ...options,
  });
}
