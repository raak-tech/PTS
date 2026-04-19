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
