import apiRequest from "@/libs/api-request";
import { ApiResponse } from "@/types/api-type";
import type { Order, CreateOrderRequest } from "@/types/order-type";

/**
 * Create new order or add items to existing order
 */
export async function createOrder(
  request: CreateOrderRequest,
): Promise<ApiResponse<Order>> {
  const response = await apiRequest.post<typeof request, ApiResponse<Order>>(
    "/orders/guest",
    request,
  );
  return response.data;
}

/**
 * Get current active order for guest's table
 */
export async function getCurrentOrder(): Promise<Order | null> {
  const response = await apiRequest.get<ApiResponse<Order>>("/orders/guest");
  return response.data.data;
}

/**
 * Request bill (change order status to payment_pending)
 */
export async function requestBill(): Promise<Order> {
  const response = await apiRequest.post<unknown, ApiResponse<Order>>(
    "/orders/guest/request-bill",
    {},
  );
  return response.data.data;
}

/**
 * Call waiter for current table
 */
export async function callWaiter(): Promise<{ message?: string }> {
  const response = await apiRequest.post<unknown, ApiResponse<void>>(
    "/orders/guest/call-waiter",
    {},
  );
  return { message: response.data.message };
}
