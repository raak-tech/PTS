import { randomUUID } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

import { getDb } from '../src/db';
import { supportArtifacts } from '../src/db/schema';
import { startConsoleErrorCollector } from './helpers/console';

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

test('optional reflections can be encrypted client-side before support storage saves them', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);
  const email = uniqueEmail('encrypted');
  const password = 'PilotTest123!';
  const secret = `secret-${randomUUID()}`;

  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/');
  await page.getByLabel(/primary pain area/i).fill('Upper back');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill('Move more without flare-ups');
  await page.getByLabel(/save my support data on this account/i).check();
  await page.getByRole('button', { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/plan/);

  await page.goto('/daily');
  await page.getByLabel(/breathing \/ grounding/i).check();
  await page.getByLabel(/gentle movement/i).check();
  await page.getByLabel(/values-based action/i).check();
  await page.getByLabel(/reflection \(optional\)/i).fill('I felt calmer after a short walk.');

  await page.getByLabel(/encrypt optional reflections/i).check();
  await expect(page.getByRole('status').filter({ hasText: /encrypted reflections enabled/i })).toBeVisible();
  await page.getByLabel(/client secret code/i).fill(secret);
  await page.getByRole('button', { name: /save daily completion/i }).click();
  await expect(page.getByText(/daily completion saved/i)).toBeVisible();

  const db = getDb();
  const [row] = await db
    .select({
      bodyText: supportArtifacts.bodyText,
      reflectionCiphertext: supportArtifacts.reflectionCiphertext,
      reflectionEncryptionMeta: supportArtifacts.reflectionEncryptionMeta,
    })
    .from(supportArtifacts)
    .where(eq(supportArtifacts.kind, 'daily'))
    .orderBy(desc(supportArtifacts.createdAt))
    .limit(1);

  expect(row).toBeTruthy();
  expect(row?.bodyText ?? '').not.toMatch(/felt calmer after a short walk/i);
  expect(row?.reflectionCiphertext).toBeTruthy();
  expect(row?.reflectionCiphertext ?? '').not.toMatch(/felt calmer after a short walk/i);
  expect(row?.reflectionEncryptionMeta ?? '').toMatch(/scrypt|argon2id/i);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
