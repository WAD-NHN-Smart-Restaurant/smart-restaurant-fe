import React, { Suspense } from "react";
import ResetPasswordContent from "./_contents/content";
import { ResetPasswordFallback } from "./_component/reset-password-fallback";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
