import type { NextConfig } from "next";

/**
 * Baseline security headers for every response.
 *
 * CSP is deliberately pragmatic so the site keeps working: Next injects
 * inline bootstrap scripts and Tailwind emits inline styles, hence
 * 'unsafe-inline' for script/style; images come from 'self' and Data
 * Dragon (champion/item/profile icons and splashes). Everything else is
 * locked to 'self', framing is denied (also via X-Frame-Options), and
 * frame-ancestors 'none' mirrors that for modern browsers. Splash art
 * and rank emblems also load from the CommunityDragon raw CDN
 * (raw.communitydragon.org) — always with a Data Dragon fallback.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://ddragon.leagueoflegends.com https://raw.communitydragon.org",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ddragon.leagueoflegends.com" },
      { protocol: "https", hostname: "raw.communitydragon.org" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
