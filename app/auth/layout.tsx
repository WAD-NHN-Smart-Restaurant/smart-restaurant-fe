export default function AuthFlowLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No AuthProvider wrapper - these pages handle their own Supabase sessions
  return <>{children}</>;
}
