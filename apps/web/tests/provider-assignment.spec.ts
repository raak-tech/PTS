import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('provider can generate an invite code and client can link with it', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider/assignments');
  const initialCode = await page.locator('[data-testid="invite-code"]').textContent();
  expect(initialCode?.trim()).toMatch(/^PTS-/);

  await page.getByRole('button', { name: 'Generate new invite code' }).click();
  const generatedCode = (await page.locator('[data-testid="invite-code"]').textContent())?.trim();
  expect(generatedCode).toMatch(/^PTS-/);

  await page.goto('/provider/join');
  await page.getByLabel('Invite code').fill(generatedCode!);
  await page.getByLabel('Client name').fill('Taylor Client');
  await page.getByRole('button', { name: 'Link to provider' }).click();
  await expect(page.getByRole('status')).toContainText('Linked Taylor Client to the provider.');

  await page.goto('/provider/assignments');
  await expect(page.getByText('Taylor Client', { exact: true })).toBeVisible();
  await expect(page.getByText('invite-generated')).toBeVisible();
  await expect(page.getByText('Linked Taylor Client with invite code', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Unlink' }).click();
  await expect(page.getByText('No clients linked yet.')).toBeVisible();
  await expect(page.getByText('unlinked', { exact: true })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});