import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes RiftFix installable ("Add to Home screen").
 * Icons are generated from src/app/icon.svg by
 * scripts/generate-pwa-icons.mjs (`npm run icons`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RiftFix — League of Legends stats, One Fix, Honest Builds",
    short_name: "RiftFix",
    description:
      "Look up any League of Legends player: ranks, match history, a permanent Forever archive, your One Fix, and Honest Builds from real archived games.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B0E14",
    theme_color: "#0B0E14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
