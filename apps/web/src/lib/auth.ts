import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'pts_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Pilot default: single-use reset links stop working after this many seconds. */
export const PASSWORD_RESET_MAX_AGE_SECONDS = 60 * 60;

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

/** Opaque single-use value; stored hashed server-side. */
export function createPasswordResetToken() {
  return createSessionToken();
}

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('base64url');
}
