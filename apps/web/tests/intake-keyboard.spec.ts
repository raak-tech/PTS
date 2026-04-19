import { test, expect, type Locator, type Page } from "@playwright/test";

async function tabUntilFocused(page: Page, locator: Locator, maxTabs = 40) {
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Failed to focus locator within ${maxTabs} Tab presses`);
}

test("intake is usable with keyboard only (Tab + Enter) and focuses first invalid field", async ({
  page,
}) => {
  await page.goto("/");

  const primaryPainArea = page.getByLabel(/primary pain area/i);
  const primaryGoal = page.getByLabel(/primary goal for the next 2 weeks/i);
  const submit = page.getByRole("button", { name: /generate week 1 plan/i });

  await tabUntilFocused(page, primaryPainArea);
  await expect(primaryPainArea).toBeFocused();

  await tabUntilFocused(page, primaryGoal);
  await expect(primaryGoal).toBeFocused();

  await tabUntilFocused(page, submit);
  await expect(submit).toBeFocused();

  await page.keyboard.press("Enter");

  await expect(page).toHaveURL("/");
  await expect(primaryPainArea).toBeFocused();
  await expect(page.getByText(/primary pain area is required/i)).toBeVisible();
});
