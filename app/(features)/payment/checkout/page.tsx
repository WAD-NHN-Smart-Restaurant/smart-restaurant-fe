import { Suspense } from "react";
import Content from "./content";

export default function PaymentCheckoutPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
