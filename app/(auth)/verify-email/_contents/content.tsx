"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { useResendConfirmEmail } from "../../_hooks/use-confirm-email";

export default function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [successMessage, setSuccessMessage] = useState<string>("");

  // Use the custom hook
  const {
    mutate: handleResendEmail,
    isPending: isResending,
    error,
  } = useResendConfirmEmail({
    onSuccess: () => {
      setSuccessMessage("Confirmation email sent successfully!");
      // Clear message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    },
    onError: () => {
      setSuccessMessage("");
    },
  });

  const handleResendClick = () => {
    if (!email) {
      setSuccessMessage("Email address not found. Please sign up again.");
      return;
    }
    handleResendEmail(email);
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Mail className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Verify Your Email
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Please follow these steps:
            </p>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Click the confirmation link in the email</li>
              <li>
                You&apos;ll be redirected back here to complete your account
              </li>
            </ol>
          </div>

          {/* Success/Error Message */}
          {(successMessage || error) && (
            <div
              className={`p-4 rounded-lg ${
                successMessage && !error
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex gap-2">
                {successMessage && !error && (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    successMessage && !error
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {successMessage || error?.message}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleResendClick}
              disabled={isResending}
              className="w-full"
            >
              {isResending && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              )}
              {!isResending && "Resend Confirmation Email"}
            </Button>

            <Button
              onClick={handleBackToLogin}
              variant="outline"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground text-center">
            Didn&apos;t receive the email? Check your spam folder or try
            resending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
