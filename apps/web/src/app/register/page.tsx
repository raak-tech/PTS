import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create account',
};

function errorCopy(error?: string) {
  switch (error) {
    case 'duplicate':
      return 'That email is already registered. Try signing in instead.';
    case 'invalid':
      return 'Check your email and password, then try again.';
    default:
      return null;
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = errorCopy(params?.error);

  return (
    <section style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1rem' }}>
      <h1>Create your account</h1>
      <p>Use your email and a password to get started with PTS.</p>

      {error ? (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      ) : null}

      <form action="/api/auth/register" method="post" style={{ display: 'grid', gap: 12 }}>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <button type="submit">Create account</button>
      </form>

      <p style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </section>
  );
}
