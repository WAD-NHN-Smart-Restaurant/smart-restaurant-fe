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
 * Request bill (change order status to payment_pending and create payment)
 */
export async function requestBill(orderId: string): Promise<ApiResponse> {
  const response = await apiRequest.post<unknown, ApiResponse>(
    "/orders/guest/request-bill",
    { orderId },
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

/**
 * Get customer order history (requires authentication)
 */
export async function getOrderHistory(
  page = 1,
  limit = 20,
): Promise<ApiResponse> {
  const response = await apiRequest.get<ApiResponse>(
    `/orders/customer/history?page=${page}&limit=${limit}`,
  );
  return response.data;
}

/**
 * Get order details with item processing statuses (requires authentication)
 */
export async function getOrderDetails(orderId: string): Promise<ApiResponse> {
  const response = await apiRequest.get<ApiResponse>(
    `/orders/customer/order-details/${orderId}`,
  );
  return response.data;
}

/**
 * Create a review for a menu item (requires authentication)
 */
export interface CreateReviewRequest {
  menuItemId: string;
  orderId: string;
  rating: number;
  comment?: string;
}

export async function createReview(
  request: CreateReviewRequest,
): Promise<ApiResponse> {
  const response = await apiRequest.post<
    CreateReviewRequest,
    ApiResponse<unknown>
  >("/orders/customer/reviews", request);
  return response.data as ApiResponse;
}

/**
 * Get customer's reviews (requires authentication)
 */
export async function getCustomerReviews(
  page = 1,
  limit = 20,
): Promise<ApiResponse> {
  const response = await apiRequest.get<ApiResponse>(
    `/orders/customer/reviews?page=${page}&limit=${limit}`,
  );
  return response.data;
}

/**
 * Get reviews for a menu item (public)
 */
export async function getMenuItemReviews(
  menuItemId: string,
  page = 1,
  limit = 10,
): Promise<ApiResponse> {
  const response = await apiRequest.get<ApiResponse>(
    `/orders/menu-items/${menuItemId}/reviews?page=${page}&limit=${limit}`,
  );
  return response.data;
}
