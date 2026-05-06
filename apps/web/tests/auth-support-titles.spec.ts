import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('auth and support pages set specific document titles', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/login');
  await expect(page).toHaveTitle('Sign in | PTS');

  await page.goto('/register');
  await expect(page).toHaveTitle('Create account | PTS');

  await page.goto('/forgot-password');
  await expect(page).toHaveTitle('Forgot password | PTS');

  await page.goto('/reset-password');
  await expect(page).toHaveTitle('Set a new password | PTS');

  await page.goto('/support');
  await expect(page).toHaveTitle('Support storage | PTS');

  await page.goto('/support/export');
  await expect(page).toHaveTitle('Support export | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
