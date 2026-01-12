"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentOrder, requestBill, callWaiter } from "@/api/order-api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { BottomNav } from "@/components/bottom-nav";
import { formatPrice } from "@/utils/format";

interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName?: string;
  quantity: number;
  unitPrice: number;
  specialRequest?: string;
  status: string;
  options?: Array<{
    id: string;
    optionName?: string;
    priceAtTime: number;
  }>;
}

interface Order {
  id: string;
  tableId: string;
  status: string;
  guestName?: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  orderItems: OrderItem[];
}

// Raw response shape from backend for orders
type RawOrder = {
  id: string;
  table_id: string;
  status: string;
  guest_name?: string | null;
  notes?: string | null;
  total_amount?: number | null;
  created_at: string;
  order_items?: Array<{
    id: string;
    menu_item_id: string;
    menu_item_name?: string | null;
    quantity: number;
    unit_price: number;
    special_request?: string | null;
    status: string;
    order_item_options?: Array<{
      id: string;
      option_name?: string | null;
      price_at_time: number;
    }>;
  }>;
};

const ITEM_STATUS_LABELS: Record<string, string> = {
  pending: "Received",
  confirmed: "Confirmed",
  rejected: "Rejected",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
};

export function OrderInfoContent() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getCurrentOrder();
        // Response has structure: {success, data: {status, data: RawOrder}}
        if (response?.success && response.data?.status) {
          const raw = response.data.data as RawOrder;
          const mapped: Order = {
            id: raw.id,
            tableId: raw.table_id,
            status: raw.status,
            guestName: raw.guest_name || undefined,
            notes: raw.notes || undefined,
            totalAmount: raw.total_amount ?? 0,
            createdAt: raw.created_at,
            orderItems: (raw.order_items || []).map(
              (it: {
                id: string;
                menu_item_id: string;
                menu_item_name?: string | null;
                quantity: number;
                unit_price: number;
                special_request?: string | null;
                status: string;
                order_item_options?: Array<{
                  id: string;
                  option_name?: string | null;
                  price_at_time: number;
                }>;
              }) => ({
                id: it.id,
                menuItemId: it.menu_item_id,
                menuItemName: it.menu_item_name || undefined,
                quantity: it.quantity,
                unitPrice: it.unit_price,
                specialRequest: it.special_request || undefined,
                status: it.status,
                options: (it.order_item_options || []).map(
                  (op: {
                    id: string;
                    option_name?: string | null;
                    price_at_time: number;
                  }) => ({
                    id: op.id,
                    optionName: op.option_name || undefined,
                    priceAtTime: op.price_at_time,
                  }),
                ),
              }),
            ),
          };
          setOrder(mapped);
        } else {
          setError("Unable to load order information");
        }
      } catch (err: unknown) {
        const message =
          (err as { message?: string })?.message ??
          "Error loading order information";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
    // Refresh every 5 seconds for order updates
    const interval = setInterval(fetchOrder, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRequestBill = async () => {
    try {
      setIsSubmitting(true);
      setInfo(null);
      const response = await requestBill();
      if (response?.success && response.data?.status) {
        // Update order status
        if (order) {
          setOrder({ ...order, status: "payment_pending" });
        }
        setInfo("Bill requested. A staff member will assist you shortly.");
      } else {
        setError(response.data?.message || "Unable to request bill");
      }
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Error requesting bill";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallWaiter = async () => {
    try {
      setIsCallingWaiter(true);
      setError(null);
      setInfo(null);
      const response = await callWaiter();
      if (response?.success && response.data?.status) {
        setInfo("Waiter notified. Please stay seated.");
      } else {
        setError(response.data?.message || "Unable to call waiter");
      }
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Error calling waiter";
      setError(message);
    } finally {
      setIsCallingWaiter(false);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <MobileHeader title="Your Orders" />
        <div
          style={{
            paddingBottom: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "#7f8c8d" }}>Loading order information...</p>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  if (error && !order) {
    return (
      <MobileLayout>
        <MobileHeader title="Your Orders" />
        <div
          style={{
            paddingBottom: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  if (!order) {
    return (
      <MobileLayout>
        <MobileHeader title="Your Orders" />
        <div
          style={{
            paddingBottom: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "18px",
                color: "#7f8c8d",
                marginBottom: "16px",
              }}
            >
              No orders yet
            </p>
            <Button onClick={() => router.push("/menu")}>Back to Menu</Button>
          </div>
        </div>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <MobileHeader title="Your Orders" />

      <div style={{ paddingBottom: "80px" }}>
        <div style={{ padding: "20px", background: "#f8f9fa" }}>
          {/* Session Summary Card - Mockup Style */}
          <div
            style={{
              background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{ marginBottom: "12px", fontSize: "14px", opacity: 0.9 }}
            >
              Current Session Total
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              {formatPrice(order.totalAmount)}
            </div>
            <div
              style={{
                display: "flex",
                gap: "20px",
                fontSize: "13px",
                marginBottom: "15px",
              }}
            >
              <div>📋 1 Orders</div>
              <div>🍽️ {order.orderItems.length} Items</div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleRequestBill}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "white",
                  color: "#e74c3c",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Request Bill
              </button>
              <button
                onClick={handleCallWaiter}
                disabled={isCallingWaiter}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fdf2e9",
                  color: "#d35400",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: isCallingWaiter ? "not-allowed" : "pointer",
                  opacity: isCallingWaiter ? 0.6 : 1,
                }}
              >
                Call Waiter
              </button>
            </div>
          </div>

          {info && (
            <div
              style={{
                marginBottom: "12px",
                padding: "12px",
                background: "#e8f4fd",
                color: "#2980b9",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              {info}
            </div>
          )}

          {/* Order Items List */}
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "16px",
              }}
            >
              Your Orders (auto-refresh every 5s)
            </h2>

            {order.orderItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  paddingBottom: "16px",
                  marginBottom: "16px",
                  borderBottom:
                    index < order.orderItems.length - 1
                      ? "1px solid #e0e0e0"
                      : "none",
                }}
              >
                {/* Order Item Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {item.menuItemName || "Item"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7f8c8d" }}>
                      x{item.quantity} × {formatPrice(item.unitPrice)}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background:
                        item.status === "served" || item.status === "ready"
                          ? "#d5f4e6"
                          : item.status === "preparing"
                            ? "#ffeaa7"
                            : item.status === "rejected"
                              ? "#ffcccc"
                              : "#e8f4fd",
                      color:
                        item.status === "served" || item.status === "ready"
                          ? "#27ae60"
                          : item.status === "preparing"
                            ? "#f39c12"
                            : item.status === "rejected"
                              ? "#e74c3c"
                              : "#2980b9",
                    }}
                  >
                    {ITEM_STATUS_LABELS[item.status] || item.status}
                  </div>
                </div>

                {/* Status Timeline */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    margin: "10px 0",
                  }}
                >
                  {["pending", "preparing", "ready"].map((status, idx) => {
                    const statusOrder = [
                      "pending",
                      "confirmed",
                      "preparing",
                      "ready",
                      "served",
                    ];
                    const isCompleted =
                      statusOrder.indexOf(item.status) >=
                      statusOrder.indexOf(status);

                    return (
                      <div
                        key={status}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: isCompleted ? "#27ae60" : "#bdc3c7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          ✓
                        </div>
                        {idx < 2 && (
                          <div
                            style={{
                              flex: 1,
                              height: "2px",
                              background: isCompleted ? "#27ae60" : "#bdc3c7",
                              margin: "0 4px",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Modifiers */}
                {item.options && item.options.length > 0 && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7f8c8d",
                      marginTop: "8px",
                    }}
                  >
                    {item.options.map((opt) => (
                      <div key={opt.id}>
                        + {opt.optionName} ({formatPrice(opt.priceAtTime)})
                      </div>
                    ))}
                  </div>
                )}

                {/* Special Request */}
                {item.specialRequest && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#e74c3c",
                      marginTop: "6px",
                      fontStyle: "italic",
                    }}
                  >
                    Note: {item.specialRequest}
                  </div>
                )}
              </div>
            ))}

            {/* Order Total */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 0",
                borderTop: "2px solid #e0e0e0",
                marginTop: "8px",
              }}
            >
              <span style={{ fontWeight: "700", fontSize: "16px" }}>
                Order Total
              </span>
              <span
                style={{
                  fontWeight: "700",
                  fontSize: "18px",
                  color: "#e74c3c",
                }}
              >
                {formatPrice(order.totalAmount)}
              </span>
            </div>

            {/* Want to order more section */}
            <div
              style={{
                textAlign: "center",
                padding: "16px 0",
                color: "#7f8c8d",
                fontSize: "14px",
              }}
            >
              Want to order more?
            </div>

            {/* Browse Menu Button */}
            {(order.status === "pending" || order.status === "confirmed") && (
              <button
                onClick={() => router.push("/menu")}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "12px",
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                🔍 Browse Menu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </MobileLayout>
  );
}
