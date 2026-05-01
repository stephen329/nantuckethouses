import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware handles:
 * 1. Coming-soon gate — visitors must enter a password to access the site
 * 2. Subdomain routing — buy.nantuckethouses.com → /buy
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // --- Coming-soon gate ---
  const gateBypass =
    pathname === "/coming-soon" ||
    pathname.startsWith("/coming-soon/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    /\.(webp|png|jpg|jpeg|gif|svg|ico|woff2?|css|js|map)$/i.test(pathname);

  if (!gateBypass) {
    const hasAccess = request.cookies.get("site_access")?.value === "granted";
    if (!hasAccess) {
      return NextResponse.rewrite(new URL("/coming-soon", request.url));
    }
  }

  // --- Subdomain routing for paid-ad landing ---
  const isBuySubdomain =
    host.startsWith("buy.") || host === "buy.nantuckethouses.com";

  if (isBuySubdomain) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/buy", request.url));
    }
    if (pathname.startsWith("/buy")) {
      return NextResponse.next();
    }
    if (/\.(webp|png|jpg|jpeg|gif|svg|ico|woff2?|css|js)$/i.test(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.rewrite(new URL("/buy", request.url));
  }

  // Main domain: do not allow /buy path (subdomain-only landing)
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
     * Match all request paths except Next.js internals and static files.
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
