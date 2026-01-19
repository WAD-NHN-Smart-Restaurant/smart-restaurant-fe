import apiRequest from "@/libs/api-request";

export interface CreateOrderRequest {
  tableId?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialRequest?: string;
    options?: Array<{
      optionId: string;
      priceAtTime: number;
    }>;
  }>;
  guestName?: string;
  notes?: string;
}

export interface AddToOrderRequest {
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialRequest?: string;
    options?: Array<{
      optionId: string;
      priceAtTime: number;
    }>;
  }>;
}

type ControllerResponse<T = unknown> = {
  status: boolean;
  data: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number };
};

// ResponseInterceptor wraps controller response with success flag
type ApiResponse<T = unknown> = {
  success: boolean;
  data: ControllerResponse<T>;
};

/**
 * Create new order or add items to existing order
 */
export async function createOrder(
  request: CreateOrderRequest,
): Promise<ApiResponse> {
  const response = await apiRequest.post<typeof request, ApiResponse<unknown>>(
    "/orders/guest",
    request,
  );
  return response.data as ApiResponse;
}

/**
 * Get current active order for guest's table
 */
export async function getCurrentOrder(): Promise<ApiResponse> {
  const response = await apiRequest.get<ApiResponse>("/orders/guest");
  return response.data;
}

/**
 * Request bill (change order status to payment_pending)
 */
export async function requestBill(): Promise<ApiResponse> {
  const response = await apiRequest.post<unknown, ApiResponse>(
    "/orders/guest/request-bill",
    {},
  );
  return response.data;
}

/**
 * Cancel bill request (change order status back to served)
 */
export async function cancelBillRequest(): Promise<ApiResponse> {
  const response = await apiRequest.post<unknown, ApiResponse>(
    "/orders/guest/cancel-bill",
    {},
  );
  return response.data;
}

/**
 * Call waiter for current table
 */
export async function callWaiter(): Promise<ApiResponse> {
  const response = await apiRequest.post<unknown, ApiResponse>(
    "/orders/guest/call-waiter",
    {},
  );
  return response.data;
}
