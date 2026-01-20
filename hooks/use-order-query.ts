import { useSafeQuery } from "@/hooks/use-safe-query";
import { useSafeMutation } from "@/hooks/use-safe-mutation";
import { useQueryClient } from "@tanstack/react-query";
import {
  getCurrentOrder,
  createOrder,
  requestBill,
  callWaiter,
} from "@/api/order-api";
import type { Order, CreateOrderRequest } from "@/types/order-type";

// Query keys for order-related queries
const ORDER_QUERY_KEYS = {
  all: ["orders"] as const,
  active: () => [...ORDER_QUERY_KEYS.all, "active"] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.all, "detail", id] as const,
};

/**
 * Hook to fetch the current active order for the guest's table
 */
export const useActiveOrderQuery = () => {
  // Check if tableId exists in localStorage
  const hasTableId =
    typeof window !== "undefined" && !!localStorage.getItem("guest_table_id");

  return useSafeQuery(ORDER_QUERY_KEYS.active(), () => getCurrentOrder(), {
    staleTime: 30 * 1000, // 30 seconds - orders change frequently
    enabled: hasTableId, // Only fetch if tableId exists
    hideErrorSnackbar: true, // Handle errors manually in the component
  });
};

/**
 * Hook to create a new order or add items to existing order
 */
export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();

  return useSafeMutation(
    (request: CreateOrderRequest) => createOrder(request),
    {
      successMessage: "Order placed successfully!",
      errorMessage: "Failed to place order",
      onSuccess: () => {
        // Invalidate active order query to refetch
        queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.active() });
      },
    },
  );
};

/**
 * Hook to request bill (change order status to payment_pending)
 */
export const useRequestBillMutation = () => {
  const queryClient = useQueryClient();

  return useSafeMutation((orderId: string) => requestBill(orderId), {
    successMessage: "Bill requested. A staff member will assist you shortly.",
    errorMessage: "Failed to request bill",
    onSuccess: () => {
      // Invalidate the active order query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.active() });
    },
  });
};

/**
 * Hook to call waiter
 */
export const useCallWaiterMutation = () => {
  return useSafeMutation(() => callWaiter(), {
    successMessage: "Waiter notified. Please stay seated.",
    errorMessage: "Failed to call waiter",
  });
};
