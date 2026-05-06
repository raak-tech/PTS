import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('provider client detail page shows the review panel and saves an artifact', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider/clients/client-002');

  await expect(page.getByRole('heading', { name: 'B. Client' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Intake summary' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Current plan' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weekly check-in snapshot' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Daily adherence snapshot' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Red-flags status' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weekly review panel' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adjust' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Escalate' })).toBeVisible();

  await page.getByRole('button', { name: 'Adjust' }).click();

  await expect(page.getByRole('status')).toContainText('Saved review artifact.');
  await expect(page.getByText('Status: adjusted', { exact: false })).toBeVisible();
  await expect(page.getByText('Plan changed: yes', { exact: false })).toBeVisible();
  await expect(page.getByText('Escalation: no', { exact: false })).toBeVisible();
  await expect(page.getByText('Reviewed at:', { exact: false })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
