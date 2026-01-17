import { Metadata } from "next";
import { MenuItemDetailContent } from "./_contents/content";
import { Suspense, use } from "react";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export const metadata: Metadata = {
  title: "Menu Item Details | Smart Restaurant",
  description: "View menu item details and add to cart",
};

export default function MenuItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <MenuItemDetailContent itemId={id} />
    </Suspense>
  );
}
