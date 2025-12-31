"use client";

import { memo } from "react";
import { Loader2 } from "lucide-react";

export const PageLoadingSkeleton = memo(function PageLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
});
