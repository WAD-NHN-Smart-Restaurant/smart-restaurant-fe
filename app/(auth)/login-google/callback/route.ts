import { NextResponse } from "next/server";
import { cookies } from "next/headers";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/libs/supabase/server";
import { PATHS } from "@/data/path";

export async function GET(request: Request) {
  console.log("Google OAuth callback route called");
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? `/${PATHS.MENU.INDEX}`;
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    // TODO: naviagate to order history page after login
    next = "/" + PATHS.MENU.INDEX;
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.session) {
      console.log("Successfully exchanged code for session");

      // Store the access token in cookies
      const accessToken = data.session.access_token;
      if (accessToken) {
        const cookieStore = await cookies();
        cookieStore.set("access_token", accessToken, {
          httpOnly: false, // Set to false so client-side can access it (matching your tokenManager)
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 60 * 60, // 1 hour (3600 seconds)
          path: "/",
        });
        console.log("Access token stored in cookies");
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
