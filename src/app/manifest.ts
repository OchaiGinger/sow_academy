import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
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
      { src: "/icons/sowa-app-icon.svg", sizes: "any 192x192 512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/sowa-app-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Enter Scores", short_name: "Scores", url: "/teacher/scores", icons: [{ src: "/icons/sowa-app-icon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "Form Master Results", short_name: "Class Results", url: "/form-master/results", icons: [{ src: "/icons/sowa-app-icon.svg", sizes: "any", type: "image/svg+xml" }] },
    ],
  };
}
