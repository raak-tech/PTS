import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('plan and check-in pages offer a consistent "Back to intake" link', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/plan');
  await expect(page.getByRole('link', { name: /back to intake/i })).toBeVisible();

  await page.goto('/check-in');
  await expect(page.getByRole('link', { name: /back to intake/i })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('intake page offers a "Red flags guidance" link for safety context', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/');

  const redFlagsLink = page.getByRole('link', { name: /red flags guidance/i });
  await expect(redFlagsLink).toBeVisible();

  await redFlagsLink.click();

  await expect(page).toHaveURL(/\/red-flags/);
  await expect(page.getByRole('heading', { name: /red flags/i })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
