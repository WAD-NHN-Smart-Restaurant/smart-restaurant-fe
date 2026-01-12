"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const router = useRouter();
  const { login, isLoginLoading, loginError } = useAuth();

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

  const handleGuestAccess = () => {
    router.push("/menu");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#f8f9fa",
      }}
    >
      {/* Red Header */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
          color: "white",
          padding: "40px 20px",
          textAlign: "center",
          borderBottomLeftRadius: "30px",
          borderBottomRightRadius: "30px",
          position: "relative",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>🍽️</div>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>
          Smart Restaurant
        </h1>
        <p style={{ fontSize: "14px", opacity: 0.9, margin: "4px 0 0 0" }}>
          Scan. Order. Enjoy.
        </p>
      </div>

      {/* White Form Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "white",
          padding: "30px 20px",
          margin: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "600",
            color: "#2c3e50",
            marginBottom: "24px",
          }}
        >
          Welcome Back
        </h2>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "#2c3e50", fontWeight: "500" }}>
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="you@example.com"
                      disabled={isLoginLoading}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                      }}
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
                  <FormLabel style={{ color: "#2c3e50", fontWeight: "500" }}>
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Enter your password"
                      disabled={isLoginLoading}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password Link */}
            <div style={{ textAlign: "right" }}>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: "14px",
                  color: "#e74c3c",
                  textDecoration: "none",
                }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoginLoading}
              style={{
                width: "100%",
                padding: "14px",
                background: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "16px",
                cursor: isLoginLoading ? "not-allowed" : "pointer",
                opacity: isLoginLoading ? 0.6 : 1,
              }}
            >
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
              <div
                style={{
                  padding: "12px",
                  background: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "8px",
                  color: "#c00",
                  fontSize: "14px",
                }}
              >
                {loginError.message}
              </div>
            )}
          </form>
        </Form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "20px 0",
            color: "#95a5a6",
            fontSize: "14px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e0e0e0" }} />
          <span style={{ margin: "0 16px" }}>or continue with</span>
          <div style={{ flex: 1, height: "1px", background: "#e0e0e0" }} />
        </div>

        {/* Google Button */}
        <button
          type="button"
          disabled={isLoginLoading}
          style={{
            width: "100%",
            padding: "12px",
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "15px",
            color: "#2c3e50",
            fontWeight: "500",
          }}
        >
          <span style={{ fontSize: "18px" }}>G</span>
          Continue with Google
        </button>

        {/* Sign Up Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "14px",
            color: "#7f8c8d",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href={PATHS.REGISTER}
            style={{ color: "#e74c3c", fontWeight: "600" }}
          >
            Sign Up
          </Link>
        </div>

        {/* Guest Access Link */}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            type="button"
            onClick={handleGuestAccess}
            disabled={isLoginLoading}
            style={{
              background: "none",
              border: "none",
              color: "#95a5a6",
              fontSize: "14px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            Continue as Guest →
          </button>
        </div>
      </div>
    </div>
  );
};
