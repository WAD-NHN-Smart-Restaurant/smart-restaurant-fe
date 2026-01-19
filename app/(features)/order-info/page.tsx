import { Metadata } from "next";
import { OrderInfoContent } from "./_contents/content";
import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export const metadata: Metadata = {
  title: "Order Status | Smart Restaurant",
  description: "View your order status",
};

export default function OrderInfoPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <OrderInfoContent />
    </Suspense>
  );
}
