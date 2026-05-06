import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('auth password forms expose helper guidance via aria-describedby', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/register');
  await expect(page.getByText(/use at least 8 characters/i)).toBeVisible();
  await expect(page.getByLabel('Password')).toHaveAttribute('aria-describedby', /register-password-help/);

  await page.goto('/reset-password?token=test-token');
  await expect(page.getByText(/use at least 8 characters/i)).toBeVisible();
  await expect(page.getByLabel('New password')).toHaveAttribute('aria-describedby', /reset-password-help/);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
