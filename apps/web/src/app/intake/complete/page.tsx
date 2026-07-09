import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'You\'re in | PTS' };

export default function IntakeCompletePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 540, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>✓</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 16px' }}>
          You&rsquo;re in. Your journey starts here.
        </h1>
        <p style={{ fontSize: 17, color: '#555', lineHeight: 1.6, margin: '0 0 12px' }}>
          Your counselor will review what you&rsquo;ve shared and put together a personalised program for you. This usually takes less than 24 hours.
        </p>
        <p style={{ fontSize: 15, color: '#888', margin: '0 0 36px' }}>
          You&rsquo;ll receive a message here when your plan is ready. In the meantime, your counselor may reach out with any questions.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <Link href="/messages" style={{ display: 'block', padding: '14px 28px', borderRadius: 999, background: '#111', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
            Go to messages
          </Link>
          <Link href="/plan" style={{ display: 'block', padding: '14px 28px', borderRadius: 999, border: '1.5px solid #ddd', color: '#333', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}>
            See the program overview
          </Link>
        </div>

        <p style={{ marginTop: 32, fontSize: 13, color: '#aaa' }}>
          Need to update your answers?{' '}
          <Link href="/" style={{ color: '#555', textDecoration: 'underline' }}>Go back to intake</Link>
        </p>
      </div>
    </main>
  );
}
