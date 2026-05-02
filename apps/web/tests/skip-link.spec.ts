import { test, expect, type Locator, type Page } from "@playwright/test";

async function tabUntilFocused(page: Page, locator: Locator, maxTabs = 25) {
  for (let i = 0; i < maxTabs; i += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Failed to focus locator within ${maxTabs} Tab presses`);
}

test("layout includes a skip-to-content link and main landmark", async ({ page }) => {
  await page.goto("/plan");

  const skip = page.getByRole("link", { name: /skip to content/i });
  await expect(skip).toBeAttached();

  // First Tab should land on the skip link (a11y keyboard nav).
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  // Activating it should jump the location hash to the main content anchor.
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);

  const main = page.locator("#main-content");

  // The main content target exists.
  await expect(main).toBeVisible();

  // A11y: focus should move to main content so screen readers/keyboard users
  // are actually placed at the start of the page content.
  await expect(main).toBeFocused();

});

test("skip-to-content works after client-side navigation", async ({ page }) => {
  await page.goto("/plan");

  // Use a Next <Link> click to ensure client-side navigation.
  const toDaily = page.getByRole("link", { name: /open daily checklist/i });
  await toDaily.click();
  await expect(page).toHaveURL(/\/daily$/);
  await expect(page.getByRole("heading", { name: /daily checklist/i })).toBeVisible();

  // Make Tab traversal deterministic.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  const skip = page.getByRole("link", { name: /skip to content/i });
  await tabUntilFocused(page, skip, 20);
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/daily#main-content$/);

  // Use the id selector to avoid strict-mode ambiguity if nested mains exist.
  const main = page.locator("main#main-content");
  await expect(main).toBeVisible();
  await expect(main).toBeFocused();
});
