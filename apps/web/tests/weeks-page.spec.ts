import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('weeks 2-6 page has a consistent scaffold and page title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/weeks');

  await expect(page).toHaveTitle('Weeks 2-6 | PTS');
  await expect(page.getByRole('heading', { name: /weeks 2\s*[-–]\s*6/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /how to use this/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /week 2/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /week 3/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /week 4/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /week 5/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /week 6/i })).toBeVisible();
  await expect(page.getByText(/not a diagnosis or a treatment plan/i)).toBeVisible();
  await expect(page.getByText(/placeholder/i)).toHaveCount(0);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
