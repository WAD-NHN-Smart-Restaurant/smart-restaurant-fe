import React, { Suspense } from "react";
import ResetPasswordContent from "@/app/auth/reset-password/_contents/content";
import { ResetPasswordFallback } from "@/app/auth/reset-password/_component/reset-password-fallback";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
