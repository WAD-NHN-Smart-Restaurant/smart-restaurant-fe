"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MobileHeaderProps {
  title: string;
  tableNumber?: string;
}

export function MobileHeader({ title, tableNumber }: MobileHeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="header" suppressHydrationWarning>
      <span className="header-title">{title}</span>
      {mounted && tableNumber && (
        <span className="header-table" suppressHydrationWarning>
          Table {tableNumber}
        </span>
      )}
    </div>
  );
}
