import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

test('register, login, and logout pages are available', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  await page.goto('/logout');
  await expect(page).toHaveURL(/\/login$/);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('register creates a session cookie and login/logout round-trip works', async ({ page, context }) => {
  const email = uniqueEmail('pilot');
  const password = 'PilotTest123!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/$/);
  expect((await context.cookies()).some((cookie) => cookie.name === 'pts_session')).toBe(true);

  await page.goto('/logout');
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.cookies()).some((cookie) => cookie.name === 'pts_session')).toBe(false);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/$/);
  expect((await context.cookies()).some((cookie) => cookie.name === 'pts_session')).toBe(true);
});
