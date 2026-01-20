"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Menu, ArrowLeft } from "lucide-react";
import { AUTH_PATHS } from "@/data/path";

interface MobileHeaderProps {
  title: string;
  tableNumber?: string;
  onBack?: () => void;
  showLeftMenu?: boolean;
}

export function MobileHeader({
  title,
  tableNumber,
  onBack,
  showLeftMenu,
}: MobileHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
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
    <div className="header" suppressHydrationWarning>
      {/* Left side: Back button or Menu dropdown */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}
      >
        {showLeftMenu && mounted && isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "white",
                  fontSize: "20px",
                }}
              >
                <Menu style={{ width: "24px", height: "24px" }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{ minWidth: "150px", zIndex: 9999 }}
            >
              <DropdownMenuItem
                onClick={() => router.push("/order-history")}
                style={{ cursor: "pointer" }}
              >
                Order History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/order-history?tab=reviews")}
                style={{ cursor: "pointer" }}
              >
                My Reviews
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : onBack ? (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: "white",
            }}
          >
            <ArrowLeft style={{ width: "24px", height: "24px" }} />
          </button>
        ) : null}
      </div>

      <span className="header-title" style={{ flex: 1, textAlign: "center" }}>
        {title}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        {mounted && tableNumber && (
          <span className="header-table" suppressHydrationWarning>
            Table {tableNumber}
          </span>
        )}

        {mounted && !isLoading && (
          <>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Avatar style={{ width: "36px", height: "36px" }}>
                      <AvatarImage src={user.profile?.avatarUrl || undefined} />
                      <AvatarFallback
                        style={{
                          background: "#e74c3c",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {getInitials(
                          user.profile?.fullName || null,
                          user.email,
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  style={{ minWidth: "200px", zIndex: 9999 }}
                >
                  <div style={{ padding: "8px 12px" }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2c3e50",
                      }}
                    >
                      {user.profile?.fullName || "Customer"}
                    </p>
                    <p style={{ fontSize: "12px", color: "#7f8c8d" }}>
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    style={{ cursor: "pointer" }}
                  >
                    <UserIcon
                      style={{
                        width: "16px",
                        height: "16px",
                        marginRight: "8px",
                      }}
                    />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    style={{ cursor: "pointer", color: "#e74c3c" }}
                  >
                    <LogOut
                      style={{
                        width: "16px",
                        height: "16px",
                        marginRight: "8px",
                      }}
                    />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  onClick={() => router.push(AUTH_PATHS.LOGIN)}
                  style={{
                    background: "white",
                    color: "#e74c3c",
                    border: "1px solid #e74c3c",
                    borderRadius: "8px",
                    padding: "6px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => router.push(AUTH_PATHS.REGISTER)}
                  style={{
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
