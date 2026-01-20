"use client";

import { useCart } from "@/context/cart-context";
import type { CartItem } from "@/context/cart-context";
import { formatPrice } from "@/utils/format";
import Image from "next/image";

interface CartSummaryProps {
  onCheckout?: () => void;
  onAddMore?: () => void;
}

export function CartSummary({}: CartSummaryProps) {
  const { items, updateQuantity, removeItem } = useCart();

  const computeItemTotal = (item: CartItem): number => {
    const optionsTotal = (item.options || []).reduce(
      (sum, opt) => sum + opt.priceAtTime,
      0,
    );
    return (item.price + optionsTotal) * item.quantity;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Your cart is empty</p>
      </div>
    );
  }

  return (
    <>
      {items.map((item) => (
        <div
          key={`${item.menuItemId}-${JSON.stringify(item.options)}`}
          className="cart-item"
          style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}
        >
          <div className="cart-item-image">
            {item.imageUrl && item.imageUrl.trim() !== "" ? (
              <Image
                src={item.imageUrl}
                alt={item.menuItemName}
                width={80}
                height={80}
                className="object-cover"
                style={{ width: "80px", height: "80px", borderRadius: "10px" }}
                unoptimized
              />
            ) : (
              <span className="text-3xl">🍽️</span>
            )}
          </div>
          <div className="cart-item-info">
            <div className="cart-item-name">{item.menuItemName}</div>
            {item.options && item.options.length > 0 && (
              <div className="cart-item-modifiers">
                {item.options
                  .map((opt) => opt.optionName || "Option")
                  .join(", ")}
              </div>
            )}
            {item.specialRequest && (
              <div className="cart-item-note">{item.specialRequest}</div>
            )}
            <div className="cart-item-price">
              {formatPrice(computeItemTotal(item))}
            </div>
          </div>
          <div className="cart-item-actions">
            <div className="quantity-control small">
              <button
                className="qty-btn"
                onClick={() =>
                  updateQuantity(item.menuItemId, item.quantity - 1)
                }
              >
                -
              </button>
              <span className="qty-value">{item.quantity}</span>
              <button
                className="qty-btn"
                onClick={() =>
                  updateQuantity(item.menuItemId, item.quantity + 1)
                }
              >
                +
              </button>
            </div>
            <button
              className="remove-btn"
              onClick={() => removeItem(item.menuItemId)}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
