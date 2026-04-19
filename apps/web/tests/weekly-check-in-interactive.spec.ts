import { test, expect } from '@playwright/test';

test('weekly check-in is interactive (local-only) and can be reset', async ({ page }) => {
  await page.goto('/check-in');

  await expect(page.getByRole('heading', { name: /weekly check-in/i })).toBeVisible();

  const q1 = page.getByLabel(/what did you do most days this week\?/i);
  const q2 = page.getByLabel(/what felt easier vs harder\?/i);
  const q3 = page.getByLabel(/one small adjustment you will try next week\?/i);

  await expect(page.getByText(/progress:\s*0\s*\/\s*3/i)).toBeVisible();

  await q1.fill('Walked 5 minutes most days.');
  await expect(page.getByText(/progress:\s*1\s*\/\s*3/i)).toBeVisible();

  await q2.fill('Easier: breathing. Harder: sitting long.');
  await expect(page.getByText(/progress:\s*2\s*\/\s*3/i)).toBeVisible();

  await q3.fill('Shorter sitting blocks.');
  await expect(page.getByText(/progress:\s*3\s*\/\s*3/i)).toBeVisible();

  await page.getByRole('button', { name: /reset answers/i }).click();

  await expect(q1).toHaveValue('');
  await expect(q2).toHaveValue('');
  await expect(q3).toHaveValue('');
  await expect(page.getByText(/progress:\s*0\s*\/\s*3/i)).toBeVisible();
});
