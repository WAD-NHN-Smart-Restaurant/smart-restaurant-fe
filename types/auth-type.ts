import { z } from "zod";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  authTokenSchema,
  userSchema,
  loginResponseSchema,
  registerResponseSchema,
  refreshTokenResponseSchema,
  currentUserResponseSchema,
  apiErrorSchema,
  emailConfirmationSchema,
  confirmEmailResponseSchema,
  resetPasswordResponseSchema,
  updatePasswordResponseSchema,
} from "@/schema/auth-schema";

// Type exports inferred from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type AuthTokens = z.infer<typeof authTokenSchema>;
export type User = z.infer<typeof userSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type EmailConfirmationData = z.infer<typeof emailConfirmationSchema>;
export type ConfirmEmailResponse = z.infer<typeof confirmEmailResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
export type UpdatePasswordResponse = z.infer<
  typeof updatePasswordResponseSchema
>;
