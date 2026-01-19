import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/menu",
  "/checkout",
  "/order-info",
  "/order-history",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // TODO: Remove fallback env token for server-side in production
  const guestToken =
    request.cookies.get("guest_menu_token") ||
    process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN;

  // Development mode: Auto-inject test token for guest routes
  // if (
  //   process.env.NODE_ENV === "development" &&
  //   PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) &&
  //   !guestToken &&
  //   testToken
  // ) {
  //   const response = NextResponse.next();
  //   response.cookies.set({
  //     name: "guest_menu_token",
  //     value: testToken,
  //     httpOnly: false, // Allow JavaScript to read it
  //     secure: false, // Allow in development
  //     sameSite: "lax",
  //     maxAge: 60 * 60 * 24, // 24 hours
  //   });
  //   return response;
  // }

  // Production mode: Redirect to login if accessing protected route without token
  if (
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) &&
    !guestToken
  ) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
