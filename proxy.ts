import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const GUEST_TOKEN_COOKIE = "guest_menu_token";

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

const GUEST_ROUTES = ["/menu", "/checkout", "/order-info"];

function isMatchRoute(routes: string[], pathname: string) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // TODO: Remove fallback env token for server-side in production
  // const guestToken =
  //   request.cookies.get(GUEST_TOKEN_COOKIE) ||
  //   process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN;
  // console.log("Guest Token in Middleware:", guestToken);
  //const testToken = process.env.NEXT_PUBLIC_TEST_TABLE_TOKEN;

  if (
    isMatchRoute(PUBLIC_ROUTES, pathname) ||
    isMatchRoute(GUEST_ROUTES, pathname)
  ) {
    return NextResponse.next();
  }

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
  if (!isMatchRoute(PUBLIC_ROUTES, pathname)) {
    const allCookie = request.cookies.getAll();
    const guestTokenCookie = allCookie.find(
      (cookie) => cookie.name === GUEST_TOKEN_COOKIE,
    );
    const guestToken = guestTokenCookie?.value;
    if (!guestToken) {
      const loginUrl = new URL("/login", request.url);
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
  if (!user && !isMatchRoute(GUEST_ROUTES, pathname)) {
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
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
