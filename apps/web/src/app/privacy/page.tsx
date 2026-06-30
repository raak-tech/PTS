import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'inherit', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Privacy policy</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Last updated: May 2026 · Pilot version</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>What we collect</h2>
        <p>
          Account details (email, display name), your intake assessment, program activity, messages with your counselor,
          and optional support artifacts you choose to store. We collect only what is needed to deliver the program.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>How we use it</h2>
        <p>
          To personalise your recovery plan, enable counselor review, deliver daily support, and improve the platform
          during the pilot. Intake data may be sent to our LLM provider to generate draft plans; counselors review
          before delivery.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your controls</h2>
        <p>
          You can manage consent and stored data from{' '}
          <Link href="/support">Your data</Link>. You may request export or deletion of stored support artifacts.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Contact</h2>
        <p>
          Questions: contact your program administrator during the pilot. For crisis support, see our{' '}
          <Link href="/red-flags">safety guidelines</Link>.
        </p>
      </section>

      <p style={{ marginTop: 32 }}>
        <Link href="/">← Back to home</Link>
      </p>
    </div>
  );
}
