import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in',
};

function errorCopy(error?: string) {
  switch (error) {
    case 'invalid':
      return 'Invalid email or password. Try again.';
    default:
      return null;
  }
}

function statusCopy(reset?: string) {
  return reset === 'success' ? 'You can sign in with your new password.' : null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const error = errorCopy(params?.error);
  const status = statusCopy(params?.reset);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 10px', color: '#111' }}>Sign in</h1>
          <p style={{ color: '#444', margin: 0, lineHeight: 1.5, fontSize: 15 }}>Welcome back. Use your PTS email and password.</p>
        </div>

        {status && <p role="status" style={{ background: '#e8f5e9', border: '2px solid #2e7d32', color: '#1b5e20', padding: '10px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{status}</p>}

        {error && (
          <p role="alert" style={{ background: '#ffebee', border: '2px solid #c62828', color: '#b71c1c', padding: '10px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
            {error}
          </p>
        )}

        <form action="/api/auth/login" method="post" style={{ display: 'grid', gap: 16, background: 'white', padding: '28px 24px', borderRadius: 16, border: '2px solid #ddd' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="email" style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #999', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', color: '#111' }}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="password" style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #999', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', color: '#111' }}
            />
          </div>

          <button type="submit" style={{ padding: '13px', borderRadius: 999, border: 'none', background: '#111', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>Sign in →</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#555' }}>
          <Link href="/forgot-password" style={{ color: '#0066cc', fontWeight: 600, textDecoration: 'underline' }}>Forgot password?</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#555' }}>
          New here? <Link href="/register" style={{ color: '#0066cc', fontWeight: 600, textDecoration: 'underline' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
