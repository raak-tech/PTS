import { test, expect } from "@playwright/test";

test("daily checklist can be completed using keyboard only (tab + space + enter)", async ({ page }) => {
  await page.goto("/daily");

  const reset = page.getByRole("button", { name: /reset checklist/i });
  const grounding = page.getByLabel(/2 minutes: breathing \/ grounding/i);
  const movement = page.getByLabel(/5 minutes: gentle movement/i);

  // Tab order: Reset -> first checkbox -> second checkbox ...
  await page.keyboard.press("Tab");
  await expect(reset).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(grounding).toBeFocused();
  await page.keyboard.press("Space");
  await expect(grounding).toBeChecked();
  await expect(page.getByText(/progress:\s*1\s*\/\s*3/i)).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(movement).toBeFocused();
  await page.keyboard.press("Space");
  await expect(movement).toBeChecked();
  await expect(page.getByText(/progress:\s*2\s*\/\s*3/i)).toBeVisible();

  // Shift+Tab back to Reset and activate with Enter.
  await page.keyboard.press("Shift+Tab");
  await expect(grounding).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(reset).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(grounding).not.toBeChecked();
  await expect(movement).not.toBeChecked();
  await expect(page.getByText(/progress:\s*0\s*\/\s*3/i)).toBeVisible();
});
