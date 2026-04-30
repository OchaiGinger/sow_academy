// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 1. Move configuration outside the function for performance
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  PRINCIPAL: "/teacher",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

const ROLE_PATHS: Record<string, string[]> = {
  ADMIN: ["/admin", "/teacher", "/principal", "/student"],
  PRINCIPAL: ["/teacher", "/principal"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student"],
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. PUBLIC ROUTE CHECK
  const publicRoutes = [
    "/login",
    "/setup",
    "/api/setup",
    "/api/auth",
    "/api/payments/webhook",
    "/logo.svg",
  ];

  const isPublic = publicRoutes.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // 3. SESSION CHECK
  const session = await auth.api.getSession({
    headers: new Headers(request.headers),
  });

  console.log("Middleware Path:", pathname, "Session Found:", !!session);
  // 4. AUTH REDIRECTS
  if (!session) {
    if (pathname === "/login") return NextResponse.next();

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/" && !pathname.includes(".")) {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 5. STANDARDIZE ROLE (Crucial: Enums are often Uppercase)
  const role = (session.user.role as string).toUpperCase();

  // 6. ROOT REDIRECT
  if (pathname === "/") {
    const home = ROLE_HOME[role] ?? "/login";
    return NextResponse.redirect(new URL(home, request.url));
  }

  // 7. PERMISSION CHECKS
  const requestedSection = `/${pathname.split("/")[1]}`;
  const restrictedSections = ["/admin", "/teacher", "/principal", "/student"];

  if (restrictedSections.includes(requestedSection)) {
    const allowedPaths = ROLE_PATHS[role] || [];

    if (!allowedPaths.includes(requestedSection)) {
      // If unauthorized, rewrite to 404
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matches all routes except static files, auth internals, and specific public assets
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|api/payments/webhook).*)",
  ],
};
