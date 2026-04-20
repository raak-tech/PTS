import { test, expect } from "@playwright/test";

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
