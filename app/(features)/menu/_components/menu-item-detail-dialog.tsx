"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Star, Minus, Plus, ShoppingCart } from "lucide-react";
import type { GuestMenuItem } from "@/types/guest-menu-type";

interface MenuItemDetailDialogProps {
  item: GuestMenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedModifiers {
  [groupId: string]: string[];
}

export function MenuItemDetailDialog({
  item,
  isOpen,
  onClose,
}: MenuItemDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>(
    {},
  );
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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

  if (!item) return null;

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    // Mock add to cart functionality
    console.log("Added to cart:", {
      item: item.name,
      quantity,
      modifiers: selectedModifiers,
      totalPrice,
    });
    // Show success message or close dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="md:min-w-3xl max-w-4/5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.name}
            {item.isChefRecommended && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                <Star className="h-3 w-3 fill-current mr-1" />
                Chef&apos;s Choice
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Photo Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {currentPhoto.url && (
                <Image
                  src={currentPhoto.url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}

              {item.status !== "available" && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    {item.status === "unavailable"
                      ? "Unavailable"
                      : "Out of Stock"}
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
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    {photo.url && (
                      <Image
                        src={photo.url}
                        alt={`${item.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(item.price)}
                </span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{item.prepTimeMinutes} min</span>
                </div>
              </div>
              {item.description && (
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            {/* Modifiers */}
            {item.menuItemModifierGroups.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Customize Your Order</h3>
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
                              ? "Choose one"
                              : `Choose up to ${modifierGroups.maxSelections}`}
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
                                        modifierGroups.selectionType ===
                                        "single"
                                          ? "radio"
                                          : "checkbox"
                                      }
                                      name={
                                        modifierGroups.selectionType ===
                                        "single"
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
                                    <span className="text-sm">
                                      {option.name}
                                    </span>
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

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Quantity</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
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
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-green-600">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <Button
                className="w-full h-12 text-lg"
                onClick={handleAddToCart}
                disabled={item.status !== "available"}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {item.status === "available"
                  ? "Add to Cart"
                  : "Currently Unavailable"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
