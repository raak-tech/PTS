import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create account | PTS' };

function errorCopy(error?: string) {
  switch (error) {
    case 'duplicate': return 'That email is already registered. Try signing in instead.';
    case 'invalid': return 'Check your details and try again.';
    case 'server': return 'Something went wrong — please try again.';
    default: return null;
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const error = errorCopy(params?.error);
  const next = params?.next ?? '/';

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 10px', color: '#111' }}>Start your recovery journey</h1>
          <p style={{ color: '#444', margin: 0, lineHeight: 1.5, fontSize: 15 }}>
            Create a free account. Your personalised program will be ready within 24 hours of completing your intake.
          </p>
        </div>

        {error && (
          <div role="alert" style={{ background: '#ffebee', border: '2px solid #c62828', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#b71c1c', fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form action="/api/auth/register" method="post" style={{ display: 'grid', gap: 16, background: 'white', padding: '28px 24px', borderRadius: 16, border: '2px solid #ddd' }}>
          <input type="hidden" name="next" value={next} />

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="displayName" style={{ fontWeight: 600, fontSize: 14 }}>Your first name</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="given-name"
              placeholder="e.g. Alex"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="email" style={{ fontWeight: 600, fontSize: 14 }}>Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="password" style={{ fontWeight: 600, fontSize: 14 }}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              aria-describedby="pw-help"
              required
              style={inputStyle}
            />
            <p id="pw-help" style={{ margin: 0, fontSize: 12, color: '#555', fontWeight: 400 }}>Use at least 8 characters. Longer is better.</p>
          </div>

          <button type="submit" style={btnStyle}>
            Create account →
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#555' }}>
          Already have an account? <Link href="/login" style={{ color: '#0066cc', fontWeight: 600, textDecoration: 'underline' }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#555' }}>
          Are you a counselor? <Link href="/register/counselor" style={{ color: '#0066cc', fontWeight: 600, textDecoration: 'underline' }}>Register here →</Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '2px solid #999', fontSize: 16, fontFamily: 'inherit',
  boxSizing: 'border-box', color: '#111', backgroundColor: '#fff',
};
const btnStyle: React.CSSProperties = {
  padding: '13px', borderRadius: 999, border: 'none',
  background: '#111', color: 'white', fontWeight: 700,
  fontSize: 15, cursor: 'pointer', marginTop: 4,
  transition: 'background-color 0.2s',
};
