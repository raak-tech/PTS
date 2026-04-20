import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('weeks 2-6 placeholder page exists and shows conservative static guidance', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/weeks');

  await expect(page.getByRole('heading', { name: /weeks 2\s*[-–]\s*6/i })).toBeVisible();
  await expect(
    page.getByText(/static in sprint 1/i)
  ).toBeVisible();

  for (const week of [2, 3, 4, 5, 6]) {
    await expect(page.getByRole('heading', { name: new RegExp(`week ${week}`, 'i') })).toBeVisible();
  }

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
