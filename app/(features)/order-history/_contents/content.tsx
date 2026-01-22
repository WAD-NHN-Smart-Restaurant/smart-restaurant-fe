"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getOrderHistory,
  getOrderDetails,
  createReview,
  getCustomerReviews,
  type OrderHistoryDto,
  type ReviewWithRelations,
  type OrderDetailResponse,
} from "@/api/order-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MobileLayout } from "@/components/mobile-layout";
import { MobileHeader } from "@/components/mobile-header";
import { BottomNav } from "@/components/bottom-nav";
import { formatPrice } from "@/utils/format";
import { useAuth } from "@/context/auth-context";
import {
  ChevronRight,
  Calendar,
  ShoppingBag,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";

interface OrderHistoryItem {
  id: string;
  tableNumber?: string;
  status: string;
  totalAmount: number;
  guestName?: string;
  createdAt: string;
  completedAt?: string;
  orderItemsCount: number;
  orderItems?: OrderDetailItem[];
}

interface OrderDetailItem {
  id: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  status: string;
  menuItems: {
    id: string;
    name: string;
    description?: string;
    menuItemPhotos?: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  };
  orderItemOptions?: Array<{
    id: string;
    priceAtTime: number;
    modifierOptions: {
      name: string;
    };
  }>;
}

interface OrderDetail {
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
  orderItems: OrderDetailItem[];
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
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
}

export function OrderHistoryContent() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<OrderHistoryDto[]>([]);
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<OrderDetailResponse | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    menuItemId: "",
    menuItemName: "",
    orderId: "",
    rating: 5,
    comment: "",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login?redirect=/order-history");
    }
  }, [user, isAuthLoading, router]);

  // Fetch order history
  useEffect(() => {
    if (user && activeTab === "orders") {
      fetchOrderHistory();
    }
  }, [user, activeTab]);

  // Fetch reviews
  useEffect(() => {
    if (user && activeTab === "reviews") {
      fetchReviews();
    }
  }, [user, activeTab]);

  const fetchOrderHistory = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await getOrderHistory(1, 50);
      if (response.success && response.data) {
        setOrders(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch order history:", error);
      toast.error("Failed to load order history");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const response = await getCustomerReviews(1, 50);
      if (response.success && response.data) {
        setReviews(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      const response = await getOrderDetails(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
        setIsDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      toast.error("Failed to load order details");
    }
  };

  const handleOpenReviewDialog = (
    menuItemId: string,
    menuItemName: string,
    orderId: string,
  ) => {
    setReviewForm({
      menuItemId,
      menuItemName,
      orderId,
      rating: 5,
      comment: "",
    });
    setIsReviewDialogOpen(true);
    setIsDetailDialogOpen(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error("Please select a rating between 1 and 5");
      return;
    }

    try {
      setIsSubmittingReview(true);
      const response = await createReview({
        menuItemId: reviewForm.menuItemId,
        orderId: reviewForm.orderId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      if (response.success && response.data) {
        toast.success("Review submitted successfully!");
        setIsReviewDialogOpen(false);
        setReviewForm({
          menuItemId: "",
          menuItemName: "",
          orderId: "",
          rating: 5,
          comment: "",
        });
        // Refresh reviews if on reviews tab
        if (activeTab === "reviews") {
          fetchReviews();
        }
      }
    } catch (error: unknown) {
      console.error("Failed to submit review:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to submit review. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-500",
      cancelled: "bg-red-500",
      pending: "bg-yellow-500",
      preparing: "bg-blue-500",
      ready: "bg-purple-500",
      served: "bg-teal-500",
    };
    return statusColors[status] || "bg-gray-500";
  };

  const getItemStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "text-yellow-600 bg-yellow-50",
      accepted: "text-blue-600 bg-blue-50",
      rejected: "text-red-600 bg-red-50",
      preparing: "text-orange-600 bg-orange-50",
      ready: "text-purple-600 bg-purple-50",
      served: "text-green-600 bg-green-50",
    };
    return statusColors[status] || "text-gray-600 bg-gray-50";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onChange?: (rating: number) => void,
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <MobileLayout>
      <MobileHeader onBack={() => router.back()} title="My Orders & Reviews" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Order History
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              My Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {isLoadingOrders ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No orders yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Your completed orders will appear here
                </p>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`${getStatusColor(order.status)} text-white`}
                        >
                          {order.status}
                        </Badge>
                        {order.tableNumber && (
                          <span className="text-sm text-gray-600">
                            Table {order.tableNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    {order.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrderDetails(order.id)}
                        className="ml-2"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm text-gray-600">
                      {order.orderItemsCount} item
                      {order.orderItemsCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {isLoadingReviews ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : reviews.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No reviews yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Review items from your completed orders
                </p>
              </Card>
            ) : (
              reviews.map((review) => {
                const primaryPhoto = review.menuItems.menuItemPhotos?.find(
                  (p) => p.isPrimary,
                );
                const photoUrl =
                  primaryPhoto?.url ||
                  review.menuItems.menuItemPhotos?.[0]?.url;

                return (
                  <Card key={review.id} className="p-4">
                    <div className="flex gap-4">
                      {photoUrl && (
                        <Image
                          src={photoUrl}
                          alt={review.menuItems.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {review.menuItems.name}
                        </h3>
                        {renderStars(review.rating)}
                        {review.comment && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {review.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <>
                  Order #{selectedOrder.id.slice(0, 8)} •{" "}
                  {formatDate(selectedOrder.createdAt)}
                  {selectedOrder.tables && (
                    <> • Table {selectedOrder.tables.tableNumber}</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 mt-4">
              {selectedOrder.orderItems.map((item) => {
                const primaryPhoto = item.menuItems.menuItemPhotos?.find(
                  (p) => p.isPrimary,
                );
                const photoUrl =
                  primaryPhoto?.url || item.menuItems.menuItemPhotos?.[0]?.url;
                const itemTotal =
                  item.unitPrice * item.quantity +
                  (item.orderItemOptions?.reduce(
                    (sum, opt) => sum + opt.priceAtTime,
                    0,
                  ) || 0) *
                    item.quantity;

                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      {photoUrl && (
                        <Image
                          src={photoUrl}
                          alt={item.menuItems.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {item.menuItems.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <Badge className={getItemStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>

                        {item.orderItemOptions &&
                          item.orderItemOptions.length > 0 && (
                            <div className="text-sm text-gray-600 mb-2">
                              {item.orderItemOptions.map((opt) => (
                                <div key={opt.id}>
                                  + {opt.modifierOptions.name} (+
                                  {formatPrice(opt.priceAtTime)})
                                </div>
                              ))}
                            </div>
                          )}

                        {item.notes && (
                          <p className="text-sm text-gray-600 italic mb-2">
                            Note: {item.notes}
                          </p>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-semibold">
                            {formatPrice(itemTotal)}
                          </span>
                          {selectedOrder.status === "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleOpenReviewDialog(
                                  item.menuItems.id,
                                  item.menuItems.name,
                                  selectedOrder.id,
                                )
                              }
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">
                    {formatPrice(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {reviewForm.menuItemName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Rating *</Label>
              <div className="mt-2">
                {renderStars(reviewForm.rating, true, (rating) =>
                  setReviewForm({ ...reviewForm, rating }),
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Your Review (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Tell us what you think about this dish..."
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, comment: e.target.value })
                }
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </MobileLayout>
  );
}
