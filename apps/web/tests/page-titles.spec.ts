import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('intake page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/');
  await expect(page).toHaveTitle('Intake | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('plan page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/plan');
  await expect(page).toHaveTitle('Plan | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('daily checklist page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/daily');
  await expect(page).toHaveTitle('Daily checklist | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
