import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

test('provider workflow, consent controls, export, delete, and revocation all work together', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);
  const email = uniqueEmail('support');
  const password = 'PilotTest123!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/provider');
  await expect(page.getByRole('heading', { name: 'Provider Console' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Linked client access' })).toBeVisible();

  await page.goto('/provider/clients/client-002');
  await expect(page.getByRole('heading', { name: 'B. Client' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weekly review panel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adjust' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Escalate' })).toBeVisible();

  await page.goto('/support');
  await expect(page.getByRole('heading', { level: 1, name: 'Support storage' })).toBeVisible();
  await expect(page.getByText('Provider access: off', { exact: false })).toBeVisible();
  await expect(page.getByText('Reflections/free-text: off', { exact: false })).toBeVisible();
  await expect(page.getByText('Red-flags notes: off', { exact: false })).toBeVisible();

  await page.getByLabel('Store provider-visible support records').check();
  await page.getByLabel('Store reflections and free-text notes').check();
  await page.getByLabel('Store red-flags notes').check();
  await expect(page.getByText('Provider access: on', { exact: false })).toBeVisible();
  await expect(page.getByText('Reflections/free-text: on', { exact: false })).toBeVisible();
  await expect(page.getByText('Red-flags notes: on', { exact: false })).toBeVisible();

  await page.goto('/');
  await page.getByLabel(/primary pain area/i).fill('Lower back');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill('Sleep better and walk more');
  await page.getByLabel(/save my support data on this account/i).check();
  await page.getByRole('button', { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/plan/);
  await expect(page.getByText(/saved to your support record/i)).toBeVisible();

  await page.goto('/support/export');
  await expect(page.getByRole('heading', { name: /support export/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /retention/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /intake summary/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /week 1 plan/i })).toBeVisible();
  const auditTrailSection = page.locator('section', { has: page.getByRole('heading', { name: /audit trail/i }) });
  await expect(auditTrailSection).toContainText('consent-updated');
  await expect(auditTrailSection).toContainText('artifact-saved');
  await expect(auditTrailSection).toContainText('export-viewed');

  await page.goto('/daily');
  await expect(page.getByText('Provider access: on', { exact: false })).toBeVisible();
  await expect(page.getByText('Reflections/free-text: on', { exact: false })).toBeVisible();
  await page.getByLabel(/breathing \/ grounding/i).check();
  await page.getByLabel(/gentle movement/i).check();
  await page.getByLabel(/values-based action/i).check();
  await page.getByLabel(/reflection \(optional\)/i).fill('Felt steadier after a short walk.');
  await page.getByRole('button', { name: /save daily completion/i }).click();
  await expect(page.getByText(/daily completion saved/i)).toBeVisible();

  await page.goto('/check-in');
  await page.getByLabel(/what did you do most days this week/i).fill('I did the checklist most days.');
  await page.getByLabel(/what felt easier vs harder/i).fill('Walking felt easier; sitting still felt harder.');
  await page.getByLabel(/what is one small adjustment you will try next week/i).fill('Keep the same pacing and repeat short walks.');
  await page.getByRole('button', { name: /save weekly check-in/i }).click();
  await expect(page.getByText(/weekly check-in saved/i)).toBeVisible();

  await page.goto('/support/export');

  await page.goto('/');
  await page.getByLabel(/primary pain area/i).fill('Knee pain');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill('Keep moving safely');
  await page.getByLabel(/i have possible red flag symptoms/i).check();
  await page.getByLabel(/save my support data on this account/i).check();
  await page.getByRole('button', { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/red-flags/);
  await expect(page.getByRole('heading', { name: /red flags/i })).toBeVisible();

  await page.goto('/support/export');
  await page.evaluate(async () => {
    const response = await fetch('/api/support/delete', { method: 'POST' });
    if (!response.ok) throw new Error(`delete failed: ${response.status}`);
  });
  await page.goto('/support/export');
  await expect(page.getByText(/no saved support data yet/i)).toBeVisible();
  await expect(page.getByText('delete-requested', { exact: false })).toBeVisible();

  await page.goto('/support');
  await page.getByRole('button', { name: /revoke all/i }).click();
  await expect(page.getByText(/consent revoked/i)).toBeVisible();
  await expect(page.getByText('Provider access: off', { exact: false })).toBeVisible();
  await expect(page.getByText('Reflections/free-text: off', { exact: false })).toBeVisible();
  await expect(page.getByText('Red-flags notes: off', { exact: false })).toBeVisible();

  await page.goto('/daily');
  await page.getByLabel(/breathing \/ grounding/i).check();
  await page.getByLabel(/reflection \(optional\)/i).fill('This should not save now.');
  await page.getByRole('button', { name: /save daily completion/i }).click();
  await expect(page.getByText(/enable provider access on support storage first/i)).toBeVisible();

  await page.goto('/check-in');
  await page.getByLabel(/what did you do most days this week/i).fill('After revoke, this should not save.');
  await page.getByLabel(/what felt easier vs harder/i).fill('Still no save.');
  await page.getByLabel(/what is one small adjustment you will try next week/i).fill('Still no save.');
  await page.getByRole('button', { name: /save weekly check-in/i }).click();
  await expect(page.getByText(/enable provider access on support storage first/i)).toBeVisible();

  await page.goto('/support/export');
  await expect(page.getByRole('heading', { name: /audit trail/i })).toBeVisible();

  await page.goto('/support/export');
  await expect(page.getByRole('heading', { name: /audit trail/i })).toBeVisible();

  const unexpectedErrors = errors.filter((entry) => !entry.includes('403 (Forbidden)'));
  expect(unexpectedErrors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
