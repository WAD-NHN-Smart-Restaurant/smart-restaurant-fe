"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, User } from "lucide-react";
import { AUTH_PATHS, PATHS } from "@/data/path";

interface AuthRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredModal({
  open,
  onOpenChange,
}: AuthRequiredModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Extract query string from current URL in the browser
  const getQueryString = () => {
    if (typeof window !== "undefined") {
      return window.location.search;
    }
    return "";
  };

  const handleLogin = () => {
    onOpenChange(false);
    const queryString = getQueryString();
    router.push(`${AUTH_PATHS.LOGIN}${queryString}`);
  };

  const handleRegister = () => {
    onOpenChange(false);
    const queryString = getQueryString();
    router.push(`${AUTH_PATHS.REGISTER}${queryString}`);
  };

  const handleContinueAsGuest = () => {
    onOpenChange(false);
    const queryString = getQueryString();
    router.push(`${PATHS.MENU.INDEX}${queryString}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            Please choose an option to continue
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-base"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Login
          </Button>
          <Button
            onClick={handleRegister}
            variant="secondary"
            className="w-full h-12 text-base"
            size="lg"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Register
          </Button>
          <Button
            onClick={handleContinueAsGuest}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            <User className="mr-2 h-5 w-5" />
            Continue as Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
