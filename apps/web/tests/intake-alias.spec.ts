import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('GET /intake redirects to the intake (home) page', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/intake');

  // The canonical intake URL is '/'. The alias should redirect there.
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle('Intake | PTS');
  await expect(page.getByRole('heading', { name: /get a week 1 plan/i })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
