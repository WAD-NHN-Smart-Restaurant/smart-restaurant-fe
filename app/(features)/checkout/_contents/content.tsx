"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { createOrder } from "@/api/order-api";
import { CartSummary } from "@/components/cart-summary";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { formatPrice } from "@/utils/format";

export function CheckoutContent() {
  const router = useRouter();
  const { items, clearCart, totalPrice } = useCart();
  const [guestName, setGuestName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  // Load table number from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("guest_table_number");
    if (saved) {
      setTableNumber(saved);
    }
  }, []);

  if (items.length === 0) {
    return (
      <MobileLayout>
        <MobileHeader
          title="Your Cart"
          tableNumber={tableNumber || undefined}
        />
        <div
          className="content"
          style={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
            <Button onClick={() => router.push("/menu")}>Back to Menu</Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const handleSubmitOrder = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      // Get tableId from localStorage (set during QR scan)
      const tableId = localStorage.getItem("guest_table_id");
      if (!tableId) {
        setError("Table ID not found. Please scan QR code again.");
        setIsSubmitting(false);
        return;
      }

      // Prepare order items
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialRequest: item.specialRequest,
        options: item.options.map((opt) => ({
          optionId: opt.optionId,
          priceAtTime: opt.priceAtTime,
        })),
      }));

      const orderPayload = {
        tableId,
        items: orderItems,
        guestName: guestName || undefined,
        notes: notes || undefined,
      };

      console.log("=== ORDER PAYLOAD ===");
      console.log(JSON.stringify(orderPayload, null, 2));
      console.log("====================");

      const response = await createOrder(orderPayload);

      console.log("Order response:", response);

      // Check both success (from interceptor) and status (from controller)
      if (response.success && response.data?.status) {
        clearCart();
        router.push("/order-info");
      } else {
        console.error("Order creation failed:", response);
        setError(
          response.data?.message || "Error creating order. Please try again.",
        );
      }
    } catch (err: unknown) {
      console.error("Order creation error:", err);
      const message =
        (err as { message?: string })?.message ?? "Error creating order";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout>
      <MobileHeader title="Your Cart" tableNumber={tableNumber || undefined} />

      {/* Cart Content */}
      <div className="content" style={{ paddingBottom: "250px" }}>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Cart Items */}
        <CartSummary onAddMore={() => router.push("/menu")} />

        {/* Guest name (optional) */}
        <div className="modifier-section">
          <div className="modifier-title">Your Name (optional)</div>
          <input
            className="search-input"
            placeholder="Enter your name so staff can identify you"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Special Instructions */}
        <div className="modifier-section">
          <div className="modifier-title">Special Instructions for Kitchen</div>
          <textarea
            className="special-instructions"
            placeholder="Any special requests for the entire order?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Info Note */}
        <div
          style={{
            background: "#e8f4fd",
            padding: "15px",
            borderRadius: "12px",
            marginTop: "15px",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
          >
            <span style={{ fontSize: "20px" }}>ℹ️</span>
            <div style={{ fontSize: "13px", color: "#2980b9" }}>
              <strong>Pay After Your Meal</strong>
              <br />
              You can place multiple orders during your visit. Payment will be
              processed when you request the bill.
            </div>
          </div>
        </div>
      </div>

      {/* Place Order Bar */}
      <div
        className="add-to-cart-bar"
        style={{
          flexDirection: "column",
          gap: "10px",
          height: "auto",
          padding: "15px 20px",
        }}
      >
        <button
          className="add-to-cart-btn"
          style={{ width: "100%" }}
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Placing Order..."
            : `Place Order - ${formatPrice(totalPrice)}`}
        </button>
        <button
          style={{
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "2px solid #e74c3c",
            color: "#e74c3c",
            borderRadius: "12px",
            fontWeight: "600",
            cursor: "pointer",
          }}
          onClick={() => router.push("/menu")}
          disabled={isSubmitting}
        >
          Continue Browsing
        </button>
      </div>
    </MobileLayout>
  );
}
