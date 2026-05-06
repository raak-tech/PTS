import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

test('provider assignment flow rejects invalid codes and reveals linked clients after success', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider/assignments');
  const inviteCode = (await page.locator('[data-testid="invite-code"]').textContent())?.trim();
  expect(inviteCode).toMatch(/^PTS-/);

  await page.goto('/provider/join');
  await page.getByLabel('Invite code').fill('PTS-INVALID');
  await page.getByLabel('Client name').fill('Taylor Client');
  await page.getByRole('button', { name: 'Link to provider' }).click();
  await expect(page.getByRole('status')).toContainText('not active yet');

  await page.goto('/provider');
  await expect(page.getByRole('heading', { name: 'Linked client access' })).toBeVisible();
  await expect(page.getByText('No clients linked yet.', { exact: false })).toBeVisible();

  await page.goto('/provider/assignments');
  await page.getByRole('button', { name: 'Generate new invite code' }).click();
  const generatedCode = (await page.locator('[data-testid="invite-code"]').textContent())?.trim();
  expect(generatedCode).toMatch(/^PTS-/);

  await page.goto('/provider/join');
  await page.getByLabel('Invite code').fill(generatedCode!);
  await page.getByLabel('Client name').fill('Taylor Client');
  await page.getByRole('button', { name: 'Link to provider' }).click();
  await expect(page.getByRole('status')).toContainText('Linked Taylor Client to the provider.');

  await page.goto('/provider');
  const linkedClientSection = page.locator('section', { has: page.getByRole('heading', { name: 'Linked client access' }) });
  await expect(linkedClientSection).toContainText('Taylor Client');
  await expect(linkedClientSection).toContainText('Linked by invite code');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
