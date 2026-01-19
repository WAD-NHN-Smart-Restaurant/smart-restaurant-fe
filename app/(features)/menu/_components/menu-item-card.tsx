"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Image from "next/image";
import type { GuestMenuItem } from "@/types/guest-menu-type";
import { PopularityIndicator } from "./popularity-indicator";

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
      className="w-full hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Image */}
        <div className="relative">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={item.name}
              width={400}
              height={300}
              className="w-full h-48 object-cover"
            />
          )}
          {/* Popularity Badge */}
          {item.popularity > 0 && (
            <div className="absolute top-2 right-2">
              <PopularityIndicator
                popularity={item.popularity}
                variant="badge"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 leading-tight">
              {item.name}
            </h3>
            <span className="font-bold text-lg text-green-600 ml-2 shrink-0">
              {formatPrice(item.price)}
            </span>
          </div>

          {/* Fixed height description area */}
          <div className="mb-3 h-5">
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-1">
                {item.description}
              </p>
            )}
          </div>

          {/* Prep time and modifiers info - pushed to bottom */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
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
