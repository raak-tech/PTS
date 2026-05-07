import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

import { getDb } from '../../db';
import { supportArtifacts, userConsents } from '../../db/schema';
import { getUserFromCookieHeader } from '../../lib/session';
import { SupportControls } from '../../components/SupportControls';

export const metadata: Metadata = {
  title: 'Support storage',
};

export default async function SupportPage() {
  const headerStore = await headers();
  const cookieHeader = headerStore.get('cookie');
  const user = await getUserFromCookieHeader(cookieHeader);

  if (!user) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
        <h1>Support storage</h1>
        <p style={{ maxWidth: 720 }}>
          Sign in to manage consent, export stored support data, or delete your saved records.
        </p>
        <p>
          <Link href="/login">Sign in</Link> or <Link href="/register">Create an account</Link>.
        </p>
      </main>
    );
  }

  const db = getDb();
  const [consent] = await db.select().from(userConsents).where(eq(userConsents.userId, user.id)).limit(1);
  const records = await db.select().from(supportArtifacts).where(eq(supportArtifacts.userId, user.id));

  const initialConsent = {
    providerAccessEnabled: Boolean(consent?.providerAccessEnabled),
    reflectionsEnabled: Boolean(consent?.reflectionsEnabled),
    redFlagsStorageEnabled: Boolean(consent?.redFlagsStorageEnabled),
    reflectionEncryptionEnabled: Boolean(consent?.reflectionEncryptionEnabled),
    reflectionSalt: consent?.reflectionSalt ?? null,
  };

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Support storage</h1>

      <p style={{ maxWidth: 720 }}>
        Manage the optional storage layer for your support account. Exporting and deletion are self-serve.
      </p>

      <p style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
        Stored records: {records.length}
      </p>

      <SupportControls initialConsent={initialConsent} />

      <section style={{ marginTop: 32 }}>
        <h2>Encrypted reflections</h2>
        <p style={{ maxWidth: 720 }}>
          Optional reflections are encrypted in the browser before they are sent when you
          turn that setting on.
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>What each control does</h2>
        <ul>
          <li>Provider access stores intake summaries, week plans, and weekly check-in snapshots.</li>
          <li>Reflections/free-text stores optional daily reflections and weekly notes.</li>
          <li>Red-flags notes stores a short record when the intake flow routes to red-flags guidance.</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Export</h2>
        <p>
          <Link href="/support/export">Open human-readable export</Link>
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>How this works</h2>
        <ul>
          <li>Nothing is stored until you enable a control.</li>
          <li>Revoking consent stops future storage immediately.</li>
          <li>Deletion removes all stored support artifacts for your account.</li>
        </ul>
      </section>
    </main>
  );
}
