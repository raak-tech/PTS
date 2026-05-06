import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('provider client detail page highlights review status and next action', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider/clients/client-002');
  await expect(page.getByRole('heading', { name: 'B. Client' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review status' })).toBeVisible();
  await expect(page.getByText('Status: Needs review').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weekly review panel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adjust' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Escalate' })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
