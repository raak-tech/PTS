import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('provider console dashboard shows assigned clients and review status', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider');
  await expect(page).toHaveTitle('Provider console | PTS');
  await expect(page.getByRole('heading', { name: 'Provider Console' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assigned clients' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Review status' })).toBeVisible();

  const bClientCard = page.locator('article', { has: page.getByRole('heading', { name: 'B. Client' }) });
  await expect(bClientCard).toContainText('Review status: Needs review');
  await expect(bClientCard).toContainText('Red-flags alert: Needs attention');

  const providerSnapshot = page.locator('section', { has: page.getByRole('heading', { name: 'Provider snapshot' }) });
  await expect(providerSnapshot).toContainText('Last check-in: Today');
  await expect(page.getByRole('link', { name: 'Open A. Client review' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open B. Client review' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open C. Client review' })).toBeVisible();

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

  await page.goto('/provider?empty=1');
  await expect(page.getByRole('heading', { name: 'Provider Console' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assigned clients' })).toBeVisible();
  await expect(page.getByText('No clients are currently assigned', { exact: false })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});