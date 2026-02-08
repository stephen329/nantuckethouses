import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Subdomain routing for paid-ad landing:
 * - buy.nantuckethouses.com → serve /buy (rewrite so URL stays buy.nantuckethouses.com)
 * - nantuckethouses.com/buy → redirect to home (landing is subdomain-only)
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  const isBuySubdomain =
    host.startsWith("buy.") || host === "buy.nantuckethouses.com";

  if (isBuySubdomain) {
    // Serve the buy landing at root of subdomain (rewrite to /buy)
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/buy", request.url));
    }
    if (pathname.startsWith("/buy")) {
      // Already on buy subdomain; allow /buy and /buy/* (e.g. API calls in same origin)
      return NextResponse.next();
    }
    // Any other path on buy subdomain (e.g. /something) → show buy content at root
    return NextResponse.rewrite(new URL("/buy", request.url));
  }

  // Main domain: do not allow /buy path (subdomain-only landing)
  // Exception: localhost so you can preview the buy page locally
  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (
    !isLocalhost &&
    (pathname === "/buy" || pathname.startsWith("/buy/"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except static files and api routes.
     * buy subdomain is handled above; /buy on main domain redirected.
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
