"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";
import { loginSchema } from "@/schema/auth-schema";
import { LoginFormData } from "@/types/auth-type";
import Link from "next/link";
import { PATHS } from "@/data/path";
import { GoogleSignInButton } from "./google-sign-in-button";
import { useRouter, useSearchParams } from "next/navigation";

export const LoginForm = () => {
  const { login, isLoginLoading, loginError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  const handleContinueAsGuest = () => {
    // Preserve query parameters when navigating
    const params = new URLSearchParams(searchParams?.toString() || "");
    const queryString = params.toString();
    router.push(`${PATHS.MENU.INDEX}${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your email"
                    disabled={isLoginLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your password"
                    disabled={isLoginLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Button
              variant="link"
              className="p-0 h-auto text-primary hover:text-primary/80"
              disabled={isLoginLoading}
              asChild
            >
              <Link href={PATHS.FORGOT_PASSWORD}>Forgot Password?</Link>
            </Button>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoginLoading}>
            {isLoginLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          {loginError && (
            <FormMessage className="p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {loginError.message}
            </FormMessage>
          )}
        </form>
      </Form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Sign In Button */}
      <GoogleSignInButton />

      {/* Continue as Guest Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleContinueAsGuest}
        disabled={isLoginLoading}
      >
        <User className="mr-2 h-4 w-4" />
        Continue as Guest
      </Button>

      {/* Footer */}
      <div className="text-center space-y-4">
        <div className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Button
            variant="link"
            className="p-0 h-auto text-primary hover:text-primary/80"
            disabled={isLoginLoading}
            asChild
          >
            <Link href={PATHS.REGISTER}>Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
