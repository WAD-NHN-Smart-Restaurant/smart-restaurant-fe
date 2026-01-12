"use client";

import { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MobileLayout({
  children,
  showBottomNav = true,
}: MobileLayoutProps) {
  return (
    <div className="mobile-container">
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
