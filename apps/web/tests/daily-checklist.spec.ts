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
