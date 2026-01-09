import React, { Suspense } from "react";
import AuthCallbackContent from "./_contents/content";
import { AuthCallbackFallback } from "./_component/auth-callback-fallback";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
