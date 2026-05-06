import type { Metadata } from 'next';
import Link from 'next/link';

import { ProviderNav } from '../../components/ProviderNav';

type AssignedClient = {
  id: string;
  name: string;
  program: string;
  reviewStatus: 'On track' | 'Needs review' | 'Stable';
  redFlagStatus: 'None' | 'Needs attention';
  lastCheckIn: string;
};

const defaultAssignments: AssignedClient[] = [
  {
    id: 'client-001',
    name: 'A. Client',
    program: 'Week 1 pilot',
    reviewStatus: 'On track',
    redFlagStatus: 'None',
    lastCheckIn: 'Today',
  },
  {
    id: 'client-002',
    name: 'B. Client',
    program: 'Week 2 pilot',
    reviewStatus: 'Needs review',
    redFlagStatus: 'Needs attention',
    lastCheckIn: 'Yesterday',
  },
  {
    id: 'client-003',
    name: 'C. Client',
    program: 'Week 1 pilot',
    reviewStatus: 'Stable',
    redFlagStatus: 'None',
    lastCheckIn: '2 days ago',
  },
];

export const metadata: Metadata = {
  title: 'Provider console',
};

export default async function ProviderHomePage({ searchParams }: { searchParams?: { empty?: string } | Promise<{ empty?: string }> }) {
  const params = await Promise.resolve(searchParams ?? {});
  const assignments = params.empty === '1' ? [] : defaultAssignments;
  const needsReviewCount = assignments.filter((client) => client.reviewStatus === 'Needs review').length;
  const redFlagCount = assignments.filter((client) => client.redFlagStatus === 'Needs attention').length;
  const latestCheckIn = assignments[0]?.lastCheckIn ?? 'No assigned clients yet';

  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <h1>Provider Console</h1>

      <p style={{ maxWidth: 720 }}>
        Mock-only provider dashboard for the pilot. It shows assigned clients,
        conservative review status, and safety context without saving any live
        patient data.
      </p>

      <section className="heroPanel" style={{ marginTop: 24 }}>
        <h2>Provider snapshot</h2>
        <ul>
          <li><strong>Assigned clients:</strong> {assignments.length}</li>
          <li><strong>Needs review:</strong> {needsReviewCount}</li>
          <li><strong>Red-flags alert:</strong> {redFlagCount > 0 ? 'Present' : 'None'}</li>
          <li><strong>Last check-in:</strong> {latestCheckIn}</li>
        </ul>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Assigned clients</h2>
        {assignments.length === 0 ? (
          <p>No clients are currently assigned.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {assignments.map((client) => (
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
                <h3 style={{ margin: 0 }}>{client.name}</h3>
                <p style={{ margin: 0 }}>
                  <strong>Program:</strong> {client.program}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Review status:</strong> {client.reviewStatus}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Red-flags alert:</strong> {client.redFlagStatus}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Last check-in:</strong> {client.lastCheckIn}
                </p>
                <p style={{ marginBottom: 0 }}>
                  <Link href={`/provider/clients/${client.id}`} className="actionLink secondary">
                    Open {client.name} review
                  </Link>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="heroPanel" style={{ marginTop: 32 }}>
        <h2>Review status</h2>
        <p style={{ maxWidth: 720 }}>
          Review status stays conservative: continue, adjust, or escalate. No
          outcome promises and no matching logic.
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link href="/provider/clients" className="actionLink">
            Browse clients
          </Link>
        </p>
      </section>

      <section className="sectionStack" style={{ marginTop: 32 }}>
        <h2>What is here</h2>
        <ul>
          <li>Client list with a few hardcoded examples</li>
          <li>One sample client detail view</li>
          <li>No editing, no persistence, no hidden backend calls</li>
        </ul>
      </section>

      <section className="sectionStack" style={{ marginTop: 32 }}>
        <h2>What this is not</h2>
        <ul>
          <li>Not an auth gate</li>
          <li>Not a storage layer</li>
          <li>Not a patient record system</li>
        </ul>
      </section>

      <ProviderNav className="sectionStack" style={{ marginTop: 32 }} />
    </main>
  );
}
