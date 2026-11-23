import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry } from "serwist";
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

// The precache manifest is injected at build time as self.__SW_MANIFEST.
// This project's tsconfig doesn't include the WebWorker lib (it conflicts
// with the DOM lib used by the app), so the global is typed locally here
// instead of via `declare const self: ServiceWorkerGlobalScope`.
const precacheManifest = (
  self as unknown as {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
).__SW_MANIFEST;

/**
 * RiftFix service worker (built by @serwist/turbopack, served from
 * /serwist/sw.js). Strategy:
 * - Precache the app shell / static build assets (injected manifest).
 * - /api/* is NEVER cached (NetworkOnly): lookups, status and cards must
 *   always reflect the live archive, never a stale copy.
 * - League art (Data Dragon + CommunityDragon) is stale-while-revalidate:
 *   icons and splashes are effectively immutable per patch.
 * - Everything else falls to Serwist's default Next.js cache list, which
 *   network-firsts pages — so previously visited champion pages open
 *   offline, and document requests fall back to /~offline.
 */
const serwist = new Serwist({
  precacheEntries: precacheManifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, request }) =>
        (url.hostname === "ddragon.leagueoflegends.com" ||
          url.hostname === "raw.communitydragon.org") &&
        request.destination === "image",
      handler: new StaleWhileRevalidate({
        cacheName: "league-art",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 400,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
