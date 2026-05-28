import { test, expect } from "@playwright/test";
import { startConsoleErrorCollector } from "./helpers/console";

test("pilot routes (weeks, flare-up) expose full program navigation", async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  const pages = [
    { path: "/weeks", heading: /weeks 2\s*[-–]\s*6/i, currentText: /weeks 2\s*[-–]\s*6/i },
    { path: "/flare-up", heading: /flare-up protocol/i, currentText: /flare-up protocol/i },
  ];

  for (const p of pages) {
    await page.goto(p.path);
    await expect(page.getByRole("heading", { name: p.heading })).toBeVisible();

    const nav = page.getByRole("navigation", { name: /program navigation/i });
    await expect(nav).toBeVisible();

    await expect(nav.getByRole("link", { name: /daily checklist/i })).toHaveAttribute(
      "href",
      "/daily"
    );
    await expect(nav.getByRole("link", { name: /weekly check-in/i })).toHaveAttribute(
      "href",
      "/check-in"
    );
    await expect(nav.getByRole("link", { name: /week 1 plan/i })).toHaveAttribute(
      "href",
      "/plan"
    );
    await expect(nav.getByRole("link", { name: /weeks 2\s*[-–]\s*6/i })).toHaveAttribute(
      "href",
      "/weeks"
    );
    await expect(nav.getByRole("link", { name: /flare-up protocol/i })).toHaveAttribute(
      "href",
      "/flare-up"
    );
    await expect(nav.getByRole("link", { name: /red flags guidance/i })).toHaveAttribute(
      "href",
      "/red-flags"
    );
    await expect(nav.getByRole("link", { name: /back to intake/i })).toHaveAttribute(
      "href",
      "/"
    );

    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(p.currentText);
  }

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
});

test("sprint 1 slice pages expose page footer links", async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto("/plan");
  await expect(
    page.getByRole("contentinfo", { name: /page footer/i }).getByRole("link", { name: /back to intake/i })
  ).toBeVisible();

  await page.goto("/daily");
  const dailyFooter = page.getByRole("contentinfo", { name: /page footer/i });
  await expect(dailyFooter.getByRole("link", { name: /back to week 1 plan/i })).toBeVisible();
  await expect(dailyFooter.getByRole("link", { name: /back to intake/i })).toBeVisible();

  await page.goto("/check-in");
  await expect(
    page.getByRole("contentinfo", { name: /page footer/i }).getByRole("link", { name: /back to plan/i })
  ).toBeVisible();

  await page.goto("/red-flags");
  await expect(
    page.getByRole("contentinfo", { name: /page footer/i }).getByRole("link", { name: /back to intake/i })
  ).toBeVisible();

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
});
