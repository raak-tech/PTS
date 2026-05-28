import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';

import { ProviderNav } from '../../components/ProviderNav';
import { getDb } from '../../db';
import { supportArtifacts, users } from '../../db/schema';
import { getUserFromCookieHeader } from '../../lib/session';

export const metadata: Metadata = { title: 'Provider console' };

export default async function ProviderHomePage() {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));
  if (!user) redirect('/login');

  const db = getDb();

  type ClientRow = { id: string; email: string; createdAt: Date; artifactCount: number; lastActivity: Date | null };
  const clients = (await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      artifactCount: sql<number>`cast(count(${supportArtifacts.id}) as int)`,
      lastActivity: sql<Date | null>`max(${supportArtifacts.createdAt})`,
    })
    .from(users)
    .leftJoin(supportArtifacts, eq(supportArtifacts.userId, users.id))
    .where(eq(users.role, 'client'))
    .groupBy(users.id, users.email, users.createdAt)) as ClientRow[];

  const needsReviewCount = clients.filter((c: ClientRow) => (c.artifactCount ?? 0) === 0).length;

  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <h1>Provider Console</h1>

      <section className="heroPanel" style={{ marginTop: 24 }}>
        <h2>Pilot snapshot</h2>
        <ul>
          <li><strong>Registered clients:</strong> {clients.length}</li>
          <li><strong>No activity yet:</strong> {needsReviewCount}</li>
          <li><strong>With saved artifacts:</strong> {clients.filter((c: ClientRow) => (c.artifactCount ?? 0) > 0).length}</li>
        </ul>
        <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--muted)' }}>
          Note: Client-provider linking (invite codes) is not yet implemented. This view shows all registered clients.
        </p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Registered clients</h2>
        {clients.length === 0 ? (
          <p>No clients have registered yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {clients.map((client: ClientRow) => (
              <article
                key={client.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  padding: 18,
                  display: 'grid',
                  gap: 8,
                  background: 'var(--surface-2)',
                }}
              >
                <h3 style={{ margin: 0 }}>{anonymise(client.email)}</h3>
                <p style={{ margin: 0 }}>
                  <strong>Registered:</strong> {client.createdAt.toLocaleDateString()}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Saved artifacts:</strong> {client.artifactCount ?? 0}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Last activity:</strong>{' '}
                  {client.lastActivity ? client.lastActivity.toLocaleDateString() : 'None'}
                </p>
                <p style={{ marginBottom: 0 }}>
                  <Link href={`/provider/clients/${client.id}`} className="actionLink secondary">
                    View client detail
                  </Link>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <ProviderNav className="sectionStack" style={{ marginTop: 32 }} />
    </main>
  );
}

/** Show only the first character before @ to protect privacy in the UI. */
function anonymise(email: string) {
  const [local] = email.split('@');
  return `${local[0]}***@${email.split('@')[1]}`;
}
