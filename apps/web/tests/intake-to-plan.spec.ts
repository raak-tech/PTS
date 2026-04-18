import { test, expect } from '@playwright/test';

test('intake form submits and plan page renders required sections', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /get a week 1 plan/i })
  ).toBeVisible();

  await page.getByLabel(/primary pain area/i).fill('Lower back');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill(
    'Sleep better and return to short walks'
  );

  await page.getByRole('button', { name: /generate week 1 plan/i }).click();

  await expect(page).toHaveURL(/\/plan/);

  await expect(
    page.getByRole('heading', { name: /your week 1 plan/i })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /daily micro-practices/i })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /safety & boundaries/i })
  ).toBeVisible();

  // Guardrail copy: no outcome promises, clear safety boundaries.
  await expect(page.getByText(/not medical advice/i)).toBeVisible();
  await expect(page.getByText(/not for emergencies/i)).toBeVisible();
});
