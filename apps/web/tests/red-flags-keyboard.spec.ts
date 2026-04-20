import { test, expect, type Locator, type Page } from "@playwright/test";

async function tabUntilFocused(page: Page, locator: Locator, maxTabs = 60) {
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Failed to focus locator within ${maxTabs} Tab presses`);
}

test("red-flags routing is usable with keyboard only (Tab + Space + Enter)", async ({ page }) => {
  await page.goto("/");

  const primaryPainArea = page.getByLabel(/primary pain area/i);
  const primaryGoal = page.getByLabel(/primary goal for the next 2 weeks/i);
  const redFlags = page.getByLabel(/i have (possible )?red flag symptoms/i);
  const submit = page.getByRole("button", { name: /generate week 1 plan/i });

  await tabUntilFocused(page, primaryPainArea);
  await expect(primaryPainArea).toBeFocused();
  await page.keyboard.type("Lower back");

  await tabUntilFocused(page, primaryGoal);
  await expect(primaryGoal).toBeFocused();
  await page.keyboard.type("Sleep better");

  await tabUntilFocused(page, redFlags);
  await expect(redFlags).toBeFocused();
  await page.keyboard.press("Space");
  await expect(redFlags).toBeChecked();

  await tabUntilFocused(page, submit);
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/red-flags/);
  await expect(page.getByRole("heading", { name: /red flags/i })).toBeVisible();

  const backToIntake = page.getByRole("link", { name: /back to intake/i });
  await tabUntilFocused(page, backToIntake);
  await expect(backToIntake).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /get a week 1 plan/i })).toBeVisible();
});
