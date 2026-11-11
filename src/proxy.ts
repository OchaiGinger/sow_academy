// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 1. Move configuration outside the function for performance
const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/admin",
  PRINCIPAL: "/teacher",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

const ROLE_PATHS: Record<string, string[]> = {
  SUPER_ADMIN: ["/super-admin", "/admin", "/setup"],
  ADMIN: ["/admin", "/teacher", "/principal", "/student"],
  PRINCIPAL: ["/teacher", "/principal"],
  TEACHER: ["/teacher"],
  STUDENT: ["/student"],
};

// Simple retry function for database operations
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 100): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. PUBLIC ROUTE CHECK
  const publicRoutes = [
    "/login",
    "/api/setup",
    "/api/auth",
    "/api/payments/webhook",
    "/api/uploadthing",
    "/api/health",
    "/logo.svg",
  ];

  const isPublic = publicRoutes.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // 3. SESSION CHECK - with retry for DB connection issues
  let session = null;
  try {
    session = await withRetry(() => auth.api.getSession({
      headers: new Headers(request.headers),
    }));
  } catch (error) {
    console.error("Middleware session error after retries:", error);
    // If DB connection fails after retries, redirect to login for protected routes
    if (!pathname.startsWith("/api/")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // For API routes, let them handle the error themselves
    return NextResponse.next();
  }

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

  // 4b. SETUP PROTECTION — only SUPER_ADMIN can access /setup
  if (pathname.startsWith("/setup")) {
    const role = (session.user.role as string).toUpperCase();
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
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
  matcher: [
    "/((?!api/auth|api/uploadthing|_next/static|_next/image|favicon.ico|.*\\..*|api/payments/webhook|api/health).*)",
  ],
};
