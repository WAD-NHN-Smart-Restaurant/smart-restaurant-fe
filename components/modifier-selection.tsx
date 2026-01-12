"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/utils/format";
import { CartItem } from "@/context/cart-context";

interface ModifierSelectionProps {
  isOpen: boolean;
  menuItem: {
    id: string;
    name: string;
    price: number;
    modifierGroups?: Array<{
      id: string;
      name: string;
      isRequired: boolean;
      modifierOptions: Array<{
        id: string;
        name: string;
        price: number;
      }>;
    }>;
  };
  onConfirm: (item: CartItem) => void;
  onCancel: () => void;
}

export function ModifierSelection({
  isOpen,
  menuItem,
  onConfirm,
  onCancel,
}: ModifierSelectionProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | string[]>
  >({});
  const [specialRequest, setSpecialRequest] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleOptionSelect = (
    groupId: string,
    optionId: string,
    isMultiple: boolean,
  ) => {
    setSelectedOptions((prev) => {
      if (isMultiple) {
        const current = (prev[groupId] as string[]) || [];
        if (current.includes(optionId)) {
          return {
            ...prev,
            [groupId]: current.filter((id) => id !== optionId),
          };
        } else {
          return {
            ...prev,
            [groupId]: [...current, optionId],
          };
        }
      } else {
        return {
          ...prev,
          [groupId]: optionId,
        };
      }
    });
  };

  const handleConfirm = () => {
    // Validate required modifiers
    for (const group of menuItem.modifierGroups || []) {
      if (group.isRequired) {
        const selected = selectedOptions[group.id];
        const hasSelection = Array.isArray(selected)
          ? selected.length > 0
          : !!selected;
        if (!hasSelection) {
          alert(`Vui lòng chọn ${group.name}`);
          return;
        }
      }
    }

    const options: Array<{
      optionId: string;
      optionName: string;
      priceAtTime: number;
    }> = [];

    // Collect selected options
    for (const [groupId, optionIds] of Object.entries(selectedOptions)) {
      const ids = Array.isArray(optionIds)
        ? optionIds
        : optionIds
          ? [optionIds]
          : [];
      const group = menuItem.modifierGroups?.find((g) => g.id === groupId);

      for (const optionId of ids) {
        const option = group?.modifierOptions.find((o) => o.id === optionId);
        if (option) {
          options.push({
            optionId: option.id,
            optionName: option.name,
            priceAtTime: option.price,
          });
        }
      }
    }

    const cartItem: CartItem = {
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      price: menuItem.price,
      quantity,
      specialRequest: specialRequest || undefined,
      options,
    };

    onConfirm(cartItem);
    handleReset();
  };

  const handleReset = () => {
    setSelectedOptions({});
    setSpecialRequest("");
    setQuantity(1);
  };

  const calculateItemPrice = () => {
    let total = menuItem.price;

    for (const group of menuItem.modifierGroups || []) {
      const selected = selectedOptions[group.id];
      if (selected) {
        const ids = Array.isArray(selected) ? selected : [selected];
        for (const optionId of ids) {
          const option = group.modifierOptions.find((o) => o.id === optionId);
          if (option) {
            total += option.price;
          }
        }
      }
    }

    return total;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{menuItem.name}</DialogTitle>
          <p className="text-sm text-gray-600">
            Giá: {formatPrice(calculateItemPrice())} / món
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modifier Groups */}
          {menuItem.modifierGroups && menuItem.modifierGroups.length > 0 && (
            <div className="space-y-4">
              {menuItem.modifierGroups.map((group) => {
                // Fallback: when selection type is unknown, consider multi-select if many options
                const isMultiple =
                  Array.isArray(group.modifierOptions) &&
                  group.modifierOptions.length > 2;

                return (
                  <div key={group.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">
                      {group.name}
                      {group.isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h4>

                    <div className="space-y-2">
                      {group.modifierOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-3"
                        >
                          {isMultiple ? (
                            <Checkbox
                              id={option.id}
                              checked={(() => {
                                const arr = Array.isArray(
                                  selectedOptions[group.id],
                                )
                                  ? (selectedOptions[group.id] as string[])
                                  : [];
                                return arr.includes(option.id);
                              })()}
                              onCheckedChange={() =>
                                handleOptionSelect(group.id, option.id, true)
                              }
                            />
                          ) : (
                            <input
                              type="radio"
                              id={option.id}
                              name={group.id}
                              checked={selectedOptions[group.id] === option.id}
                              onChange={() =>
                                handleOptionSelect(group.id, option.id, false)
                              }
                              className="w-4 h-4"
                            />
                          )}
                          <label
                            htmlFor={option.id}
                            className="flex-1 cursor-pointer flex justify-between"
                          >
                            <span>{option.name}</span>
                            {option.price > 0 && (
                              <span className="text-gray-600">
                                +{formatPrice(option.price)}
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Request */}
          <div className="border rounded-lg p-4">
            <label className="block font-semibold mb-2">Ghi chú</label>
            <Input
              placeholder="Ví dụ: Không cay, thêm rau..."
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Quantity */}
          <div className="border rounded-lg p-4">
            <label className="block font-semibold mb-3">Số lượng</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setQuantity(isNaN(val) ? 1 : Math.max(1, val));
                }}
                className="w-12 text-center border rounded"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 border rounded hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={handleConfirm}>
            Thêm vào giỏ ({formatPrice(calculateItemPrice() * quantity)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
