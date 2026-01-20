import apiRequest from "@/libs/api-request";

type ControllerResponse<T = unknown> = {
  status: boolean;
  data: T;
  message?: string;
};

type ApiResponse<T = unknown> = {
  success: boolean;
  data: ControllerResponse<T>;
};

export type InitiatePaymentResponse = {
  payment: {
    id: string;
    status: string;
    payment_method?: string | null;
    stripe_session_id?: string | null;
    checkout_url?: string | null;
    amount: number;
  };
  checkoutUrl?: string;
  stripeSessionId?: string;
  totalAmount: number;
  sandbox?: boolean;
};

export type PaymentStatusResponse = {
  id: string;
  status: string;
  discountRate: number;
  discountAmount: number;
  orderId?: string;
  amount?: number;
  paymentMethod?: string | null;
  stripeSessionId?: string | null;
  checkoutUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  currency?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function initiatePayment(
  method: "cash" | "stripe",
  returnUrl?: string,
  tipAmount: number = 0,
  discountAmount: number = 0,
): Promise<ApiResponse<InitiatePaymentResponse>> {
  const response = await apiRequest.post("/payments/guest", {
    method,
    returnUrl,
    tipAmount,
    discountAmount,
  });
  return response.data as ApiResponse<InitiatePaymentResponse>;
}

export async function confirmPayment(
  paymentId: string,
  status: "success" | "failed" = "success",
): Promise<ApiResponse> {
  const response = await apiRequest.post(
    `/payments/guest/${paymentId}/confirm`,
    {
      status,
    },
  );
  return response.data as ApiResponse;
}

/**
 * Get payment status by payment ID
 */
export async function getPaymentStatus(
  paymentId: string,
): Promise<ApiResponse<PaymentStatusResponse>> {
  const response = await apiRequest.get(`/payments/guest/${paymentId}`);
  return response.data as ApiResponse<PaymentStatusResponse>;
}

/**
 * Get payment by order ID
 */
export async function getPaymentByOrderId(
  orderId: string,
): Promise<ApiResponse<PaymentStatusResponse>> {
  const response = await apiRequest.get(`/payments/guest/order/${orderId}`);
  return response.data as ApiResponse<PaymentStatusResponse>;
}
