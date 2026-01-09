// app/(protected)/layout.tsx
import { Navbar } from "@/components/navbar";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
