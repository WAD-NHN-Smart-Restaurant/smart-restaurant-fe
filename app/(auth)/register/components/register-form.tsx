"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { registerSchema } from "@/schema/auth-schema";
import { RegisterFormData } from "@/types/auth-type";
import { PATHS } from "@/data/path";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import api from "@/libs/api-request";

// Password strength calculator
const calculatePasswordStrength = (password: string) => {
  if (!password) return { strength: 0, label: "", color: "#e0e0e0" };

  let strength = 0;

  // Length check
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;

  // Contains lowercase
  if (/[a-z]/.test(password)) strength += 15;

  // Contains uppercase
  if (/[A-Z]/.test(password)) strength += 15;

  // Contains number
  if (/[0-9]/.test(password)) strength += 15;

  // Contains special character
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

  let label = "";
  let color = "#e0e0e0";

  if (strength < 40) {
    label = "Weak";
    color = "#e74c3c";
  } else if (strength < 70) {
    label = "Medium";
    color = "#f39c12";
  } else {
    label = "Strong";
    color = "#27ae60";
  }

  return { strength: Math.min(strength, 100), label, color };
};

export const RegisterForm = () => {
  const {
    register: registerUser,
    isRegisterLoading,
    registerError,
  } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    label: "",
    color: "#e0e0e0",
  });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const emailValue = form.watch("email");
  const passwordValue = form.watch("password");
  const debouncedEmail = useDebounce(emailValue, 500);

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail || !debouncedEmail.includes("@")) {
        setEmailCheckStatus({
          checking: false,
          available: null,
          message: "",
        });
        return;
      }

      setEmailCheckStatus({ checking: true, available: null, message: "" });

      try {
        // Call API to check if email exists
        const response = await api.get<{
          available?: boolean;
          exists?: boolean;
        }>(`/api/auth/check-email?email=${encodeURIComponent(debouncedEmail)}`);

        if (
          response.data?.available === true ||
          response.data?.exists === false
        ) {
          setEmailCheckStatus({
            checking: false,
            available: true,
            message: "✓ Email is available",
          });
        } else {
          setEmailCheckStatus({
            checking: false,
            available: false,
            message: "Email is already registered",
          });
        }
      } catch {
        // If endpoint doesn't exist, assume available for now
        setEmailCheckStatus({
          checking: false,
          available: true,
          message: "✓ Email is available",
        });
      }
    };

    checkEmail();
  }, [debouncedEmail]);

  // Update password strength
  useEffect(() => {
    const strength = calculatePasswordStrength(passwordValue);
    setPasswordStrength(strength);
  }, [passwordValue]);

  const onSubmit = async (data: RegisterFormData) => {
    if (!agreedToTerms) {
      alert("Please agree to the Terms of Service and Privacy Policy");
      return;
    }
    await registerUser(data);
    form.reset();
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
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>🍽️</div>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>
          Create Account
        </h1>
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
        {/* Error Message */}
        {registerError && (
          <div
            style={{
              padding: "12px",
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              color: "#c00",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            {registerError.message || "Registration failed. Please try again."}
          </div>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "#2c3e50", fontWeight: "500" }}>
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="John Doe"
                      disabled={isRegisterLoading}
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
                      type="email"
                      placeholder="you@example.com"
                      disabled={isRegisterLoading}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {emailCheckStatus.checking && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#95a5a6",
                        marginTop: "4px",
                      }}
                    >
                      Checking availability...
                    </div>
                  )}
                  {!emailCheckStatus.checking &&
                    emailCheckStatus.available === true && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#27ae60",
                          marginTop: "4px",
                        }}
                      >
                        {emailCheckStatus.message}
                      </div>
                    )}
                  {!emailCheckStatus.checking &&
                    emailCheckStatus.available === false && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#e74c3c",
                          marginTop: "4px",
                        }}
                      >
                        {emailCheckStatus.message}
                      </div>
                    )}
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
                      placeholder="Create a password"
                      disabled={isRegisterLoading}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7f8c8d",
                      marginTop: "4px",
                    }}
                  >
                    Min 8 characters with uppercase, lowercase, number, and
                    special character
                  </div>
                  {passwordValue && (
                    <>
                      <div
                        style={{
                          width: "100%",
                          height: "4px",
                          background: "#e0e0e0",
                          borderRadius: "2px",
                          marginTop: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: `${passwordStrength.strength}%`,
                            height: "100%",
                            background: passwordStrength.color,
                            borderRadius: "2px",
                            transition: "all 0.3s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: passwordStrength.color,
                          marginTop: "4px",
                        }}
                      >
                        {passwordStrength.label}
                      </div>
                    </>
                  )}
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: "#2c3e50", fontWeight: "500" }}>
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Confirm your password"
                      disabled={isRegisterLoading}
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

            {/* Terms Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked === true)
                }
                disabled={isRegisterLoading}
              />
              <label
                htmlFor="terms"
                style={{
                  fontSize: "13px",
                  color: "#7f8c8d",
                  cursor: "pointer",
                }}
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  style={{ color: "#e74c3c", textDecoration: "none" }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  style={{ color: "#e74c3c", textDecoration: "none" }}
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isRegisterLoading || !agreedToTerms}
              style={{
                width: "100%",
                padding: "14px",
                background: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "16px",
                cursor:
                  isRegisterLoading || !agreedToTerms
                    ? "not-allowed"
                    : "pointer",
                opacity: isRegisterLoading || !agreedToTerms ? 0.6 : 1,
              }}
            >
              {isRegisterLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
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
          <span style={{ margin: "0 16px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#e0e0e0" }} />
        </div>

        {/* Google Button */}
        <button
          type="button"
          disabled={isRegisterLoading}
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
          Sign up with Google
        </button>

        {/* Sign In Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "14px",
            color: "#7f8c8d",
          }}
        >
          Already have an account?{" "}
          <Link
            href={PATHS.LOGIN}
            style={{ color: "#e74c3c", fontWeight: "600" }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
