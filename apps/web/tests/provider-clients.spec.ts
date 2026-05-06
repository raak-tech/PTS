import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('provider clients page highlights the review queue and workload summary', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider/clients');
  await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible();
  await expect(page.getByText('1 client needs review', { exact: false })).toBeVisible();
  await expect(page.getByText('3 active clients', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open client summary' }).first()).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
