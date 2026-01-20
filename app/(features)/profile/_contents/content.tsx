"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_PATHS } from "@/data/path";
import { Loader2 } from "lucide-react";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import ProfileInfo from "../_components/profile-info";
import UpdateNameForm from "../_components/update-name-form";
import UpdateAvatarForm from "../_components/update-avatar-form";
import UpdatePasswordForm from "../_components/update-password-form";
import UpdateEmailForm from "../_components/update-email-form";
import UpdatePhoneForm from "../_components/update-phone-form";

export default function ProfileContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Don't redirect here - auth-context handles showing modal
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push(AUTH_PATHS.LOGIN);
  //   }
  // }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <MobileLayout>
        <div
          className="content"
          style={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MobileLayout>
      <MobileHeader title="My Profile" tableNumber={undefined} />

      <div className="content" style={{ paddingBottom: "80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <ProfileInfo user={user} />
          <UpdateNameForm userId={user.id} />
          <UpdateAvatarForm userId={user.id} />
          <UpdatePasswordForm />
          {/* <UpdateEmailForm /> */}
          <UpdatePhoneForm />
        </div>
      </div>
    </MobileLayout>
  );
}
