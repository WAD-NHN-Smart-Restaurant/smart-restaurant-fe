import { Metadata } from "next";
import { GuestMenuPreviewContent } from "./_contents/content";
import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export const metadata: Metadata = {
  title: "Menu | Smart Restaurant",
  description: "Preview how your menu appears to guests",
};

export default function GuestMenuPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <GuestMenuPreviewContent />
    </Suspense>
  );
}
