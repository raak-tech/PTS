import { test, expect } from "@playwright/test";

import { programNav, sectionByHeading } from "./helpers/scoped-locators";

test("scoped locators avoid strict-mode issues when link text is duplicated", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByRole("heading", { name: /your week 1 plan/i })).toBeVisible();

  // Demonstrate underlying risk: regex matches both nav + main content.
  await expect(page.getByRole("link", { name: /weekly check-in/i })).toHaveCount(2);

  // Scope to the navigation landmark.
  await programNav(page)
    .getByRole("link", { name: /weekly check-in/i })
    .click();
  await expect(page).toHaveURL(/\/check-in/);

  // Back to plan and scope to main content section.
  await page.goto("/plan");
  const nextStep = sectionByHeading(page, /next step/i);
  await nextStep
    .getByRole("link", { name: /open weekly check-in/i })
    .click();

  await expect(page).toHaveURL(/\/check-in/);
});
