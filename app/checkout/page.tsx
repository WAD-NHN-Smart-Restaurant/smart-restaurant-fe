import { Metadata } from "next";
import { CheckoutContent } from "./_contents/content";
import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export const metadata: Metadata = {
  title: "Place Order | Smart Restaurant",
  description: "Complete your order",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}
