"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentOrder } from "@/api/order-api";
import {
  InitiatePaymentResponse,
  initiatePayment,
  confirmPayment,
  getPaymentStatus,
  getPaymentByOrderId,
  PaymentStatusResponse,
} from "@/api/payment-api";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { formatPrice } from "@/utils/format";
// import { useAuth } from "@/context/auth-context";

// Helper function to extract error message from various error types
const getErrorMessage = (err: unknown): string => {
  if (!err) return "An unknown error occurred";

  // If it's an axios error response
  if (typeof err === "object" && err !== null) {
    const error = err as Record<string, unknown>;

    // Check for message property
    if (typeof error.message === "string") {
      return error.message;
    }

    // Check for nested data.message
    if (
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data &&
      typeof (error.data as Record<string, unknown>).message === "string"
    ) {
      return (error.data as Record<string, unknown>).message as string;
    }

    // Check for response.data.message
    if (
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      const responseData = (error.response as Record<string, unknown>).data;
      if (
        responseData &&
        typeof responseData === "object" &&
        "message" in responseData &&
        typeof (responseData as Record<string, unknown>).message === "string"
      ) {
        return (responseData as Record<string, unknown>).message as string;
      }
    }
  }

  // Fallback to string conversion
  if (typeof err === "string") return err;

  return "An unexpected error occurred";
};

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
  status: "active" | "served" | "payment_pending" | "completed" | "cancelled";
  guestName?: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  orderItems: OrderItem[];
}

const computeOrderTotals = (items: OrderItem[]) => {
  return items.reduce((sum, item) => {
    const optionsTotal = (item.options || []).reduce(
      (optSum, opt) => optSum + opt.priceAtTime,
      0,
    );
    return sum + item.quantity * (item.unitPrice + optionsTotal);
  }, 0);
};

type RawOrder = {
  id: string;
  tableId: string;
  status: string;
  guestName?: string | null;
  specialRequest?: string | null;
  totalAmount?: number | null;
  createdAt: string;
  orderItems?: Array<{
    id: string;
    menuItemId: string;
    menuItemName?: string | null;
    quantity: number;
    unitPrice: number;
    specialRequest?: string | null;
    status: string;
    orderItemOptions?: Array<{
      id: string;
      optionName?: string | null;
      priceAtTime: number;
    }>;
  }>;
};

export function PaymentContent() {
  const SNAPSHOT_KEY = "payment_order_snapshot";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | undefined>(undefined);
  const [isPayingCash, setIsPayingCash] = useState(false);
  const [isPayingOnline, setIsPayingOnline] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<
    "cash" | "stripe" | null
  >(null);
  const hasConfirmedPayment = useRef(false);

  // Payment ID and status
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentStatusResponse | null>(
    null,
  );
  const [isWaitingForBill, setIsWaitingForBill] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Payment UI state
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "cash">(
    "stripe",
  );
  const [tipMode, setTipMode] = useState<"10" | "15" | "20" | "custom">("15");
  const [customTipInput, setCustomTipInput] = useState<string>("");

  // Discount state - will be set from payment data instead of user input
  const [discountRate, setDiscountRate] = useState<number>(0);

  // Sync discount fields from payment data (camelCase from backend)
  useEffect(() => {
    if (paymentData?.discountRate !== undefined) {
      setDiscountRate(paymentData.discountRate || 0);
    }
  }, [paymentData?.discountRate]);

  // Calculated totals
  const subtotal = useMemo(() => {
    if (!order) return 0;
    return computeOrderTotals(order.orderItems);
  }, [order]);

  // Use discount from payment data, not from user input
  const calculatedDiscountAmount = useMemo(() => {
    // Once payment data is loaded, use its discount amounts
    // Backend returns camelCase: discountRate, discountAmount
    if (paymentData && paymentData.discountRate) {
      // Calculate discount amount from subtotal * discountRate if discountAmount is 0
      if (paymentData.discountAmount > 0) {
        return paymentData.discountAmount;
      } else {
        // Calculate: discount_amount = subtotal * (discountRate / 100)
        return (
          Math.round(((subtotal * paymentData.discountRate) / 100) * 100) / 100
        );
      }
    }
    return 0;
  }, [paymentData, subtotal]);

  // Display discount rate pulled from payment data when available
  const displayDiscountRate = useMemo(() => {
    return paymentData?.discountRate ?? discountRate ?? 0;
  }, [paymentData?.discountRate, discountRate]);
  const subtotalAfterDiscount = useMemo(
    () => Math.round((subtotal - calculatedDiscountAmount) * 100) / 100,
    [subtotal, calculatedDiscountAmount],
  );

  const tax = useMemo(
    () => Math.round(subtotalAfterDiscount * 0.1 * 100) / 100,
    [subtotalAfterDiscount],
  );
  const total = useMemo(
    () => Math.round((subtotalAfterDiscount + tax) * 100) / 100,
    [subtotalAfterDiscount, tax],
  );

  const tipPercentage = useMemo(() => {
    if (tipMode === "custom") {
      const parsed = Number(customTipInput);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    return Number(tipMode);
  }, [tipMode, customTipInput]);

  const tipAmount = useMemo(
    () => Math.round(((total * tipPercentage) / 100) * 100) / 100,
    [total, tipPercentage],
  );
  const grandTotal = useMemo(
    () => Math.round((total + tipAmount) * 100) / 100,
    [total, tipAmount],
  );

  // Load table number
  useEffect(() => {
    const saved = localStorage.getItem("guest_table_number");
    if (saved) {
      setTableNumber(saved);
    }
  }, []);

  // Fetch order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getCurrentOrder();
        const controller = result?.data;
        const raw = controller?.data as RawOrder | undefined;

        if (!result?.success || !controller?.status || !raw) {
          setError("No active order found");
          setOrder(null);
          return;
        }

        const normalized: Order = {
          id: raw.id,
          tableId: raw.tableId,
          status: (raw.status as Order["status"]) || "active",
          guestName: raw.guestName ?? undefined,
          notes: raw.specialRequest ?? undefined,
          totalAmount: raw.totalAmount ?? 0,
          createdAt: raw.createdAt,
          orderItems: (raw.orderItems || []).map((item) => ({
            id: item.id,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName ?? undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            specialRequest: item.specialRequest ?? undefined,
            status: (item.status as OrderItem["status"]) || "active",
            options: (item.orderItemOptions || []).map((opt) => ({
              id: opt.id,
              optionName: opt.optionName ?? undefined,
              priceAtTime: opt.priceAtTime,
            })),
          })),
        };

        setOrder(normalized);

        // Try to get payment by order ID (will exist if customer has requested bill)
        try {
          const paymentResponse = await getPaymentByOrderId(raw.id);
          console.log("Raw payment response:", paymentResponse);
          console.log("paymentResponse.data:", paymentResponse?.data);

          // Handle both response formats: { success: true, data: { ... } } and { status: true, data: { ... } }
          const isSuccess = (paymentResponse?.success ||
            paymentResponse?.data?.status) as boolean;
          const rawPayment =
            paymentResponse?.data?.data || paymentResponse?.data;
          const paymentData: PaymentStatusResponse = {
            ...(rawPayment || {}),
            discountRate:
              rawPayment?.discountRate ?? rawPayment?.discountRate ?? 0,
            discountAmount:
              rawPayment?.discountAmount ?? rawPayment?.discountAmount ?? 0,
          } as PaymentStatusResponse;

          console.log("Extracted paymentData:", paymentData);
          console.log("paymentData keys:", Object.keys(paymentData || {}));

          if (isSuccess && paymentData?.status) {
            console.log("Initial payment found:", {
              status: paymentData.status,
              discountRate: paymentData.discountRate,
              discountAmount: paymentData.discountAmount,
              fullPayment: paymentData,
            });
            setPaymentId(paymentData.id);
            setPaymentStatus(paymentData.status);
            setPaymentData(paymentData);

            // If payment status is 'created', show waiting message
            if (paymentData.status === "created") {
              console.log("Payment is created, showing waiting screen");
              setIsWaitingForBill(true);
            } else if (paymentData.status === "accepted") {
              console.log(
                "Payment already accepted, discountRate:",
                paymentData.discountRate,
                "discountAmount:",
                paymentData.discountAmount,
              );
              setDiscountRate(paymentData.discountRate || 0);
              setIsWaitingForBill(false);
            }
          }
        } catch (err) {
          // Payment doesn't exist yet or error - this is normal, will be created on request bill
          console.log("No payment found yet for order:", getErrorMessage(err));
        }
      } catch (err: unknown) {
        const message = getErrorMessage(err) || "Failed to load order";
        setError(message);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, []);

  // Poll for payment status when waiting for bill
  useEffect(() => {
    if (!paymentId || paymentStatus !== "created") {
      return;
    }

    const pollPaymentStatus = async () => {
      try {
        const response = await getPaymentStatus(paymentId);
        console.log("Raw poll response:", response);
        console.log("response.data:", response?.data);

        // Handle both response formats: { success: true, data: { ... } } and { status: true, data: { ... } }
        const isSuccess = (response?.success ||
          response?.data?.status) as boolean;
        const rawPayment = response?.data?.data || response?.data;
        const paymentData: PaymentStatusResponse = {
          ...(rawPayment || {}),
          discountRate:
            rawPayment?.discountRate ?? rawPayment?.discountRate ?? 0,
          discountAmount:
            rawPayment?.discountAmount ?? rawPayment?.discountAmount ?? 0,
        } as PaymentStatusResponse;

        console.log("Extracted polling paymentData:", paymentData);
        console.log("paymentData keys:", Object.keys(paymentData || {}));

        if (isSuccess && paymentData?.status) {
          console.log("Payment status updated:", {
            status: paymentData.status,
            discountRate: paymentData.discountRate,
            discountAmount: paymentData.discountAmount,
            fullPayment: paymentData,
          });
          setPaymentStatus(paymentData.status);
          setPaymentData(paymentData);

          // When status becomes 'accepted', it means waiter has set discount
          if (paymentData.status === "accepted") {
            console.log(
              "Payment accepted! discountRate:",
              paymentData.discountRate,
              "discountAmount:",
              paymentData.discountAmount,
            );
            setDiscountRate(paymentData.discountRate || 0);
            setIsWaitingForBill(false);
            // The payment form will now be displayed automatically
            // because isWaitingForBill is false and showBillPreview is false
          }
        }
      } catch (err) {
        console.error("Error polling payment status:", getErrorMessage(err));
      }
    };

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(pollPaymentStatus, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [paymentId, paymentStatus]);

  // If returning from checkout with paid flag, show bill preview
  useEffect(() => {
    const paid = searchParams.get("paid");
    const method = searchParams.get("method");
    const paymentIdParam = searchParams.get("paymentId");

    // Stripe success: confirm payment server-side to mark success/completed
    if (
      paid === "1" &&
      method === "stripe" &&
      paymentIdParam &&
      !hasConfirmedPayment.current &&
      !isConfirmingPayment
    ) {
      hasConfirmedPayment.current = true;
      setIsConfirmingPayment(true);
      confirmPayment(paymentIdParam, "success")
        .catch((err) => {
          // If webhook already handled, ignore; otherwise surface a message
          console.error("Confirm payment error:", getErrorMessage(err));
          setError((prev) => prev ?? "Unable to confirm Stripe payment");
        })
        .finally(() => {
          setIsConfirmingPayment(false);
          setCompletedPaymentMethod("stripe");
          setShowBillPreview(true);
        });
      return;
    }

    if (paid === "1" && method && ["cash", "stripe"].includes(method)) {
      setCompletedPaymentMethod(method as typeof completedPaymentMethod);
      setShowBillPreview(true);
    }
  }, [searchParams, isConfirmingPayment]);

  // Persist order snapshot for post-payment bill preview
  useEffect(() => {
    if (!order) return;
    try {
      const payload = {
        order,
        tableNumber,
        tipMode,
        customTipInput,
      };
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to persist order snapshot", e);
    }
  }, [order, tableNumber, tipMode, customTipInput]);

  // Restore snapshot when returning from payment and backend has no active order
  useEffect(() => {
    if (!showBillPreview || order) return;
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          order?: Order;
          tableNumber?: string;
          tipMode?: typeof tipMode;
          customTipInput?: string;
        };
        if (parsed.order) {
          setOrder(parsed.order);
          if (parsed.tableNumber) setTableNumber(parsed.tableNumber);
          if (parsed.tipMode) setTipMode(parsed.tipMode);
          if (parsed.customTipInput !== undefined)
            setCustomTipInput(parsed.customTipInput);
        }
      }
    } catch (e) {
      console.error("Failed to restore order snapshot", e);
    }
  }, [showBillPreview, order]);

  // Payment handlers
  const handlePayAtCounter = async () => {
    try {
      setIsPayingCash(true);
      setError(null);

      const response = await initiatePayment(
        "cash",
        undefined,
        tipAmount,
        calculatedDiscountAmount,
      );

      if (response?.success && response.data?.status) {
        // Payment successful - show bill preview
        setCompletedPaymentMethod("cash");
        setShowBillPreview(true);
      } else {
        setError(response.data?.message || "Unable to record payment");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err) || "Error recording payment";
      setError(message);
    } finally {
      setIsPayingCash(false);
    }
  };

  const handlePayWithQr = async () => {
    try {
      setIsPayingOnline(true);
      setError(null);

      const origin = window.location.origin;
      const successReturnUrl = `${origin}/payment?paid=1&method=${selectedMethod}`;

      const response = await initiatePayment(
        selectedMethod,
        successReturnUrl,
        tipAmount,
        calculatedDiscountAmount,
      );
      if (response?.success && response.data?.status) {
        const payload =
          (response.data.data as InitiatePaymentResponse | undefined) || null;

        const checkoutUrl =
          payload?.checkoutUrl || payload?.payment?.checkout_url || "";

        if (!checkoutUrl) {
          setError("No payment URL received from server");
          setIsPayingOnline(false);
          return;
        }

        // Redirect directly to Stripe checkout page
        window.location.href = checkoutUrl;
      } else {
        setError(response.data?.message || "Unable to start online payment");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err) || "Error starting payment";
      setError(message);
    } finally {
      setIsPayingOnline(false);
    }
  };

  const handleCloseBillPreview = () => {
    setShowBillPreview(false);
    router.push("/order-info");
  };

  const handleDownloadPDF = async () => {
    try {
      const element = document.querySelector(
        "[data-print-content='true']",
      ) as HTMLElement;
      if (!element) {
        setError("Unable to find bill content");
        return;
      }

      // Dynamically import to avoid SSR issues
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      // Create a temporary copy to work with
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = element.innerHTML;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.width = "794px";
      tempDiv.style.backgroundColor = "white";

      document.body.appendChild(tempDiv);

      // Global safety override to force RGB/HEX colors before parsing
      const safetyStyle = document.createElement("style");
      safetyStyle.textContent = `
        * {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #e5e7eb !important;
          outline-color: #e5e7eb !important;
          box-shadow: none !important;
          text-shadow: none !important;
          background-image: none !important;
          caret-color: #000000 !important;
        }
      `;
      tempDiv.prepend(safetyStyle);

      // After mounting, force-safe styles on every node
      tempDiv.querySelectorAll("*").forEach((el) => {
        const node = el as HTMLElement;

        // Strip inline styles containing lab()/color()
        const inlineStyle = node.getAttribute("style");
        if (
          inlineStyle &&
          (inlineStyle.includes("lab(") || inlineStyle.includes("color("))
        ) {
          node.removeAttribute("style");
        }

        // Enforce safe inline overrides to guarantee RGB/HEX
        node.style.backgroundColor = "#ffffff";
        node.style.color = "#000000";
        node.style.borderColor = "#e5e7eb";
        node.style.outlineColor = "#e5e7eb";
        node.style.boxShadow = "none";
        node.style.textShadow = "none";
        node.style.backgroundImage = "none";
        node.style.caretColor = "#000000";
      });

      try {
        // Convert element to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 3,
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          removeContainer: false,
          imageTimeout: 10000,
          // timeout: 10000,
        });

        // Create PDF from canvas
        const imgData = canvas.toDataURL("image/png", 0.95);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const imgWidth = 210 - 20; // A4 width - margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const yPosition = 10; // top margin

        pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);

        // Download PDF
        const filename = `bill_table_${tableNumber}_${new Date().toISOString().split("T")[0]}.pdf`;
        pdf.save(filename);
      } finally {
        // Clean up temporary element
        document.body.removeChild(tempDiv);
      }
    } catch (err) {
      console.error("PDF download failed:", getErrorMessage(err));
      setError("Failed to generate PDF");
    }
  };

  const handlePay = () => {
    if (selectedMethod === "cash") {
      handlePayAtCounter();
    } else {
      handlePayWithQr();
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <MobileHeader title="Your Bill" tableNumber={tableNumber} />
        <div style={{ padding: "20px", textAlign: "center", color: "#667085" }}>
          Loading...
        </div>
      </MobileLayout>
    );
  }

  if (!showBillPreview && (error || !order)) {
    return (
      <MobileLayout>
        <MobileHeader title="Your Bill" tableNumber={tableNumber} />
        <div style={{ padding: "20px", textAlign: "center", color: "#c62828" }}>
          {error || "Order not found"}
        </div>
      </MobileLayout>
    );
  }

  // Show waiting message when bill is being prepared
  if (isWaitingForBill) {
    return (
      <MobileLayout showBottomNav={false}>
        <MobileHeader title="Your Bill" tableNumber={tableNumber} />
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <style>{`
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.1);
                opacity: 0.8;
              }
            }
            @keyframes rotate {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            @keyframes fadeInOut {
              0%, 100% {
                opacity: 0.5;
              }
              50% {
                opacity: 1;
              }
            }
            .waiting-icon {
              animation: pulse 2s ease-in-out infinite;
            }
            .waiting-emoji {
              display: inline-block;
              animation: rotate 3s linear infinite;
            }
            .waiting-text {
              animation: fadeInOut 2s ease-in-out infinite;
            }
          `}</style>
          <div
            className="waiting-icon"
            style={{
              width: "80px",
              height: "80px",
              background: "#e9f3ff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "40px",
            }}
          >
            <span className="waiting-emoji">⏳</span>
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#1f3b57",
              marginBottom: "12px",
            }}
          >
            Preparing Your Bill
          </div>
          <div
            className="waiting-text"
            style={{ color: "#667085", fontSize: "14px", lineHeight: "1.5" }}
          >
            The system has sent a bill request to the staff member, please wait
            a moment.
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Show bill preview for cash payment
  if (showBillPreview) {
    return (
      <MobileLayout showBottomNav={false}>
        <MobileHeader
          title="Payment Confirmed"
          tableNumber={tableNumber}
          data-no-print="true"
        />

        <div
          data-print-content="true"
          style={{
            padding: "20px 16px",
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 140px)",
          }}
        >
          {/* Success Icon */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "#10b981",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                fontSize: "40px",
              }}
            >
              ✓
            </div>
          </div>

          {/* Message */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#1f3b57",
                marginBottom: "8px",
              }}
            >
              Payment Recorded
            </div>
            <div style={{ color: "#667085", fontSize: "14px" }}>
              {completedPaymentMethod === "cash"
                ? "Your payment will be processed at the counter"
                : "Your payment has been received via Stripe"}
            </div>
          </div>

          {/* Bill Details */}
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
              flex: 1,
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🍽️</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#1f3b57",
                  marginBottom: "4px",
                }}
              >
                Smart Restaurant
              </div>
              <div style={{ color: "#667085", fontSize: "12px" }}>
                Table {tableNumber} |{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            <div
              style={{
                height: "1px",
                background:
                  "repeating-linear-gradient(to right, #e5e7eb 0, #e5e7eb 4px, transparent 4px, transparent 8px)",
                margin: "16px 0",
              }}
            />

            {/* Order Items */}
            <div style={{ marginBottom: "16px" }}>
              {order?.orderItems?.length ? (
                order.orderItems.map((item) => {
                  const optionsTotal = (item.options || []).reduce(
                    (sum, opt) => sum + opt.priceAtTime,
                    0,
                  );
                  const itemTotal =
                    item.quantity * (item.unitPrice + optionsTotal);

                  return (
                    <div key={item.id} style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                          fontSize: "14px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span
                            style={{
                              color: "#e74c3c",
                              fontWeight: 700,
                              minWidth: "24px",
                            }}
                          >
                            {item.quantity}x
                          </span>
                          <span style={{ fontWeight: 600, color: "#1f3b57" }}>
                            {item.menuItemName || "Item"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#1f3b57",
                            whiteSpace: "nowrap",
                            marginLeft: "8px",
                          }}
                        >
                          {formatPrice(itemTotal)}
                        </span>
                      </div>

                      {item.options && item.options.length > 0 && (
                        <div
                          style={{
                            paddingLeft: "32px",
                            color: "#9ca3af",
                            fontSize: "11px",
                          }}
                        >
                          {item.options.map((opt) => (
                            <div key={opt.id}>
                              + {opt.optionName || "Option"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  No items to display
                </div>
              )}
            </div>

            <div
              style={{
                height: "1px",
                background:
                  "repeating-linear-gradient(to right, #e5e7eb 0, #e5e7eb 4px, transparent 4px, transparent 8px)",
                margin: "16px 0",
              }}
            />

            {/* Totals */}
            <div style={{ fontSize: "13px", marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "#667085" }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
              </div>
              {calculatedDiscountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    color: "#10b981",
                  }}
                >
                  <span>
                    Discount
                    {displayDiscountRate > 0
                      ? ` (${displayDiscountRate}%)`
                      : ""}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    -{formatPrice(calculatedDiscountAmount)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span style={{ color: "#667085" }}>Tax (10%)</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(tax)}</span>
              </div>
              <div
                style={{
                  height: "1px",
                  background: "#e5e7eb",
                  margin: "10px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#1f3b57",
                }}
              >
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#667085" }}>Tip</span>
                <span style={{ fontWeight: 600 }}>
                  {formatPrice(tipAmount)}
                </span>
              </div>
              <div
                style={{
                  height: "1px",
                  background: "#e5e7eb",
                  margin: "10px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#1f3b57",
                  marginBottom: "16px",
                }}
              >
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#667085",
              textAlign: "center",
              marginBottom: "16px",
              fontStyle: "italic",
            }}
          >
            Thank you for dining with us! See you again soon!
          </div>
        </div>

        {/* Close Button */}
        <div
          style={{
            padding: "12px 16px 16px",
            background: "white",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleDownloadPDF}
              style={{
                flex: 1,
                padding: "14px 20px",
                background: "white",
                color: "#e74c3c",
                border: "2px solid #e74c3c",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              📄 Save PDF
            </button>
          </div>
          <button
            onClick={handleCloseBillPreview}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <MobileHeader title="Your Bill" tableNumber={tableNumber} />

      <div
        style={{
          padding: "20px 16px",
          maxWidth: "100%",
        }}
      >
        {/* Restaurant Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🍽️</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#1f3b57" }}>
            Smart Restaurant
          </div>
          <div style={{ color: "#667085", fontSize: "14px" }}>
            Table {tableNumber} |{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background:
              "repeating-linear-gradient(to right, #e5e7eb 0, #e5e7eb 4px, transparent 4px, transparent 8px)",
            margin: "20px 0",
          }}
        />

        {/* Order Items */}
        <div style={{ marginBottom: "20px" }}>
          {order?.orderItems.map((item) => {
            const optionsTotal = (item.options || []).reduce(
              (sum, opt) => sum + opt.priceAtTime,
              0,
            );
            const itemTotal = item.quantity * (item.unitPrice + optionsTotal);

            return (
              <div key={item.id} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                    <span
                      style={{
                        color: "#e74c3c",
                        fontWeight: 700,
                        minWidth: "30px",
                      }}
                    >
                      {item.quantity}x
                    </span>
                    <span style={{ fontWeight: 600, color: "#1f3b57" }}>
                      {item.menuItemName || "Item"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#1f3b57",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                    }}
                  >
                    {formatPrice(itemTotal)}
                  </span>
                </div>

                {item.options && item.options.length > 0 && (
                  <div
                    style={{
                      paddingLeft: "38px",
                      color: "#9ca3af",
                      fontSize: "12px",
                    }}
                  >
                    {item.options.map((opt) => (
                      <div key={opt.id}>+ {opt.optionName || "Option"}</div>
                    ))}
                  </div>
                )}

                {item.specialRequest && (
                  <div
                    style={{
                      paddingLeft: "38px",
                      color: "#9ca3af",
                      fontSize: "12px",
                      fontStyle: "italic",
                      marginTop: "4px",
                    }}
                  >
                    Note: {item.specialRequest}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            height: "1px",
            background:
              "repeating-linear-gradient(to right, #e5e7eb 0, #e5e7eb 4px, transparent 4px, transparent 8px)",
            margin: "20px 0",
          }}
        />

        {/* Totals */}
        <div style={{ fontSize: "14px", marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#667085" }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
          </div>
          {calculatedDiscountAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                color: "#10b981",
              }}
            >
              <span>Discount ({displayDiscountRate}%)</span>
              <span style={{ fontWeight: 600 }}>
                -{formatPrice(calculatedDiscountAmount)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span style={{ color: "#667085" }}>Tax (10%)</span>
            <span style={{ fontWeight: 600 }}>{formatPrice(tax)}</span>
          </div>
          <div
            style={{
              height: "1px",
              background: "#e5e7eb",
              margin: "12px 0",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "16px",
              fontWeight: 800,
              color: "#1f3b57",
            }}
          >
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#1f3b57",
              marginBottom: "12px",
            }}
          >
            Payment Method
          </div>

          {/* Stripe */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 16px",
              background: selectedMethod === "stripe" ? "#fff7ed" : "white",
              border:
                selectedMethod === "stripe"
                  ? "2px solid #e74c3c"
                  : "1px solid #e5e7eb",
              borderRadius: "12px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="method"
              value="stripe"
              checked={selectedMethod === "stripe"}
              onChange={() => setSelectedMethod("stripe")}
              style={{ marginRight: "12px", cursor: "pointer" }}
            />
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "10px",
                fontSize: "18px",
              }}
            >
              💳
            </div>
            <span style={{ fontWeight: 600 }}>Credit/Debit Card (Stripe)</span>
          </label>

          {/* Pay at Counter */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 16px",
              background: selectedMethod === "cash" ? "#fff7ed" : "white",
              border:
                selectedMethod === "cash"
                  ? "2px solid #e74c3c"
                  : "1px solid #e5e7eb",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="method"
              value="cash"
              checked={selectedMethod === "cash"}
              onChange={() => setSelectedMethod("cash")}
              style={{ marginRight: "12px", cursor: "pointer" }}
            />
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "#1f9254",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "10px",
                fontSize: "18px",
              }}
            >
              💵
            </div>
            <span style={{ fontWeight: 600 }}>Pay at Counter</span>
          </label>
        </div>

        {/* Add a Tip */}
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#1f3b57",
              marginBottom: "12px",
            }}
          >
            Add a Tip
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {["10", "15", "20", "custom"].map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setTipMode(mode as typeof tipMode);
                  if (mode !== "custom") setCustomTipInput("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: tipMode === mode ? "#e74c3c" : "white",
                  color: tipMode === mode ? "white" : "#1f3b57",
                  border: tipMode === mode ? "none" : "1px solid #e5e7eb",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {mode === "custom" ? "Custom" : `${mode}%`}
              </button>
            ))}
          </div>

          {tipMode === "custom" && (
            <input
              type="number"
              placeholder="Enter tip %"
              value={customTipInput}
              onChange={(e) => setCustomTipInput(e.target.value)}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            />
          )}

          <div
            style={{
              marginTop: "12px",
              fontSize: "14px",
              color: "#667085",
            }}
          >
            Tip amount:{" "}
            <span style={{ fontWeight: 700, color: "#1f3b57" }}>
              {formatPrice(tipAmount)}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "#ffebee",
              color: "#c62828",
              borderRadius: "10px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Pay Button - Inside MobileLayout but above bottom nav area */}
      <div
        style={{
          padding: "12px 16px 16px",
          background: "white",
          borderTop: "1px solid #e5e7eb",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {(() => {
          // Determine if Pay button should be disabled
          const isProcessing = isPayingCash || isPayingOnline;
          const isDisabled = isProcessing;

          return (
            <button
              onClick={handlePay}
              disabled={isDisabled}
              style={{
                width: "100%",
                maxWidth: "440px",
                padding: "14px 20px",
                background: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "16px",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              {isPayingCash || isPayingOnline
                ? "Processing..."
                : `Pay ${formatPrice(grandTotal)}`}
            </button>
          );
        })()}
      </div>
    </MobileLayout>
  );
}
