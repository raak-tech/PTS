import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

test('consent-gated support storage can save, export, and delete client data', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);
  const email = uniqueEmail('support');
  const password = 'PilotTest123!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/');
  await page.getByLabel(/primary pain area/i).fill('Lower back');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill('Sleep better and walk more');
  await page.getByRole('button', { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/plan/);

  await page.goto('/support/export');
  await expect(page.getByText(/no saved support data yet/i)).toBeVisible();

  await page.goto('/');
  await page.getByLabel(/primary pain area/i).fill('Lower back');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill('Sleep better and walk more');
  await page.getByLabel(/save my support data on this account/i).check();
  await page.getByRole('button', { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/plan/);
  await expect(page.getByText(/saved to your support record/i)).toBeVisible();

  await page.goto('/support/export');
  await expect(page.getByRole('heading', { name: /support export/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /intake summary/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /week 1 plan/i })).toBeVisible();

  await page.goto('/daily');
  await page.getByLabel(/breathing \/ grounding/i).check();
  await page.getByLabel(/gentle movement/i).check();
  await page.getByLabel(/values-based action/i).check();
  await page.getByLabel(/reflection \(optional\)/i).fill('Felt steadier after a short walk.');
  await page.getByRole('button', { name: /save daily completion/i }).click();
  await expect(page.getByText(/daily completion saved/i)).toBeVisible();

  await page.goto('/check-in');
  await page.getByLabel(/what did you do most days this week/i).fill('I did the checklist most days.');
  await page.getByLabel(/what felt easier vs harder/i).fill('Walking felt easier; sitting still felt harder.');
  await page
    .getByLabel(/what is one small adjustment you will try next week/i)
    .fill('Keep the same pacing and repeat short walks.');
  await page.getByRole('button', { name: /save weekly check-in/i }).click();
  await expect(page.getByText(/weekly check-in saved/i)).toBeVisible();

  await page.goto('/support/export');
  await expect(page.getByText(/daily completion/i)).toBeVisible();
  await expect(page.getByText(/weekly check-in/i)).toBeVisible();

  await page.goto('/support');
  await page.getByRole('button', { name: /delete all stored data/i }).click();
  await expect(page.getByText(/all stored support data deleted/i)).toBeVisible();

  await page.goto('/support/export');
  await expect(page.getByText(/no saved support data yet/i)).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
