"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MobileHeaderProps {
  title: string;
  tableNumber?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function MobileHeader({
  title,
  tableNumber,
  showBack,
  onBack,
}: MobileHeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="header" suppressHydrationWarning>
      {showBack ? (
        <button onClick={handleBack} className="header-back">
          <ArrowLeft size={24} />
        </button>
      ) : (
        <span style={{ fontSize: "24px" }}>☰</span>
      )}
      <span className="header-title">{title}</span>
      {mounted && tableNumber && (
        <span className="header-table" suppressHydrationWarning>
          Table {tableNumber}
        </span>
      )}
    </div>
  );
}
