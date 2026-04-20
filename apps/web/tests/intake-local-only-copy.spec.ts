import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('intake shows explicit local-only + no-storage microcopy (Sprint 1)', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/');

  await expect(page.getByRole('heading', { name: /get a week 1 plan/i })).toBeVisible();

  await expect(
    page.getByText(
      /local-only:.*not saved.*no localstorage.*no sessionstorage.*not sent to a server/i
    )
  ).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
