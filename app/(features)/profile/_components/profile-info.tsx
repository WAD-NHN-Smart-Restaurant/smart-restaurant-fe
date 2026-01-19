"use client";

import { User } from "@/types/auth-type";
import { useProfile } from "@/app/(features)/profile/_contents/use-profile";
import { Mail, Phone, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileInfoProps {
  user: User;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const { data: profile } = useProfile(user.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* User Avatar & Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
          paddingBottom: "20px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Avatar style={{ width: "70px", height: "70px" }}>
          <AvatarImage src={profile?.avatarUrl || undefined} />
          <AvatarFallback
            style={{
              background: "#e74c3c",
              color: "white",
              fontSize: "24px",
              fontWeight: "600",
            }}
          >
            {getInitials(profile?.fullName || null, user.email)}
          </AvatarFallback>
        </Avatar>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#2c3e50",
              marginBottom: "4px",
            }}
          >
            {profile?.fullName || "Guest User"}
          </h2>
          <p style={{ fontSize: "14px", color: "#7f8c8d" }}>Customer</p>
        </div>
      </div>

      {/* Account Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Mail style={{ width: "20px", height: "20px", color: "#95a5a6" }} />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: "12px",
                color: "#95a5a6",
                marginBottom: "2px",
              }}
            >
              Email
            </p>
            <p
              style={{ fontSize: "14px", fontWeight: "500", color: "#2c3e50" }}
            >
              {user.email}
            </p>
          </div>
        </div>

        {profile?.phoneNumber && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Phone
              style={{ width: "20px", height: "20px", color: "#95a5a6" }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#95a5a6",
                  marginBottom: "2px",
                }}
              >
                Phone
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#2c3e50",
                }}
              >
                {profile.phoneNumber}
              </p>
            </div>
          </div>
        )}

        {profile?.createdAt && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Calendar
              style={{ width: "20px", height: "20px", color: "#95a5a6" }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#95a5a6",
                  marginBottom: "2px",
                }}
              >
                Member Since
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#2c3e50",
                }}
              >
                {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
