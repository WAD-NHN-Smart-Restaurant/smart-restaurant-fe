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
