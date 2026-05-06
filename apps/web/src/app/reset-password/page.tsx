import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set a new password',
};

function errorCopy(error?: string) {
  switch (error) {
    case 'invalid':
      return 'This link is not valid, or the password does not meet the requirements. You can try again or request a new reset from the sign-in page.';
    case 'used':
      return 'This link was already used. Request a new reset from the sign-in page if you still need one.';
    case 'expired':
      return 'This link has expired. Request a new reset from the sign-in page.';
    default:
      return null;
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const error = errorCopy(params?.error);
  const token = params?.token ?? '';

  return (
    <section style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1rem' }}>
      <h1>Set a new password</h1>
      <p>Use a strong password you have not used elsewhere.</p>

      {error ? (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      ) : null}

      {!token ? (
        <p role="status">This page needs a complete reset link. Start from the sign-in page if you need a new one.</p>
      ) : (
        <form
          action="/api/auth/reset"
          method="post"
          style={{ display: 'grid', gap: 12, marginTop: 16 }}
        >
          <input type="hidden" name="token" value={token} />

          <label>
            <span>New password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              aria-describedby="reset-password-help"
              required
            />
          </label>
          <p id="reset-password-help" style={{ margin: 0, fontSize: 13, color: '#555' }}>
            Use at least 8 characters. Choose a password you have not used elsewhere.
          </p>

          <button type="submit">Update password</button>
        </form>
      )}

      <p style={{ marginTop: 16 }}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
