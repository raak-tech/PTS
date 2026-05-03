import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from './auth';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function createSessionCookie(value: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction(),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function clearSessionCookie() {
  return {
    ...createSessionCookie(''),
    maxAge: 0,
  };
}
