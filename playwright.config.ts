import { defineConfig } from "@playwright/test";

/**
 * Smoke suite config. Expects a production build to exist (`npm run build`)
 * — the webServer block boots `next start` on port 3100 and reuses an
 * already-running server locally. Browsers are NOT auto-downloaded here;
 * CI should run `npx playwright install --with-deps chromium` first.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100",
  },
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
