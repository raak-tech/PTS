import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('home page loads', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/');
  await expect(page).toHaveTitle(/PTS/i);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
