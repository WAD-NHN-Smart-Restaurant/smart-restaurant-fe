import { MenuItemReview } from "@/app/(features)/menu/[id]/_contents/content";
import apiRequest from "@/libs/api-request";
import type { ApiResponse, ApiPaginatedResponse } from "@/types/api-type";
import type { Order } from "@/types/order-type";

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

/**
 * Create new order or add items to existing order (Guest)
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
 * Create new order or add items to existing order (Authenticated Customer)
 */
export async function createOrderAsCustomer(
  request: CreateOrderRequest,
): Promise<ApiResponse<Order>> {
  const response = await apiRequest.post<typeof request, ApiResponse<Order>>(
    "/orders/customer",
    request,
  );
  return response.data;
}

/**
 * Get current active order for guest's table
 */
export async function getCurrentOrder(): Promise<Order> {
  const response = await apiRequest.get<ApiResponse<Order>>("/orders/guest");
  return response.data.data;
}

/**
 * Request bill (change order status to payment_pending and create payment)
 */
export async function requestBill(
  orderId: string,
): Promise<ApiResponse<Order>> {
  const response = await apiRequest.post<unknown, ApiResponse<Order>>(
    "/orders/guest/request-bill",
    { orderId },
  );
  return response.data;
}

/**
 * Cancel bill request (change order status back to served)
 */
export async function cancelBillRequest(): Promise<ApiResponse<Order>> {
  const response = await apiRequest.post<unknown, ApiResponse<Order>>(
    "/orders/guest/cancel-bill",
    {},
  );
  return response.data;
}

/**
 * Call waiter for current table
 */
export async function callWaiter(): Promise<ApiResponse<{ message: string }>> {
  const response = await apiRequest.post<
    unknown,
    ApiResponse<{ message: string }>
  >("/orders/guest/call-waiter", {});
  return response.data;
}

/**
 * Get customer order history (requires authentication)
 */
export async function getOrderHistory(
  page = 1,
  limit = 20,
): Promise<ApiPaginatedResponse<OrderHistoryDto>> {
  const response = await apiRequest.get<ApiPaginatedResponse<OrderHistoryDto>>(
    `/orders/customer/history?page=${page}&limit=${limit}`,
  );
  return response.data;
}

/**
 * Get order details with item processing statuses (requires authentication)
 */
export async function getOrderDetails(
  orderId: string,
): Promise<ApiResponse<OrderDetailResponse>> {
  const response = await apiRequest.get<ApiResponse<OrderDetailResponse>>(
    `/orders/customer/${orderId}`,
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

export interface Review {
  id: string;
  customerId: string;
  menuItemId: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Backend response types (with nested relations)
export interface OrderHistoryDto {
  id: string;
  tableNumber?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  completedAt?: string;
  guestName?: string;
  orderItemsCount: number;
}

export interface ReviewWithRelations extends Review {
  menuItems: {
    id: string;
    name: string;
    menuItemPhotos?: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
  orders: {
    id: string;
    createdAt: string;
  };
  updatedAt: string;
}

export interface OrderItemOptionDetail {
  id: string;
  priceAtTime: number;
  modifierOptions: {
    name: string;
  };
}

export interface OrderItemDetail {
  id: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  status: string;
  createdAt: string;
  menuItems: {
    id: string;
    name: string;
    description?: string;
    menuItemPhotos?: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
  orderItemOptions?: OrderItemOptionDetail[];
}

export interface OrderDetailResponse {
  id: string;
  status: string;
  totalAmount: number;
  guestName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tables?: {
    tableNumber: string;
  };
  orderItems: OrderItemDetail[];
}

export async function createReview(
  request: CreateReviewRequest,
): Promise<ApiResponse<Review>> {
  const response = await apiRequest.post<
    CreateReviewRequest,
    ApiResponse<Review>
  >("/orders/customer/reviews", request);
  return response.data;
}

/**
 * Get customer's reviews (requires authentication)
 */
export async function getCustomerReviews(
  page = 1,
  limit = 20,
): Promise<ApiPaginatedResponse<ReviewWithRelations>> {
  const response = await apiRequest.get<
    ApiPaginatedResponse<ReviewWithRelations>
  >(`/orders/customer/reviews?page=${page}&limit=${limit}`);
  return response.data;
}

/**
 * Get reviews for a menu item (public)
 */
export async function getMenuItemReviews(
  menuItemId: string,
  page = 1,
  limit = 10,
): Promise<ApiPaginatedResponse<MenuItemReview>> {
  const response = await apiRequest.get<ApiPaginatedResponse<MenuItemReview>>(
    `/orders/menu-items/${menuItemId}/reviews?page=${page}&limit=${limit}`,
  );
  return response.data;
}
