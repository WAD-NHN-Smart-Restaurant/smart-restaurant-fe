"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/libs/api-request";
import { createClient } from "@/libs/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type CallbackState = "loading" | "success" | "error";

export default function AuthCallbackContent() {
  const router = useRouter();
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState<string>(
    "Verifying email confirmation...",
  );

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse hash fragment from URL
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        console.log("Hash fragment:", hash);

        if (!hash.includes("access_token")) {
          setState("error");
          setMessage("Invalid confirmation link. Missing access token.");
          return;
        }

        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1)); // Remove '#'
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const expiresIn = params.get("expires_in");

        console.log("Parsed tokens:", {
          accessToken: accessToken ? "✓" : "✗",
          refreshToken: refreshToken ? "✓" : "✗",
          expiresIn,
        });

        if (!accessToken) {
          setState("error");
          setMessage("Invalid confirmation link. Missing access token.");
          return;
        }

        // TODO: Optionally handle expiresIn
        // const expiresInSeconds = parseInt(expiresIn || "3600", 10);
        // const expiresAt = new Date(
        //   Date.now() + expiresInSeconds * 1000,
        // ).toISOString();

        tokenManager.setAccessToken(accessToken);

        // Update Supabase session
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        setState("success");
        setMessage("Your email has been confirmed successfully!");
      } catch (error: any) {
        console.error("Callback error:", error);
        setState("error");
        setMessage(
          error?.message ||
            "Failed to verify email confirmation. Please try again.",
        );
      }
    };

    handleCallback();
  }, []);

  const handleGoToLogin = () => {
    router.push("/login");
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
            {state === "loading" && "Verifying Email"}
            {state === "success" && "Email Confirmed!"}
            {state === "error" && "Confirmation Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            {state === "success" && (
              <Button
                onClick={handleGoToLogin}
                className="w-full"
                variant="default"
              >
                Go to Login
              </Button>
            )}

            {state === "error" && (
              <Button
                onClick={handleGoToLogin}
                className="w-full"
                variant="outline"
              >
                Back to Login
              </Button>
            )}

            {state === "loading" && (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
