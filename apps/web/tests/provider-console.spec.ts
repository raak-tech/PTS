import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('provider console shell renders and navigates', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider');
  await expect(page.getByRole('heading', { name: 'Provider Console' })).toBeVisible();
  await expect(page.getByText('Mock-only provider shell for the pilot.')).toBeVisible();

  await page.getByRole('link', { name: 'Browse clients' }).click();
  await expect(page).toHaveURL(/\/provider\/clients$/);
  await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();

  await page.getByRole('link', { name: 'Open client summary' }).first().click();
  await expect(page).toHaveURL(/\/provider\/clients\/client-001$/);
  await expect(page.getByRole('heading', { name: 'A. Client' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weekly review panel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adjust' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Escalate' })).toBeVisible();

  await page.getByRole('link', { name: 'Clients', exact: true }).click();
  await expect(page).toHaveURL(/\/provider\/clients$/);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});