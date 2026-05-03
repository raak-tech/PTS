import { expect, test } from '@playwright/test';

import {
  hashPassword,
  hashToken,
  verifyPassword,
} from '../src/lib/auth';
import { clearSessionCookie, createSessionCookie } from '../src/lib/cookies';

test('auth helpers hash and verify passwords and tokens', async () => {
  const password = 'correct horse battery staple';
  const passwordHash = await hashPassword(password);

  await expect(verifyPassword(passwordHash, password)).resolves.toBe(true);
  await expect(verifyPassword(passwordHash, 'wrong password')).resolves.toBe(false);

  const token = 'session-token-123';
  expect(hashToken(token)).toBe(hashToken(token));
  expect(hashToken(token)).not.toBe(hashToken(`${token}-different`));
});

test('auth cookie helpers set secure, httpOnly cookies', () => {
  const cookie = createSessionCookie('token-value');

  expect(cookie.name).toBe('pts_session');
  expect(cookie.value).toBe('token-value');
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe('lax');
  expect(cookie.path).toBe('/');
  expect(cookie.maxAge).toBeGreaterThan(0);
  expect(cookie.secure).toBe(false);

  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const prodCookie = createSessionCookie('token-value');
  process.env.NODE_ENV = previous;

  expect(prodCookie.secure).toBe(true);
  expect(clearSessionCookie().maxAge).toBe(0);
  expect(clearSessionCookie().value).toBe('');
});
