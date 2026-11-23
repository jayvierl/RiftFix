import { createSerwistRoute } from "@serwist/turbopack";

/**
 * Serves the service worker at /serwist/sw.js (plus its runtime chunks).
 * This is the Turbopack-native Serwist integration — @serwist/next and
 * other webpack-based PWA plugins silently no-op under Next 16's default
 * Turbopack builds. The offline fallback page is precached explicitly.
 */
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/~offline", revision: crypto.randomUUID() },
    ],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
