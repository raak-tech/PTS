import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot password',
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  const sent = params?.sent === '1';

  return (
    <section style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1rem' }}>
      <h1>Reset your password</h1>
      <p>Enter the email you use for PTS. Further steps depend on whether an account exists.</p>

      {sent ? (
        <p role="status">
          If an account matches that address, instructions are queued. This pilot may store them in a local
          outbox instead of sending email.
        </p>
      ) : null}

      <form
        action="/api/auth/request-reset"
        method="post"
        style={{ display: 'grid', gap: 12, marginTop: 16 }}
      >
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <button type="submit">Continue</button>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
