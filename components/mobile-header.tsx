"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  tableNumber?: string;
  showBack?: boolean;
}

export function MobileHeader({
  title,
  tableNumber,
  showBack,
}: MobileHeaderProps) {
  const router = useRouter();

  return (
    <div className="header" suppressHydrationWarning>
      {showBack ? (
        <button onClick={() => router.back()} className="header-back">
          <ArrowLeft size={24} />
        </button>
      ) : (
        <span style={{ fontSize: "24px" }}>☰</span>
      )}
      <span className="header-title">{title}</span>
      {tableNumber && (
        <span className="header-table" suppressHydrationWarning>
          Table {tableNumber}
        </span>
      )}
    </div>
  );
}
