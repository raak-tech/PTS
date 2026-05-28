import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { getDb } from '../../../../db';
import { supportArtifacts, userConsents, users } from '../../../../db/schema';
import { getUserFromCookieHeader } from '../../../../lib/session';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = getDb();
  const [client] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  return { title: client ? `Client detail | Provider console` : 'Client not found' };
}

export default async function ProviderClientDetailPage({ params }: Props) {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));
  if (!user) redirect('/login');

  const { id } = await params;
  const db = getDb();

  const [client] = await db
    .select({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!client || client.role !== 'client') notFound();

  const [consent] = await db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, id))
    .limit(1);

  const artifacts = consent?.dataStorageEnabled
    ? await db
        .select({ id: supportArtifacts.id, kind: supportArtifacts.kind, title: supportArtifacts.title, createdAt: supportArtifacts.createdAt })
        .from(supportArtifacts)
        .where(eq(supportArtifacts.userId, id))
        .orderBy(supportArtifacts.createdAt)
    : [];

  const kindCounts: Record<string, number> = {};
  for (const a of artifacts) {
    kindCounts[a.kind] = (kindCounts[a.kind] ?? 0) + 1;
  }

  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <h1>Client detail</h1>

      <section className="heroPanel" style={{ marginTop: 24 }}>
        <h2>{anonymise(client.email)}</h2>
        <ul>
          <li><strong>Registered:</strong> {client.createdAt.toLocaleDateString()}</li>
          <li><strong>Storage consent:</strong> {consent?.dataStorageEnabled ? 'Enabled' : 'Not enabled'}</li>
          <li><strong>Saved artifacts:</strong> {artifacts.length}</li>
          {Object.entries(kindCounts).map(([kind, count]) => (
            <li key={kind}><strong>{kind}:</strong> {count}</li>
          ))}
        </ul>
      </section>

      {artifacts.length > 0 && (
        <section className="sectionStack" style={{ marginTop: 24 }}>
          <h2>Activity log</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {(artifacts as Array<{ id: string; kind: string; title: string; createdAt: Date }>).map((a) => (
              <div
                key={a.id}
                style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', background: 'var(--surface-2)' }}
              >
                <strong>{a.kind}</strong> — {a.title}{' '}
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {a.createdAt.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!consent?.dataStorageEnabled && (
        <section className="sectionStack" style={{ marginTop: 24 }}>
          <p>This client has not enabled data storage. No artifacts are available for review.</p>
        </section>
      )}
    </main>
  );
}

function anonymise(email: string) {
  const [local] = email.split('@');
  return `${local[0]}***@${email.split('@')[1]}`;
}
