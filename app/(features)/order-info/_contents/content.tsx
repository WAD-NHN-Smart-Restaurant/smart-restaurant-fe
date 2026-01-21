"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { requestBill, callWaiter } from "@/api/order-api";
import { Button } from "@/components/ui/button";
import {
  PartyPopper,
  ClipboardList,
  Utensils,
  Clock,
  ChefHat,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { BottomNav } from "@/components/bottom-nav";
import { formatPrice } from "@/utils/format";
import { useAuth } from "@/context/auth-context";
import type { Order, OrderItem } from "@/types/order-type";
import {
  connectSocket,
  disconnectSocket,
  joinTable,
  onOrderStatusUpdated,
  onOrderItemUpdated,
} from "@/libs/socket";
import { useQueryClient } from "@tanstack/react-query";
import { ORDER_QUERY_KEYS, useActiveOrderQuery } from "@/hooks/use-order-query";

// Helper function to extract error message from various error types
const getErrorMessage = (err: unknown): string => {
  if (!err) return "An unknown error occurred";

  if (typeof err === "object" && err !== null) {
    const error = err as Record<string, unknown>;

    if (typeof error.message === "string") {
      return error.message;
    }

    if (
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data &&
      typeof (error.data as Record<string, unknown>).message === "string"
    ) {
      return (error.data as Record<string, unknown>).message as string;
    }
  }

  if (typeof err === "string") return err;

  return "An unexpected error occurred";
};

// Compute order totals locally to avoid stale/missing totals from backend
const computeOrderTotals = (items: OrderItem[]) => {
  return items.reduce((sum, item) => {
    const optionsTotal = (item.orderItemOptions || []).reduce(
      (optSum, opt) => optSum + opt.priceAtTime,
      0,
    );
    return sum + item.quantity * (item.unitPrice + optionsTotal);
  }, 0);
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

const ITEM_STATUS_BADGE: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: { label: "Queued", bg: "#e8f4fd", color: "#2980b9" },
  accepted: { label: "Accepted", bg: "#e8f4fd", color: "#2482b9" },
  preparing: { label: "Cooking", bg: "#fff4e6", color: "#e67e22" },
  ready: { label: "Ready", bg: "#d5f4e6", color: "#16ae60" },
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

export function OrderInfoContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useActiveOrderQuery();
  const [error, setError] = useState<string | null>(null);
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
    return order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }, [order]);

  const sessionTotal = useMemo(() => {
    if (!order) return 0;
    // Recompute to stay accurate with live item updates
    return order.totalAmount || computeOrderTotals(order.orderItems || []);
  }, [order]);

  const renderOrderCard = (
    data: Order,
    idx: number,
    totalCount: number,
    variant: "current" | "past" = "current",
  ) => {
    // Calculate step index based on order items status (excluding rejected items)
    const nonRejectedItems =
      data.orderItems?.filter((item) => item.status !== "rejected") || [];
    let stepIndex = 0;
    let itemsStatus = "pending";
    if (nonRejectedItems.length > 0) {
      const allAccepted = nonRejectedItems.every((item) =>
        ["accepted", "preparing", "ready", "served"].includes(item.status),
      );
      const allReady = nonRejectedItems.every((item) =>
        ["ready", "served"].includes(item.status),
      );
      const allServed = nonRejectedItems.every(
        (item) => item.status === "served",
      );
      if (allServed) {
        stepIndex = 3; // All steps completed
        itemsStatus = "served";
      } else if (allReady) {
        stepIndex = 2; // Ready is active
        itemsStatus = "ready";
      } else if (allAccepted) {
        stepIndex = 1; // Preparing is active
        itemsStatus = "preparing";
      }
      // else calculatedStepIndex = 0 (Received is active), itemsStatus = 'pending'
    }
    // Determine pill based on order status or items status
    let displayStatus = itemsStatus;
    if (
      ["payment_pending", "completed", "cancelled", "rejected"].includes(
        data.status,
      )
    ) {
      displayStatus = data.status;
    }

    const pill = ORDER_STATUS_BADGE[displayStatus] ?? {
      label: data.status,
      bg: "#f5f7fb",
      color: "#5c6b7a",
    };
    const steps = ["Received", "Preparing", "Ready"];
    // const stepColors = ["#23a05d", "#e74c3c", "#23a05d"];
    const orderTotal =
      data.totalAmount != null
        ? data.totalAmount
        : computeOrderTotals(data.orderItems || []);

    const getItemBadge = (status: string) => {
      const meta = ITEM_STATUS_BADGE[status] ?? {
        label: status,
        bg: "#eef2f7",
        color: "#667085",
      };
      const IconComponent =
        status === "preparing"
          ? Flame
          : status === "ready" || status === "served"
            ? CheckCircle2
            : status === "rejected"
              ? XCircle
              : status === "accepted"
                ? ChefHat
                : Clock;
      return { ...meta, IconComponent };
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
          {data.orderItems?.map((item) => {
            const badge = getItemBadge(item.status);
            return (
              <div
                style={{
                  borderBottom: "1px solid #eef1f5",
                }}
                key={item.id}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 0",
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
                    {item.orderItemOptions &&
                      item.orderItemOptions.length > 0 && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#6c7a89",
                          }}
                        >
                          {item.orderItemOptions.map((opt) => (
                            <div key={opt.id}>
                              + {opt.optionName} ({formatPrice(opt.priceAtTime)}
                              )
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
                    <badge.IconComponent size={14} />
                    <span>{badge.label}</span>
                  </div>
                </div>
                {item.status === "rejected" && item.notes && (
                  <div className=" text-red-500 px-10 mb-1 italic text-sm">
                    Reject reason: {item.notes}
                  </div>
                )}
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
            <PartyPopper /> <span>Your order is ready!.</span>
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
  // Check if all items are ready or served (for bill request)
  const canRequestBill = useMemo(() => {
    const filterItems = order?.orderItems?.filter(
      (item) => item.status !== "rejected",
    );
    if (!filterItems || filterItems.length === 0) return false;
    return filterItems.every((item) => item.status === "served");
  }, [order]);

  // Initialize WebSocket connection
  useEffect(() => {
    const storedTableId = localStorage.getItem("guest_table_id");
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
        // Invalidate and refetch the active order query
        queryClient.invalidateQueries({ queryKey: ["orders", "active"] });
      });

      const unsubscribeOrderItem = onOrderItemUpdated((data) => {
        console.log("Order item updated:", data);
        queryClient.invalidateQueries({ queryKey: ["orders", "active"] });

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
  }, [queryClient]);

  const handleRequestBill = async () => {
    if (!order) {
      setError("No active order found");
      return;
    }

    try {
      setError(null);
      setInfo(null);
      setError(null);
      const response = await requestBill(order.id);
      if (response?.success && response.data?.status) {
        // Save order ID to session storage for payment page
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pending_payment_order_id", order.id);
        }
        // Update order status
        queryClient.setQueryData<Order>(ORDER_QUERY_KEYS.active(), {
          ...order,
          status: "payment_pending",
        });
        // setOrder({ ...order, status: "payment_pending" });
        // Auto-navigate to payment page where customer will see the waiting screen
        // and automatic updates when waiter accepts the payment
        router.push("/payment");
      } else {
        setError("Unable to request bill");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err) || "Error requesting bill";
      setError(message);
    }
  };

  const handleCallWaiter = async () => {
    try {
      setIsCallingWaiter(true);
      setError(null);
      setInfo(null);
      const response = await callWaiter();
      if (response?.success) {
        setInfo("Waiter notified. Please stay seated.");
      } else {
        setError(response.data?.message || "Unable to call waiter");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err) || "Error calling waiter";
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
        <MobileHeader
          title="Your Orders"
          tableNumber={tableNumber}
          showLeftMenu={isCustomer}
        />
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
                  <ClipboardList size={16} />{" "}
                  <span>{currentOrders.length}</span> orders
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Utensils size={16} /> <span>{itemsCount}</span> items
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
                  order?.status === "payment_pending" ||
                  order?.status === "completed" ||
                  !canRequestBill
                }
                onMouseEnter={() => setIsHoveringRequestBill(true)}
                onMouseLeave={() => setIsHoveringRequestBill(false)}
                style={{
                  padding: "8px 16px",
                  background:
                    order?.status === "payment_pending" ||
                    order?.status === "completed" ||
                    !canRequestBill
                      ? "#cccccc"
                      : isHoveringRequestBill
                        ? "#f5f5f5"
                        : "white",
                  color:
                    order?.status === "payment_pending" ||
                    order?.status === "completed" ||
                    !canRequestBill
                      ? "#666666"
                      : "#e74c3c",
                  border: "none",
                  borderRadius: "20px",
                  fontWeight: "700",
                  cursor:
                    order?.status === "payment_pending" ||
                    order?.status === "completed" ||
                    !canRequestBill
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  transform:
                    isHoveringRequestBill &&
                    canRequestBill &&
                    !(
                      order?.status === "payment_pending" ||
                      order?.status === "completed"
                    )
                      ? "scale(1.05)"
                      : "scale(1)",
                  boxShadow:
                    isHoveringRequestBill &&
                    canRequestBill &&
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
                    : !canRequestBill
                      ? "Items Not Served"
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
                    <Utensils size={18} />
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
