import { test, expect, type Locator, type Page } from "@playwright/test";

async function tabUntilFocused(page: Page, locator: Locator, maxTabs = 25) {
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Failed to focus locator within ${maxTabs} Tab presses`);
}

test("flare-up protocol page is usable with keyboard only (Tab + Enter)", async ({ page }) => {
  await page.goto("/flare-up");

  const backToPlan = page.getByRole("link", { name: /back to week 1 plan/i });
  await tabUntilFocused(page, backToPlan);
  await expect(backToPlan).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/plan/);

  const backToIntake = page.getByRole("link", { name: /back to intake/i });
  await tabUntilFocused(page, backToIntake);
  await expect(backToIntake).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /get a week 1 plan/i })).toBeVisible();
});
