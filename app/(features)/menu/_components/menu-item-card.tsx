"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Image from "next/image";
import type { GuestMenuItem } from "@/types/guest-menu-type";

interface MenuItemCardProps {
  item: GuestMenuItem;
  onItemClick: (item: GuestMenuItem) => void;
}

export function MenuItemCard({ item, onItemClick }: MenuItemCardProps) {
  const primaryPhoto = item.menuItemPhotos.find((photo) => photo.isPrimary);
  const imageUrl = primaryPhoto?.url;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Card
      className="w-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="p-0">
        {/* Image */}
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={item.name}
            width={400}
            height={300}
            className="w-full md:h-60 object-cover"
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 leading-tight">
              {item.name}
            </h3>
            <span className="font-bold text-lg text-green-600 ml-2">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-1">
              {item.description}
            </p>
          )}

          {/* Prep time and modifiers info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{item.prepTimeMinutes} min</span>
            </div>
            {item.menuItemModifierGroups.filter(
              (group) => group.modifierGroups.status === "active",
            ).length > 0 && (
              <span className="text-blue-600">
                {
                  item.menuItemModifierGroups.filter(
                    (group) => group.modifierGroups.status === "active",
                  ).length
                }{" "}
                customization option
                {item.menuItemModifierGroups.filter(
                  (group) => group.modifierGroups.status === "active",
                ).length !== 1
                  ? "s"
                  : ""}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
