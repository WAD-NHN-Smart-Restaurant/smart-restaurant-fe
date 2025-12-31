"use client";

import { memo } from "react";
import { cn } from "@/utils/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode | string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = memo(function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4">
          {typeof icon === "string" ? (
            <div className="text-6xl opacity-50">{icon}</div>
          ) : (
            icon
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
});
