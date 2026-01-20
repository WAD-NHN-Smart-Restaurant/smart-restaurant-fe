"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentOrder, requestBill, callWaiter } from "@/api/order-api";
import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AlertTriangle } from "lucide-react";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { BottomNav } from "@/components/bottom-nav";
import { formatPrice } from "@/utils/format";
import { useAuth } from "@/context/auth-context";
import {
  connectSocket,
  disconnectSocket,
  joinTable,
  onOrderStatusUpdated,
  onOrderItemUpdated,
} from "@/libs/socket";

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

// Compute order totals locally to avoid stale/missing totals from backend
const computeOrderTotals = (items: OrderItem[]) => {
  return items.reduce((sum, item) => {
    const optionsTotal = (item.options || []).reduce(
      (optSum, opt) => optSum + opt.priceAtTime,
      0,
    );
    return sum + item.quantity * (item.unitPrice + optionsTotal);
  }, 0);
};

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

const ORDER_STATUS_BADGE: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: { label: "Pending", bg: "#f5f7fb", color: "#5c6b7a" },
  accepted: { label: "Preparing", bg: "#fff4e5", color: "#d35400" },
  preparing: { label: "Preparing", bg: "#fff4e5", color: "#d35400" },
  ready: { label: "Ready", bg: "#d8f5df", color: "#1f9254" },
  served: { label: "Served", bg: "#d8f5df", color: "#1f9254" },
  payment_pending: { label: "Payment", bg: "#e9f3ff", color: "#1f7af2" },
  completed: { label: "Completed", bg: "#e7f6ff", color: "#1f7af2" },
  cancelled: { label: "Cancelled", bg: "#ffe5e5", color: "#c0392b" },
  rejected: { label: "Rejected", bg: "#ffe5e5", color: "#c0392b" },
};

const ORDER_STATUS_STEP_INDEX: Record<string, number> = {
  pending: 0,
  accepted: 0,
  preparing: 1,
  ready: 2,
  served: 2,
  payment_pending: 2,
  completed: 2,
  cancelled: 0,
  rejected: 0,
};

const ITEM_STATUS_BADGE: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: { label: "Queued", bg: "#e8f4fd", color: "#2980b9" },
  accepted: { label: "Queued", bg: "#e8f4fd", color: "#2980b9" },
  preparing: { label: "Cooking", bg: "#fff4e6", color: "#e67e22" },
  ready: { label: "Ready", bg: "#d5f4e6", color: "#27ae60" },
  served: { label: "Served", bg: "#d5f4e6", color: "#27ae60" },
  rejected: { label: "Rejected", bg: "#ffebee", color: "#c0392b" },
};

const formatRelativeTime = (timestamp: string) => {
  if (!timestamp) return "Just now";
  const target = new Date(timestamp).getTime();
  if (isNaN(target)) return "Just now";
  const now = Date.now();
  const diffMs = now - target;

  // If difference is negative or very small, return "Just now"
  if (diffMs < 0 || diffMs < 1000) return "Just now";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hrs ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const getOrderStepIndex = (status: string) =>
  ORDER_STATUS_STEP_INDEX[status] ?? 0;

export function OrderInfoContent() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | undefined>(undefined);
  const [isHoveringRequestBill, setIsHoveringRequestBill] = useState(false);
  const [isHoveringCallWaiter, setIsHoveringCallWaiter] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const isCustomer = Boolean(isAuthenticated && user);

  // Load table number from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("guest_table_number");
    if (saved) {
      setTableNumber(saved);
    }
  }, []);

  // Derived totals for rendering
  const itemsCount = useMemo(() => {
    if (!order) return 0;
    return order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [order]);

  const sessionTotal = useMemo(() => {
    if (!order) return 0;
    // Recompute to stay accurate with live item updates
    return order.totalAmount || computeOrderTotals(order.orderItems);
  }, [order]);

  const renderOrderCard = (
    data: Order,
    idx: number,
    totalCount: number,
    variant: "current" | "past" = "current",
  ) => {
    const pill = ORDER_STATUS_BADGE[data.status] ?? {
      label: data.status,
      bg: "#f5f7fb",
      color: "#5c6b7a",
    };
    const stepIndex = getOrderStepIndex(data.status);
    const steps = ["Received", "Preparing", "Ready"];
    // const stepColors = ["#23a05d", "#e74c3c", "#23a05d"];
    const orderTotal =
      data.totalAmount != null
        ? data.totalAmount
        : computeOrderTotals(data.orderItems);

    const getItemBadge = (status: string) => {
      const meta = ITEM_STATUS_BADGE[status] ?? {
        label: status,
        bg: "#eef2f7",
        color: "#667085",
      };
      const icon =
        status === "preparing"
          ? "🔥"
          : status === "ready" || status === "served"
            ? "✅"
            : status === "rejected"
              ? "⛔"
              : "⏳";
      return { ...meta, icon };
    };

    return (
      <div
        key={`${variant}-${data.id}`}
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "18px",
          boxShadow: "0 12px 32px rgba(17,24,39,0.08)",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#1f3b57",
                marginBottom: "4px",
              }}
            >
              Order #{totalCount - idx}
            </div>
            <div style={{ fontSize: "13px", color: "#7f8c9d" }}>
              {formatRelativeTime(data.createdAt)}
            </div>
          </div>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: "18px",
              background: pill.bg,
              color: pill.color,
              fontWeight: 700,
              fontSize: "13px",
              textTransform: "capitalize",
            }}
          >
            {pill.label}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: "16px",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {steps.map((label, stepIdx) => {
            const isCompleted = stepIdx < stepIndex;
            const isActive = stepIdx === stepIndex;
            const circleColor = isCompleted
              ? "#23a05d"
              : isActive
                ? "#e74c3c"
                : "#e0e6ed";
            const lineColor = isCompleted ? "#23a05d" : "#e0e6ed";
            return (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", minWidth: 0 }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: circleColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    boxShadow: isActive
                      ? "0 0 0 6px rgba(232,76,60,0.18)"
                      : "none",
                    animation: isActive
                      ? "pulse 1.8s ease-in-out infinite"
                      : "none",
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? "✓" : stepIdx + 1}
                </div>
                <div
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: isCompleted || isActive ? "#1f3b57" : "#9aa5b5",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </div>
                {stepIdx < steps.length - 1 && (
                  <div
                    style={{
                      width: 40,
                      height: 2,
                      background: lineColor,
                      marginLeft: 8,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.orderItems.map((item) => {
            const badge = getItemBadge(item.status);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: "1px solid #eef1f5",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: "#d64034",
                    minWidth: 32,
                    textAlign: "right",
                  }}
                >
                  {item.quantity}x
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#1f3b57",
                      marginBottom: 4,
                      fontSize: 15,
                    }}
                  >
                    {item.menuItemName || "Item"}
                  </div>
                  <div style={{ color: "#7f8c9d", fontSize: 12 }}>
                    {formatPrice(item.unitPrice)}
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div
                      style={{ marginTop: 6, fontSize: 12, color: "#6c7a89" }}
                    >
                      {item.options.map((opt) => (
                        <div key={opt.id}>
                          + {opt.optionName} ({formatPrice(opt.priceAtTime)})
                        </div>
                      ))}
                    </div>
                  )}
                  {item.specialRequest && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "#c0392b",
                        fontStyle: "italic",
                      }}
                    >
                      Note: {item.specialRequest}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "14px",
                    background: badge.bg,
                    color: badge.color,
                    fontWeight: 700,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 92,
                    justifyContent: "center",
                  }}
                >
                  <span>{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {data.status === "ready" && (
          <div
            style={{
              marginTop: 12,
              padding: "12px",
              background: "#e6f7ec",
              borderRadius: "12px",
              color: "#1f7a3c",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🎉 Your order is ready! Please pick up at the counter.
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            marginTop: "8px",
            borderTop: "2px dashed #e5e7eb",
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 16, color: "#1f3b57" }}>
            Order Total
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "#1f3b57",
            }}
          >
            {formatPrice(orderTotal)}
          </span>
        </div>
      </div>
    );
  };

  const currentOrders = order ? [order] : [];
  const pastOrders: Order[] = [];

  // Initialize WebSocket connection
  useEffect(() => {
    const storedTableId = localStorage.getItem("tableId");
    if (storedTableId) {
      // Connect to Socket.io
      const socket = connectSocket();

      socket.on("connect", () => {
        console.log("Socket connected");
        joinTable(storedTableId);
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
      });

      // Listen for real-time updates
      const unsubscribeOrderStatus = onOrderStatusUpdated((data) => {
        console.log("Order status updated:", data);
        setOrder((prev) => {
          if (prev && prev.id === data.order_id) {
            return { ...prev, status: data.status };
          }
          return prev;
        });
      });

      const unsubscribeOrderItem = onOrderItemUpdated((data) => {
        console.log("Order item updated:", data);
        setOrder((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            orderItems: prev.orderItems.map((item) =>
              item.id === data.order_item_id
                ? { ...item, status: data.status }
                : item,
            ),
          };
        });

        // Show notification for rejected items
        if (data.status === "rejected" && data.rejected_reason) {
          setError(`Item rejected: ${data.rejected_reason}`);
          setTimeout(() => setError(null), 5000);
        }
      });

      return () => {
        unsubscribeOrderStatus();
        unsubscribeOrderItem();
        disconnectSocket();
      };
    }
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getCurrentOrder();
        // Response has structure: {success, data: {status, data: RawOrder}}
        if (response?.success && response.data?.status) {
          const raw = response.data.data as any; // Backend may return camelCase or snake_case

          // Handle both camelCase (new) and snake_case (old) responses
          const orderItems = raw.orderItems || raw.order_items || [];

          const mappedItems = orderItems.map((it: any) => ({
            id: it.id,
            menuItemId: it.menuItemId || it.menu_item_id,
            menuItemName: it.menuItemName || it.menu_item_name || undefined,
            quantity: it.quantity,
            unitPrice: it.unitPrice || it.unit_price,
            specialRequest:
              it.notes || it.specialRequest || it.special_request || undefined,
            status: it.status,
            options: (it.orderItemOptions || it.order_item_options || []).map(
              (op: any) => ({
                id: op.id,
                optionName: op.optionName || op.option_name || undefined,
                priceAtTime: op.priceAtTime || op.price_at_time,
              }),
            ),
          }));

          const mapped: Order = {
            id: raw.id,
            tableId: raw.tableId || raw.table_id,
            status: raw.status,
            guestName: raw.guestName || raw.guest_name || undefined,
            notes:
              raw.notes ||
              raw.specialRequest ||
              raw.special_request ||
              undefined,
            createdAt: raw.createdAt || raw.created_at,
            orderItems: mappedItems,
            // Prefer backend total_amount/totalAmount when provided, otherwise compute locally
            totalAmount:
              raw.totalAmount ??
              raw.total_amount ??
              computeOrderTotals(mappedItems),
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
    // Socket updates handle live changes; no polling to avoid UI flicker
    return () => undefined;
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
        <MobileHeader title="Your Orders" tableNumber={tableNumber} />
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

  if (!isLoading && !order) {
    return (
      <MobileLayout>
        <MobileHeader title="Your Orders" tableNumber={tableNumber} />
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
      <MobileHeader
        title="Your Orders"
        tableNumber={tableNumber}
        showLeftMenu={isCustomer}
      />

      <div style={{ paddingBottom: "80px", background: "#f8f9fa" }}>
        {/* Session Summary Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
            color: "white",
            padding: "16px 20px",
            marginBottom: "2px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
            }}
          >
            {/* Left Section */}
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: "15px", marginBottom: "8px", opacity: 0.9 }}
              >
                Current Session Total
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  marginBottom: "12px",
                }}
              >
                {formatPrice(sessionTotal)}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "15px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  📋 <span>{currentOrders.length}</span> orders
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  🍽️ <span>{itemsCount}</span> items
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={handleRequestBill}
                disabled={
                  isSubmitting ||
                  order?.status === "payment_pending" ||
                  order?.status === "completed"
                }
                onMouseEnter={() => setIsHoveringRequestBill(true)}
                onMouseLeave={() => setIsHoveringRequestBill(false)}
                style={{
                  padding: "8px 16px",
                  background:
                    order?.status === "payment_pending" ||
                    order?.status === "completed"
                      ? "#cccccc"
                      : isHoveringRequestBill && !isSubmitting
                        ? "#f5f5f5"
                        : "white",
                  color:
                    order?.status === "payment_pending" ||
                    order?.status === "completed"
                      ? "#666666"
                      : "#e74c3c",
                  border: "none",
                  borderRadius: "20px",
                  fontWeight: "700",
                  cursor:
                    isSubmitting ||
                    order?.status === "payment_pending" ||
                    order?.status === "completed"
                      ? "not-allowed"
                      : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  transform:
                    isHoveringRequestBill &&
                    !isSubmitting &&
                    !(
                      order?.status === "payment_pending" ||
                      order?.status === "completed"
                    )
                      ? "scale(1.05)"
                      : "scale(1)",
                  boxShadow:
                    isHoveringRequestBill &&
                    !isSubmitting &&
                    !(
                      order?.status === "payment_pending" ||
                      order?.status === "completed"
                    )
                      ? "0 4px 12px rgba(231, 76, 60, 0.2)"
                      : "none",
                }}
              >
                {order?.status === "payment_pending"
                  ? "Bill Requested"
                  : order?.status === "completed"
                    ? "Paid"
                    : "Request Bill"}
              </button>
              <button
                onClick={handleCallWaiter}
                disabled={isCallingWaiter}
                onMouseEnter={() => setIsHoveringCallWaiter(true)}
                onMouseLeave={() => setIsHoveringCallWaiter(false)}
                style={{
                  padding: "8px 16px",
                  background:
                    isHoveringCallWaiter && !isCallingWaiter
                      ? "rgba(255, 255, 255, 0.35)"
                      : "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  border: `1px solid ${isHoveringCallWaiter && !isCallingWaiter ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.4)"}`,
                  borderRadius: "20px",
                  fontWeight: "600",
                  cursor: isCallingWaiter ? "not-allowed" : "pointer",
                  opacity: isCallingWaiter ? 0.6 : 1,
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  transform:
                    isHoveringCallWaiter && !isCallingWaiter
                      ? "scale(1.05)"
                      : "scale(1)",
                  boxShadow:
                    isHoveringCallWaiter && !isCallingWaiter
                      ? "0 4px 12px rgba(255, 255, 255, 0.2)"
                      : "none",
                }}
              >
                {isCallingWaiter ? "Calling..." : "Call Waiter"}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {info && (
          <div
            style={{
              margin: "16px 16px 0",
              padding: "12px 16px",
              background: "#e8f4fd",
              color: "#2980b9",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {info}
          </div>
        )}

        {error && order && (
          <div
            style={{
              margin: "16px 16px 0",
              padding: "12px 16px",
              background: "#ffebee",
              color: "#c62828",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Current Orders Section */}
        <div style={{ padding: "20px 16px" }}>
          {currentOrders.length > 0 && (
            <>
              {currentOrders.map((o, idx) =>
                renderOrderCard(o, idx, currentOrders.length, "current"),
              )}

              {![
                "payment_pending",
                "completed",
                "cancelled",
                "rejected",
              ].includes(order?.status || "") && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    marginTop: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      color: "#667085",
                      marginBottom: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Want to order more?
                  </div>
                  <button
                    onClick={() => router.push("/menu")}
                    style={{
                      padding: "10px 24px",
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      borderRadius: "20px",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>🍽️</span>
                    <span>Browse Menu</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Past Orders Section (only for customers) */}
        {isCustomer && pastOrders.length > 0 && (
          <div style={{ padding: "0 16px 20px" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#1f3b57",
                marginBottom: "16px",
              }}
            >
              Past Orders
            </div>
            {pastOrders.map((o, idx) =>
              renderOrderCard(o, idx, pastOrders.length, "past"),
            )}
          </div>
        )}
      </div>

      <BottomNav />

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(232,76,60,0.35); }
          70% { box-shadow: 0 0 0 10px rgba(232,76,60,0); }
          100% { box-shadow: 0 0 0 0 rgba(232,76,60,0); }
        }
      `}</style>
    </MobileLayout>
  );
}
