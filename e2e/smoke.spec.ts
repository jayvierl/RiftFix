import { expect, test } from "@playwright/test";

test("home loads with the live corpus ticker and search", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/RiftFix/);
  await expect(page.locator(".ticker-track")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /fix the one thing/i })
  ).toBeVisible();
});

test("champions index renders the full champion grid", async ({ page }) => {
  await page.goto("/champions");
  const links = page.locator('a[href^="/champions/"]');
  // 173 champions on the current patch; allow the count to grow.
  expect(await links.count()).toBeGreaterThanOrEqual(173);
});

test("status API returns the expected shape", async ({ request }) => {
  const res = await request.get("/api/status");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(typeof body.hasKey).toBe("boolean");
  expect(body.corpus).toBeTruthy();
  expect(typeof body.corpus.matches).toBe("number");
  expect(typeof body.corpus.players).toBe("number");
});
