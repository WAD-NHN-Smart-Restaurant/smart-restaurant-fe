"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface GuestMenuHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function GuestMenuHeader({
  searchValue,
  onSearchChange,
}: GuestMenuHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guest Menu</h1>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search menu items..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
}
