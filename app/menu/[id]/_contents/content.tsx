"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useCart, CartItem } from "@/context/cart-context";
import { formatPrice } from "@/utils/format";
import type { GuestMenuItem } from "@/types/guest-menu-type";
import { useGuestMenuQuery } from "../../_contents/use-guest-menu-query";
import { MobileLayout } from "@/components/mobile-layout";
import { LoadingState } from "../../_components/loading-state";

interface SelectedModifiers {
  [groupId: string]: string[];
}

export function MenuItemDetailContent({ itemId }: { itemId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table") || undefined;
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>(
    {},
  );
  const [specialRequest, setSpecialRequest] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Fetch all menu items and find the specific item
  const { data, isLoading, isError } = useGuestMenuQuery({
    limit: 100,
    table: tableId,
  });

  const item = useMemo(() => {
    if (!data?.data?.items) return null;
    for (const category of data.data.items) {
      const foundItem = category.menuItems.find(
        (item: GuestMenuItem) => item.id === itemId,
      );
      if (foundItem) return foundItem;
    }
    return null;
  }, [data, itemId]);

  // Calculate total price with modifiers
  const totalPrice = useMemo(() => {
    if (!item) return 0;

    const basePrice = item.price;
    let modifierTotal = 0;

    item.menuItemModifierGroups.forEach(({ modifierGroups }) => {
      const selectedOptions = selectedModifiers[modifierGroups.id] || [];
      selectedOptions.forEach((optionId) => {
        const option = modifierGroups.modifierOptions.find(
          (opt) => opt.id === optionId,
        );
        if (option) {
          modifierTotal += option.priceAdjustment;
        }
      });
    });

    return (basePrice + modifierTotal) * quantity;
  }, [item, selectedModifiers, quantity]);

  const handleModifierChange = (
    groupId: string,
    optionId: string,
    selectionType: string,
  ) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];

      if (selectionType === "single") {
        return { ...prev, [groupId]: [optionId] };
      } else {
        // Multiple selection
        if (current.includes(optionId)) {
          return {
            ...prev,
            [groupId]: current.filter((id) => id !== optionId),
          };
        } else {
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    if (!item) return;

    // Validate required modifiers
    for (const { modifierGroups } of item.menuItemModifierGroups) {
      if (
        modifierGroups.isRequired &&
        !selectedModifiers[modifierGroups.id]?.length
      ) {
        alert(`Please select ${modifierGroups.name}`);
        return;
      }
    }

    // Convert selected modifiers to options
    const options: Array<{
      optionId: string;
      optionName: string;
      priceAtTime: number;
    }> = [];

    item.menuItemModifierGroups.forEach(({ modifierGroups }) => {
      const selectedOptions = selectedModifiers[modifierGroups.id] || [];
      selectedOptions.forEach((optionId) => {
        const option = modifierGroups.modifierOptions.find(
          (opt) => opt.id === optionId,
        );
        if (option) {
          options.push({
            optionId: option.id,
            optionName: option.name,
            priceAtTime: option.priceAdjustment,
          });
        }
      });
    });

    // Create cart item
    const primaryPhoto =
      item.menuItemPhotos.find((p) => p.isPrimary) || item.menuItemPhotos[0];
    const cartItem: CartItem = {
      menuItemId: item.id,
      menuItemName: item.name,
      price: item.price,
      quantity,
      specialRequest: specialRequest || undefined,
      imageUrl: primaryPhoto?.url || undefined,
      options,
    };

    addItem(cartItem);

    // Navigate to cart
    router.push("/checkout");
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <LoadingState />
      </MobileLayout>
    );
  }

  if (isError || !item) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
          <p className="text-gray-500 mb-4">Item not found</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const photos =
    item.menuItemPhotos.length > 0
      ? item.menuItemPhotos
      : [
          {
            url: null,
            isPrimary: true,
          },
        ];

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <MobileLayout>
      {/* Header with back button */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold flex-1 truncate">Item Details</h1>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-6">
        {/* Photo Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            {currentPhoto.url ? (
              <Image
                src={currentPhoto.url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                🍽️
              </div>
            )}

            {item.status !== "available" && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {item.status === "unavailable" ? "Hết hàng" : "Không có sẵn"}
                </Badge>
              </div>
            )}
          </div>

          {/* Photo thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                    index === currentPhotoIndex
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                >
                  {photo.url ? (
                    <Image
                      src={photo.url}
                      alt={`${item.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      🍽️
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{item.name}</h2>
              {item.isChefRecommended && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  <Star className="h-3 w-3 fill-current mr-1" /> Chef&apos;s
                  Recommendation
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(item.price)}
            </span>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{item.prepTimeMinutes} mins</span>
            </div>
          </div>
          {item.description && (
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* Modifiers */}
        {item.menuItemModifierGroups.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Options</h3>
            {item.menuItemModifierGroups.map(({ modifierGroups }) => {
              if (modifierGroups.status !== "active") return null;

              return (
                <Card key={modifierGroups.id}>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        {modifierGroups.name}
                        {modifierGroups.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {modifierGroups.selectionType === "single"
                          ? `Select up to ${modifierGroups.maxSelections}`
                          : `Select up to ${modifierGroups.maxSelections}`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {modifierGroups.modifierOptions
                        .filter((option) => option.status === "active")
                        .map((option) => {
                          const isSelected = (
                            selectedModifiers[modifierGroups.id] || []
                          ).includes(option.id);
                          return (
                            <label
                              key={option.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type={
                                    modifierGroups.selectionType === "single"
                                      ? "radio"
                                      : "checkbox"
                                  }
                                  name={
                                    modifierGroups.selectionType === "single"
                                      ? modifierGroups.id
                                      : undefined
                                  }
                                  checked={isSelected}
                                  onChange={() =>
                                    handleModifierChange(
                                      modifierGroups.id,
                                      option.id,
                                      modifierGroups.selectionType,
                                    )
                                  }
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">{option.name}</span>
                              </div>
                              {option.priceAdjustment !== 0 && (
                                <span className="text-sm font-medium text-green-600">
                                  +{formatPrice(option.priceAdjustment)}
                                </span>
                              )}
                            </label>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Special Request */}
        <div>
          <h4 className="font-medium mb-2">Special Instructions</h4>
          <Textarea
            placeholder="e.g., No spicy, extra vegetables..."
            value={specialRequest}
            onChange={(e) => setSpecialRequest(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Add to Cart Section */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full h-12 text-lg bg-red-500 hover:bg-red-600"
              onClick={handleAddToCart}
              disabled={item.status !== "available"}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {item.status === "available"
                ? `Add to Cart - ${formatPrice(totalPrice)}`
                : "Currently Unavailable"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
