import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { desc, eq } from 'drizzle-orm';

import { getDb } from '../../../db';
import { supportArtifacts } from '../../../db/schema';
import { getUserFromCookieHeader } from '../../../lib/session';

export const metadata: Metadata = {
  title: 'Support export',
};

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default async function SupportExportPage() {
  const headerStore = await headers();
  const user = await getUserFromCookieHeader(headerStore.get('cookie'));
  if (!user) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
        <h1>Support export</h1>
        <p>
          Sign in to view stored support data.
        </p>
        <p>
          <Link href="/login">Sign in</Link>
        </p>
      </main>
    );
  }

  type ArtifactRow = { id: string; kind: string; title: string; bodyText: string; createdAt: Date; reflectionCiphertext: string | null; reflectionEncryptionMeta: string | null };
  const db = getDb();
  const records = (await db
    .select()
    .from(supportArtifacts)
    .where(eq(supportArtifacts.userId, user.id))
    .orderBy(desc(supportArtifacts.createdAt))) as ArtifactRow[];

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
      <p>
        <Link href="/support">← Back to support storage</Link>
      </p>

      <h1>Support export</h1>

      <p style={{ maxWidth: 720 }}>
        Human-readable export of the support artifacts saved for your account.
        Encrypted reflections remain ciphertext-only here.
      </p>

      {records.length === 0 ? (
        <p>No saved support data yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {records.map((record: ArtifactRow) => (
            <section key={record.id} style={{ padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
              <h2 style={{ marginTop: 0 }}>{record.title}</h2>
              <p style={{ marginTop: 0, fontSize: 13, color: '#555' }}>
                {record.kind} · {formatTimestamp(record.createdAt)}
              </p>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {record.bodyText}
              </pre>
              {record.reflectionCiphertext ? (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ marginBottom: 8 }}>Encrypted reflection</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                    Ciphertext: {record.reflectionCiphertext}

                    Meta: {record.reflectionEncryptionMeta ?? 'n/a'}
                  </pre>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
