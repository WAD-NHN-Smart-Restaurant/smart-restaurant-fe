"use client";

import { Flame, TrendingUp } from "lucide-react";
import { cn } from "@/utils/utils";

interface PopularityIndicatorProps {
  popularity: number;
  className?: string;
  variant?: "badge" | "inline";
}

/**
 * Displays popularity indicator based on order count in last 30 days
 * - 0 orders: No indicator
 * - 1-5 orders: Low popularity (gray)
 * - 6-15 orders: Medium popularity (blue)
 * - 16-30 orders: High popularity (orange)
 * - 31+ orders: Very high popularity (red/trending)
 */
export function PopularityIndicator({
  popularity,
  className,
  variant = "badge",
}: PopularityIndicatorProps) {
  // Don't show indicator for items with no orders
  if (popularity === 0) {
    return null;
  }

  const getPopularityLevel = (count: number) => {
    if (count >= 31) return "trending";
    if (count >= 16) return "high";
    if (count >= 6) return "medium";
    return "low";
  };

  const level = getPopularityLevel(popularity);

  const styles = {
    trending: {
      bg: "bg-gradient-to-r from-red-500 to-orange-500",
      text: "text-white",
      icon: Flame,
      label: "Trending",
    },
    high: {
      bg: "bg-gradient-to-r from-orange-400 to-amber-400",
      text: "text-white",
      icon: Flame,
      label: "Popular",
    },
    medium: {
      bg: "bg-blue-500",
      text: "text-white",
      icon: TrendingUp,
      label: "Popular",
    },
    low: {
      bg: "bg-gray-400",
      text: "text-white",
      icon: TrendingUp,
      label: "Popular",
    },
  };

  const style = styles[level];
  const Icon = style.icon;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          style.text.replace("text-white", "text-gray-700"),
          className,
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            level === "trending" && "text-orange-500 animate-pulse",
            level === "high" && "text-orange-400",
            level === "medium" && "text-blue-500",
            level === "low" && "text-gray-400",
          )}
        />
        <span>{popularity} orders</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shadow-sm",
        style.bg,
        style.text,
        level === "trending" && "animate-pulse",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{style.label}</span>
      <span className="opacity-90">({popularity})</span>
    </div>
  );
}
