import React, { Suspense } from "react";
import VerifyEmailContent from "./_contents/content";
import { VerifyEmailFallback } from "./_component/verify-email-fallback";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
