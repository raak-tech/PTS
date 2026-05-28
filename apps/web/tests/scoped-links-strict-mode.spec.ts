import { test, expect } from "@playwright/test";

import { sectionByHeading } from "./helpers/scoped-locators";

test("weekly check-in link on plan is unique and reachable from Next step", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByRole("heading", { name: /your week 1 plan/i })).toBeVisible();

  await expect(page.getByRole("link", { name: /weekly check-in/i })).toHaveCount(1);

  const nextStep = sectionByHeading(page, /next step/i);
  await nextStep.getByRole("link", { name: /open weekly check-in/i }).click();

  await expect(page).toHaveURL(/\/check-in/);
});
