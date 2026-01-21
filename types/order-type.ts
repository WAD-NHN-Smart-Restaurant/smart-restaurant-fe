// Order Types - Based on backend DTOs
// Backend returns all fields in camelCase via ResponseInterceptor

export interface OrderItemOption {
  id: string;
  orderItemId: string;
  modifierOptionId: string;
  modifierOptionName: string; // Changed from optionName to match backend DTO
  priceAtTime: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  specialRequest?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderItemOptions?: OrderItemOption[];
}

export interface Order {
  id: string;
  tableId: string;
  restaurantId: string;
  status: string;
  guestName?: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}

// API Request types
export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  specialRequest?: string;
  options?: Array<{
    optionId: string;
    priceAtTime: number;
  }>;
}

export interface CreateOrderRequest {
  tableId?: string;
  items: CreateOrderItemRequest[];
  guestName?: string;
  notes?: string;
}

export interface AddToOrderRequest {
  items: CreateOrderItemRequest[];
}
