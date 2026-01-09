"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmEmailApi } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type ConfirmationState = "loading" | "success" | "error";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [message, setMessage] = useState<string>("Confirming your email...");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Extract parameters from URL
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type") as
          | "email"
          | "signup"
          | "magiclink";

        if (!tokenHash || !type) {
          setState("error");
          setMessage("Invalid confirmation link. Missing required parameters.");
          return;
        }

        // Call the confirmation API
        await confirmEmailApi({
          token_hash: tokenHash,
          type: type,
        });

        setState("success");
        setMessage(
          "Your email has been confirmed successfully! You can now sign in to your account.",
        );

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error: any) {
        console.error("Email confirmation error:", error);
        setState("error");
        setMessage(
          error?.message ||
            "Failed to confirm your email. The link may be expired or invalid.",
        );
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleResendConfirmation = () => {
    router.push("/register?resend=true");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {state === "loading" && (
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            )}
            {state === "success" && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {state === "error" && (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {state === "loading" && "Confirming Email"}
            {state === "success" && "Email Confirmed!"}
            {state === "error" && "Confirmation Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state === "success" && (
            <div className="text-center text-sm text-gray-600">
              You will be redirected to the login page in a few seconds...
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleGoToLogin}
              className="w-full"
              variant={state === "success" ? "default" : "outline"}
            >
              Go to Login
            </Button>

            {state === "error" && (
              <Button
                onClick={handleResendConfirmation}
                variant="outline"
                className="w-full"
              >
                Resend Confirmation Email
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
