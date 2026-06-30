import Link from 'next/link';
import type { Metadata } from 'next';

import { webTheme as t } from '@/lib/web-theme';

export const metadata: Metadata = {
  title: 'Sign in with mobile',
};

function errorCopy(error?: string) {
  switch (error) {
    case 'invalid':
    case 'invalid-phone':
      return 'Enter a valid 10-digit mobile number and OTP.';
    case 'not-registered':
      return 'This number is not registered. Ask your program administrator to add you.';
    case 'expired':
      return 'That code has expired. Request a new OTP.';
    case 'no-code':
      return 'Request an OTP first, then enter the code.';
    case 'too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'too-many-attempts':
      return 'Too many wrong codes. Request a new OTP.';
    default:
      return error ? 'Could not sign in. Try again.' : null;
  }
}

export default async function MobileLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; phone?: string; next?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const error = errorCopy(params?.error);
  const phone = params?.phone ?? '';
  const next = params?.next ?? '/intake';
  const sent = params?.sent === '1';

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 10px', color: '#111' }}>Sign in with mobile</h1>
          <p style={{ color: t.textSecondary, margin: 0, lineHeight: 1.5, fontSize: 16, fontWeight: 500 }}>
            Use the mobile number your administrator registered. We will send a one-time code.
          </p>
        </div>

        {sent ? (
          <p role="status" style={{ background: '#e8f5e9', border: '2px solid #2e7d32', color: '#1b5e20', padding: '10px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
            OTP sent. Enter the code below.
          </p>
        ) : null}

        {error ? (
          <p role="alert" style={{ background: '#ffebee', border: '2px solid #c62828', color: '#b71c1c', padding: '10px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
            {error}
          </p>
        ) : null}

        <form action="/api/auth/otp/send-web" method="post" style={{ display: 'grid', gap: 16, background: 'white', padding: '28px 24px', borderRadius: 16, border: '2px solid #ddd', marginBottom: 16 }}>
          <input type="hidden" name="next" value={next} />
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="phone" style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Mobile number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              defaultValue={phone}
              placeholder="10-digit number"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #333',
                fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box',
                color: '#111', backgroundColor: '#fff',
              }}
            />
          </div>
          <button type="submit" style={{ padding: '13px', borderRadius: 999, border: 'none', background: '#111', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Send OTP
          </button>
        </form>

        <form action="/api/auth/otp/verify-web" method="post" style={{ display: 'grid', gap: 16, background: 'white', padding: '28px 24px', borderRadius: 16, border: '2px solid #ddd' }}>
          <input type="hidden" name="next" value={next} />
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="verify-phone" style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Mobile number</label>
            <input
              id="verify-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              defaultValue={phone}
              placeholder="10-digit number"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #333',
                fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box',
                color: '#111', backgroundColor: '#fff',
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="code" style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>OTP code</label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="6-digit code"
              maxLength={8}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #333',
                fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box',
                color: '#111', backgroundColor: '#fff',
                letterSpacing: '0.2em',
              }}
            />
          </div>
          <button type="submit" style={{ padding: '13px', borderRadius: 999, border: 'none', background: '#111', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Verify & continue →
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: t.textMuted }}>
          Admin or counselor? <Link href={`/login?next=${encodeURIComponent(next)}`} style={{ color: '#0066cc', fontWeight: 600, textDecoration: 'underline' }}>Sign in with email</Link>
        </p>
      </div>
    </div>
  );
}
