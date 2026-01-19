"use client";

import { User } from "@/types/auth-type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface ProfileHeaderProps {
  user: User;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const { logout, isLogoutLoading } = useAuth();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-white text-xl">
                {getInitials(user.profile?.fullName || user.email || null)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {user.profile?.fullName || "User Profile"}
              </h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            disabled={isLogoutLoading}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
