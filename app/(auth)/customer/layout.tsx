import { AuthProvider } from "@/context/auth-context";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <main className="overflow-y-auto lg:pl-0 lg:pt-0">{children}</main>
    </AuthProvider>
  );
}
