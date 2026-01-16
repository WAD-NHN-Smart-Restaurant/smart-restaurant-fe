import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = [
  "/login",
  "/login-google/callback",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/reset-password",
  "/callback",
  "/",
];

const PROTECTED_ROUTES = [
  "/menu",
  "/checkout",
  "/order-info",
  "/order-history",
];

const isMatchRoute = (routes: string[], pathname: string) =>
  routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api");
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public")
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1️⃣ Skip static files
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (isMatchRoute(PROTECTED_ROUTES, pathname)) {
    const guestToken = request.cookies.get("guest_menu_token");
    const testToken = process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN;

    // Development mode: Auto-inject test token for guest routes
    if (process.env.NODE_ENV === "development" && !guestToken && testToken) {
      const response = NextResponse.next();
      response.cookies.set({
        name: "guest_menu_token",
        value: testToken,
        httpOnly: false, // Allow JavaScript to read it
        secure: false, // Allow in development
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    }

    // Production mode: Redirect to login if accessing protected route without token
    if (process.env.NODE_ENV === "production" && !guestToken) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // BẮT BUỘC: sync + verify JWT
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // 🚫 Chỉ redirect khi:
  // - Không có user
  // - Route KHÔNG public
  if (!user && !isMatchRoute(PUBLIC_ROUTES, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
