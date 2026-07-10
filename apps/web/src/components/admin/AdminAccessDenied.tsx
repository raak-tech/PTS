import Link from 'next/link';

export function AdminAccessDenied({ email }: { email: string }) {
  return (
    <div style={{ minHeight: '60vh', padding: '48px 24px', fontFamily: 'inherit', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>Admin access required</h1>
      <p style={{ color: '#444', lineHeight: 1.6, margin: '0 0 16px' }}>
        You are signed in as <strong>{email}</strong>, but this account does not have admin access.
      </p>
      <p style={{ color: '#666', lineHeight: 1.6, margin: '0 0 24px', fontSize: 14 }}>
        Admin access needs <code>role=admin</code> in the database or your email listed in the
        {' '}<code>ADMIN_EMAILS</code> environment variable on Vercel.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/logout" style={{ padding: '10px 18px', borderRadius: 999, background: '#111', color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
          Sign out
        </Link>
        <Link href="/" style={{ padding: '10px 18px', borderRadius: 999, border: '2px solid #ccc', color: '#111', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
