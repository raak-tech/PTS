import { test, expect } from "@playwright/test";
import { startConsoleErrorCollector } from "./helpers/console";

test("plan page footer includes Back to intake", async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto("/plan");
  const footer = page.getByRole("contentinfo", { name: /page footer/i });
  await expect(footer.getByRole("link", { name: /back to intake/i })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
});

test("check-in page footer includes Back to plan", async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto("/check-in");
  const footer = page.getByRole("contentinfo", { name: /page footer/i });
  await expect(footer.getByRole("link", { name: /back to plan/i })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
});

test("plan guardrails link reaches red-flags guidance", async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto("/plan");

  const heading = page.getByRole("heading", { name: /safety & boundaries/i });
  const guardrailsSection = page.locator("section", { has: heading });

  await guardrailsSection.getByRole("link", { name: /red flags guidance/i }).click();

  await expect(page).toHaveURL(/\/red-flags/);
  await expect(page.getByRole("heading", { name: /red flags/i })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
});
