import { test, expect } from '@playwright/test';

test('intake routes to red-flags guidance when user indicates red-flag symptoms', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel(/primary pain area/i).fill('Lower back');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill('Sleep better');

  // Red flags are a safety boundary: we should route to guidance instead of generating a plan.
  await page.getByLabel(/i have (possible )?red flag symptoms/i).check();

  await page.getByRole('button', { name: /generate week 1 plan/i }).click();

  await expect(page).toHaveURL(/\/red-flags/);
  await expect(page.getByRole('heading', { name: /red flags/i })).toBeVisible();

  // Guardrail copy: no emergency handling in-product.
  await expect(page.getByText(/not for emergencies/i)).toHaveCount(1);
});

test('plan page safety section links to red-flags guidance', async ({ page }) => {
  await page.goto('/plan');

  const heading = page.getByRole('heading', { name: /safety & boundaries/i });
  const guardrailsSection = page.locator('section', { has: heading });

  await guardrailsSection.getByRole('link', { name: /red flags guidance/i }).click();

  await expect(page).toHaveURL(/\/red-flags/);
  await expect(page.getByRole('heading', { name: /red flags/i })).toBeVisible();
});
