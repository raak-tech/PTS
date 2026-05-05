import { test, expect } from '@playwright/test';

test('user can navigate from plan page to daily checklist (local-only stub)', async ({ page }) => {
  // Start from intake and generate the static plan page
  await page.goto('/');
  await page.getByLabel(/primary pain area/i).fill('Lower back');
  await page
    .getByLabel(/primary goal for the next 2 weeks/i)
    .fill('Sleep better and return to short walks');

  await page.getByRole('button', { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/plan/);

  // From the plan page, user should be able to open a daily checklist stub.
  await page.getByRole('link', { name: /open daily checklist/i }).click();

  await expect(page).toHaveURL(/\/daily/);
  await expect(page.getByRole('heading', { name: /daily checklist/i })).toBeVisible();

  // Guardrails: local-only + no outcome promises.
  await expect(page.getByText(/local-only/i)).toBeVisible();
  await expect(page.getByText(/not medical advice/i)).toBeVisible();
});

test('user can reset daily checklist checkmarks (local-only)', async ({ page }) => {
  await page.goto('/daily');

  const grounding = page.getByLabel(/breathing \/ grounding/i);
  await expect(grounding).not.toBeChecked();

  await grounding.check();
  await expect(grounding).toBeChecked();

  await page.getByRole('button', { name: /reset checklist/i }).click();
  await expect(grounding).not.toBeChecked();
});

test('daily checklist includes an optional reflection note that is clearly marked as not saved', async ({ page }) => {
  await page.goto('/daily');

  const reflection = page.getByRole('textbox', { name: /reflection \(optional\)/i });
  await expect(reflection).toHaveAttribute('placeholder', /not saved/i);
});

test('daily checklist includes an optional reflection note that can be cleared with reset', async ({ page }) => {
  await page.goto('/daily');

  const reflection = page.getByRole('textbox', { name: /reflection \(optional\)/i });
  await reflection.fill('Felt more confident doing gentle movement.');
  await expect(reflection).toHaveValue(/more confident/i);

  await page.getByRole('button', { name: /reset checklist/i }).click();
  await expect(reflection).toHaveValue('');
});
