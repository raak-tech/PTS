import { test, expect } from "@playwright/test";

test("daily checklist shows progress and reset returns progress to zero", async ({ page }) => {
  await page.goto("/daily");

  await expect(page.getByRole("heading", { name: /daily checklist/i })).toBeVisible();

  // New Sprint 1 UX: simple local-only progress indicator.
  await expect(page.getByText(/progress:\s*0\s*\/\s*3/i)).toBeVisible();

  await page.getByLabel(/2 minutes: breathing \/ grounding/i).check();
  await expect(page.getByText(/progress:\s*1\s*\/\s*3/i)).toBeVisible();

  await page.getByRole("button", { name: /reset checklist/i }).click();
  await expect(page.getByText(/progress:\s*0\s*\/\s*3/i)).toBeVisible();
});
