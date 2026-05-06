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

test('weekly check-in page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/check-in');
  await expect(page).toHaveTitle('Weekly check-in | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('flare-up protocol page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/flare-up');
  await expect(page).toHaveTitle('Flare-up protocol | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('red flags page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/red-flags');
  await expect(page).toHaveTitle('Red flags | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('provider console page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider');
  await expect(page).toHaveTitle('Provider console | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('provider assignments page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider/assignments');
  await expect(page).toHaveTitle('Provider assignments | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('provider join page sets a specific document title', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/provider/join');
  await expect(page).toHaveTitle('Join with invite code | PTS');

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
