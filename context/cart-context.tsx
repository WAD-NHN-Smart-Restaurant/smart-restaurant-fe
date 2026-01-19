"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  specialRequest?: string;
  imageUrl?: string;
  options: Array<{
    optionId: string;
    optionName: string;
    priceAtTime: number;
  }>;
}

interface CartContextType {
  items: CartItem[];
  totalPrice: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Load from localStorage using lazy initialization
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];

    const saved = localStorage.getItem("guest_cart");
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved) as Array<Record<string, unknown>>;

      // Validate and migrate old data with snake_case to camelCase
      const migratedItems = parsed
        .map((item) => {
          // Check if item has old snake_case format and migrate
          const migratedItem: CartItem = {
            menuItemId: (item.menuItemId || item.menu_item_id) as string,
            menuItemName: (item.menuItemName || item.menu_item_name) as string,
            price: item.price as number,
            quantity: item.quantity as number,
            specialRequest: (item.specialRequest || item.special_request) as
              | string
              | undefined,
            imageUrl: (item.imageUrl || item.image_url) as string | undefined,
            options: (
              (item.options as Array<Record<string, unknown>>) || []
            ).map((opt) => ({
              optionId: (opt.optionId || opt.option_id) as string,
              optionName: (opt.optionName || opt.option_name) as string,
              priceAtTime: (opt.priceAtTime ??
                opt.price_at_time ??
                0) as number,
            })),
          };

          // Validate that we have required fields in correct format
          if (
            !migratedItem.menuItemId ||
            typeof migratedItem.menuItemId !== "string"
          ) {
            console.warn("Invalid cart item, skipping:", item);
            return null;
          }

          return migratedItem;
        })
        .filter(Boolean) as CartItem[];

      // Save migrated data back to localStorage
      if (migratedItems.length > 0) {
        localStorage.setItem("guest_cart", JSON.stringify(migratedItems));
      }

      return migratedItems;
    } catch (e) {
      console.error("Failed to parse cart data, clearing:", e);
      localStorage.removeItem("guest_cart");
      return [];
    }
  });

  const saveToLocalStorage = useCallback((newItems: CartItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("guest_cart", JSON.stringify(newItems));
    }
  }, []);

  const totalPrice = items.reduce((total, item) => {
    const itemTotal =
      (item.price +
        item.options.reduce((sum, opt) => sum + opt.priceAtTime, 0)) *
      item.quantity;
    return total + itemTotal;
  }, 0);

  const addItem = useCallback(
    (newItem: CartItem) => {
      setItems((prev) => {
        // Check if item already exists with same options
        const existingIndex = prev.findIndex(
          (item) =>
            item.menuItemId === newItem.menuItemId &&
            JSON.stringify(item.options) === JSON.stringify(newItem.options),
        );

        let updated: CartItem[];
        if (existingIndex > -1) {
          // Update quantity
          updated = [...prev];
          updated[existingIndex].quantity += newItem.quantity;
        } else {
          // Add new item
          updated = [...prev, newItem];
        }

        saveToLocalStorage(updated);
        return updated;
      });
    },
    [saveToLocalStorage],
  );

  const updateQuantity = useCallback(
    (menuItemId: string, quantity: number) => {
      setItems((prev) => {
        if (quantity <= 0) {
          const updated = prev.filter((item) => item.menuItemId !== menuItemId);
          saveToLocalStorage(updated);
          return updated;
        }

        const updated = prev.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item,
        );
        saveToLocalStorage(updated);
        return updated;
      });
    },
    [saveToLocalStorage],
  );

  const removeItem = useCallback(
    (menuItemId: string) => {
      setItems((prev) => {
        const updated = prev.filter((item) => item.menuItemId !== menuItemId);
        saveToLocalStorage(updated);
        return updated;
      });
    },
    [saveToLocalStorage],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    saveToLocalStorage([]);
  }, [saveToLocalStorage]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalPrice,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
