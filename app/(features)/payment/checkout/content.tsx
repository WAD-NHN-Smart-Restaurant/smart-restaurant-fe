"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CreditCard, Check } from "lucide-react";
import { confirmPayment } from "@/api/payment-api";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { formatPrice } from "@/utils/format";

export default function Content() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const method = searchParams.get("method") || "";
  const paymentId = searchParams.get("paymentId") || "";
  const checkoutUrl = searchParams.get("checkoutUrl") || "";
  const stripeSessionId = searchParams.get("stripeSessionId") || "";
  const amount = Number(searchParams.get("amount") || "0");
  const status = searchParams.get("status") || "";

  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methodLabel = useMemo(() => {
    if (method === "stripe") return "Stripe";
    return "Online Payment";
  }, [method]);

  // Auto-handle success redirect from gateway (Stripe)
  useEffect(() => {
    const handleSuccess = async () => {
      if (status !== "success" || !paymentId) return;
      try {
        setIsConfirming(true);
        setError(null);
        await confirmPayment(paymentId, "success");
        router.replace(`/payment?paid=1&method=${method}`);
      } catch (err: unknown) {
        const message =
          (err as { message?: string })?.message || "Failed to confirm payment";
        setError(message);
        setIsConfirming(false);
      }
    };

    handleSuccess();
  }, [status, paymentId, router, method]);

  const handleConfirmManually = async () => {
    if (!paymentId) return;
    try {
      setIsConfirming(true);
      setError(null);
      await confirmPayment(paymentId, "success");
      router.replace(`/payment?paid=1&method=${method}`);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Failed to confirm payment";
      setError(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    router.replace("/payment");
  };

  return (
    <MobileLayout showBottomNav={false}>
      <MobileHeader
        title="Payment"
        tableNumber={undefined}
        onBack={handleCancel}
      />

      <div
        style={{
          padding: "20px 16px",
          maxWidth: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CreditCard size={48} color="#1f3b57" />
          </div>
          <div style={{ fontWeight: 800, fontSize: "18px", color: "#1f3b57" }}>
            {methodLabel} Payment
          </div>
          {amount > 0 && (
            <div style={{ color: "#667085", marginTop: "4px" }}>
              Amount: <strong>{formatPrice(amount)}</strong>
            </div>
          )}
          {stripeSessionId && (
            <div
              style={{ color: "#667085", marginTop: "4px", fontSize: "13px" }}
            >
              Session: {stripeSessionId}
            </div>
          )}
        </div>

        {checkoutUrl && (
          <div
            style={{
              marginBottom: "16px",
              textAlign: "center",
              background: "white",
              padding: "16px",
              borderRadius: "12px",
              border: "1px dashed #e5e7eb",
            }}
          >
            {checkoutUrl ? (
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  checkoutUrl,
                )}`}
                alt="Payment QR Code"
                width={220}
                height={220}
                style={{
                  borderRadius: "8px",
                  border: "2px solid #e5e7eb",
                  marginBottom: "12px",
                }}
              />
            ) : null}

            {checkoutUrl && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "12px 16px",
                  background: "#0f73ff",
                  color: "white",
                  textAlign: "center",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                Open Payment Link ↗
              </a>
            )}
          </div>
        )}

        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "12px",
            color: "#0c4a6e",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          After you finish paying, click &quot;I have paid&quot; to confirm.
        </div>

        {error && (
          <div
            style={{
              marginBottom: "12px",
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

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleConfirmManually}
            disabled={isConfirming || !paymentId}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: isConfirming ? "#d1d5db" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "16px",
              cursor: isConfirming ? "not-allowed" : "pointer",
              opacity: isConfirming ? 0.8 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isConfirming ? (
              "Confirming..."
            ) : (
              <>
                <Check size={20} /> I have paid
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: "white",
              color: "#1f3b57",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Back to Payment
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
