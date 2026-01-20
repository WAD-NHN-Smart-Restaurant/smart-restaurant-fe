import { Metadata } from "next";
import { OrderHistoryContent } from "./_contents/content";
import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export const metadata: Metadata = {
  title: "Order History | Smart Restaurant",
  description: "View your order history and reviews",
};

export default function OrderHistoryPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <OrderHistoryContent />
    </Suspense>
  );
}
