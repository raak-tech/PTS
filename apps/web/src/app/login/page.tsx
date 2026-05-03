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
    <section style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1rem' }}>
      <h1>Sign in</h1>
      <p>Welcome back. Use your PTS email and password.</p>

      {status ? <p role="status">{status}</p> : null}

      {error ? (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      ) : null}

      <form action="/api/auth/login" method="post" style={{ display: 'grid', gap: 12 }}>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit">Sign in</button>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link href="/forgot-password">Forgot password</Link>
      </p>

      <p style={{ marginTop: 16 }}>
        New here? <Link href="/register">Create an account</Link>
      </p>
    </section>
  );
}
