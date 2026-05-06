import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

test('support and reset pages explain storage and local outbox behavior', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);
  const email = uniqueEmail('support-copy');
  const password = 'PilotCopy123!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/support');
  await expect(page.getByRole('heading', { name: 'Encrypted reflections' })).toBeVisible();
  await expect(page.getByText(/encrypted in the browser/i)).toBeVisible();

  await page.goto('/support/export');
  await expect(page.getByText(/ciphertext-only here/i)).toBeVisible();

  await page.goto('/forgot-password');
  await expect(page.getByText(/local outbox/i)).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
