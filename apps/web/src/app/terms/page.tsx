import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'inherit', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Terms of use</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Last updated: May 2026 · Pilot version</p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>What PTS is</h2>
        <p>
          PTS (Pain to Strength) is a counseling-led recovery support program for people whose pain has disrupted their
          life. It is <strong>not</strong> a medical service and does not provide diagnosis, prescription, or emergency
          care.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your responsibilities</h2>
        <p>
          Provide accurate information in your assessment. Seek emergency or medical care when needed. Use the platform
          respectfully and follow your counselor&apos;s guidance within the scope of counseling support.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Pilot terms</h2>
        <p>
          During the pilot, the service is provided free of charge. Features may change. We may pause or end access with
          notice. There are no guaranteed clinical outcomes.
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Crisis</h2>
        <p>
          If you are in immediate danger, contact local emergency services. In India: iCall{' '}
          <a href="tel:9152987821">9152987821</a>, Aasra <a href="tel:9820466726">9820466726</a>. See{' '}
          <Link href="/red-flags">safety guidelines</Link>.
        </p>
      </section>

      <p style={{ marginTop: 32 }}>
        <Link href="/">← Back to home</Link>
      </p>
    </div>
  );
}
