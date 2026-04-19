import { test, expect } from '@playwright/test';

test('user can navigate from plan page to flare-up protocol (local-only stub)', async ({ page }) => {
  await page.goto('/plan');

  await page.getByRole('link', { name: /open flare-up protocol/i }).click();

  await expect(page).toHaveURL(/\/flare-up/);

  await expect(page.getByRole('heading', { name: /flare-up protocol/i })).toBeVisible();
  await expect(page.getByText(/local-only/i)).toBeVisible();

  // Shared guardrails must be present.
  await expect(page.getByRole('heading', { name: /safety & boundaries/i })).toBeVisible();
});
