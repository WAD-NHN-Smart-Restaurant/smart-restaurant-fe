"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/libs/supabase/client";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { tokenManager } from "@/libs/api-request";

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordForm() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const processUpdatePassword = async () => {
      const accessToken = tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();

      console.log("Hash params:", {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
      });

      if (accessToken && refreshToken) {
        // Manually set the session with the tokens from the hash
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        console.log("setSession result:", {
          hasSession: !!data.session,
          error,
        });

        if (error) {
          console.error("Failed to set session:", error);
          setError("Invalid or expired reset link.");
        } else {
          console.log("Session set successfully, user can now reset password");
        }
      } else {
        // No tokens in hash, check if we already have a session
        const { data } = await supabase.auth.getSession();
        console.log("Existing session check:", { hasSession: !!data.session });

        if (!data.session) {
          setError("Invalid or expired reset link. Please request a new one.");
        }
      }
    };

    processUpdatePassword();
  }, [supabase]);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        throw new Error("User not authenticated");
      }

      // 2. Verify old password (RE-AUTH)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      form.reset();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm your password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Password updated successfully!
                </AlertDescription>
              </Alert>
            )}
            <Alert className="bg-orange-50 border-orange-200 text-orange-900">
              <AlertDescription>
                For security reasons, after updating your password, you’ll be
                asked to sign in again with your new password.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
