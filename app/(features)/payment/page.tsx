import { Metadata } from "next";
import { PaymentContent } from "./_contents/content";
import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export const metadata: Metadata = {
  title: "Payment | Smart Restaurant",
  description: "Complete your payment",
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <PaymentContent />
    </Suspense>
  );
}
