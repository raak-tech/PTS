import { expect, test } from '@playwright/test';

import { startConsoleErrorCollector } from './helpers/console';
import {
  expirePasswordResetTokenByPlaintext,
  extractTokenFromOutboxBody,
  getLatestOutboxBodyForEmail,
} from './helpers/password-reset';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

test('forgot-password and reset-password pages render', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();

  await page.goto('/reset-password');
  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible();

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('request reset records outbox and reset updates password', async ({ page, context }) => {
  const errors = startConsoleErrorCollector(page);
  const email = uniqueEmail('reset-flow');
  const oldPassword = 'OldPilot123!';
  const newPassword = 'NewPilot456!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(oldPassword);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await context.clearCookies();

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/forgot-password\?sent=1/);

  const body = await getLatestOutboxBodyForEmail(email);
  expect(body).toBeTruthy();
  const token = extractTokenFromOutboxBody(body!);
  expect(token).toBeTruthy();

  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel('New password').fill(newPassword);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page).toHaveURL(/\/login\?reset=success/);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(oldPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/login\?error=invalid/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(newPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('reset token cannot be reused', async ({ page, context }) => {
  const errors = startConsoleErrorCollector(page);
  const email = uniqueEmail('reuse');
  const password = 'PilotReuse123!';
  const newPassword = 'PilotReuse456!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await context.clearCookies();

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();

  const body = await getLatestOutboxBodyForEmail(email);
  const token = extractTokenFromOutboxBody(body!);
  expect(token).toBeTruthy();

  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel('New password').fill(newPassword);
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page).toHaveURL(/\/login\?reset=success/);

  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel('New password').fill('AnotherPilot789!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page).toHaveURL(/\/reset-password\?/);
  await expect(page.getByRole('alert')).toContainText(/already used/i);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('expired reset token is rejected', async ({ page, context }) => {
  const errors = startConsoleErrorCollector(page);
  const email = uniqueEmail('expired');
  const password = 'PilotExpire123!';

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await context.clearCookies();

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();

  const body = await getLatestOutboxBodyForEmail(email);
  const token = extractTokenFromOutboxBody(body!);
  expect(token).toBeTruthy();

  await expirePasswordResetTokenByPlaintext(token!);

  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel('New password').fill('DoesNotMatter99!');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page).toHaveURL(/\/reset-password\?/);
  await expect(page.getByRole('alert')).toContainText(/expired/i);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
