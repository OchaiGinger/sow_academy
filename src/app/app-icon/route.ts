import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export async function GET(request: Request) {
  const school = await db.school.findFirst({ select: { logoUrl: true } });
  const logo = school?.logoUrl?.trim();
  if (!logo) {
    return NextResponse.redirect(new URL("/icons/sowa-app-icon.svg", request.url));
  }

  // Setup currently saves uploaded logos as data URLs. Serve those same bytes
  // through a stable same-origin URL for browser/PWA icon consumers.
  const dataUrlMatch = logo.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1].toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return NextResponse.redirect(new URL("/icons/sowa-app-icon.svg", request.url));
    }

    const bytes = Buffer.from(dataUrlMatch[2], "base64");
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_LOGO_BYTES) {
      return NextResponse.redirect(new URL("/icons/sowa-app-icon.svg", request.url));
    }

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Logos configured as externally hosted images are redirected only over HTTPS;
  // the server never fetches arbitrary URLs.
  try {
    const externalUrl = new URL(logo);
    if (externalUrl.protocol !== "https:" || externalUrl.username || externalUrl.password) {
      return new NextResponse("Invalid school badge URL", { status: 415 });
    }
    return NextResponse.redirect(externalUrl, {
      status: 307,
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return new NextResponse("Invalid school badge URL", { status: 415 });
  }
}
