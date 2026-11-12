import type { MetadataRoute } from "next";
import { db } from "@/lib/prisma";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const school = await db.school.findFirst({ select: { logoUrl: true } });
  const schoolBadge = school?.logoUrl ? "/app-icon" : "/logo.svg";

  return {
    id: "/",
    name: "SOWA Academy",
    short_name: "SOWA",
    description: "School results and academic management for SOWA Academy.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#050c0a",
    theme_color: "#050c0a",
    categories: ["education", "productivity"],
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
      { src: schoolBadge, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: schoolBadge, sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "Enter Scores", short_name: "Scores", url: "/teacher/scores", icons: [{ src: schoolBadge }] },
      { name: "Form Master Results", short_name: "Class Results", url: "/form-master/results", icons: [{ src: schoolBadge }] },
    ],
    screenshots: [],
  };
}
