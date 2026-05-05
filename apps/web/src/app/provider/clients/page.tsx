import type { Metadata } from 'next';
import Link from 'next/link';

import { ProviderNav } from '../../../components/ProviderNav';

const clients = [
  {
    id: 'client-001',
    name: 'A. Client',
    program: 'Week 1 pilot',
    status: 'On track',
    lastTouchpoint: 'Today',
  },
  {
    id: 'client-002',
    name: 'B. Client',
    program: 'Week 2 pilot',
    status: 'Needs review',
    lastTouchpoint: 'Yesterday',
  },
  {
    id: 'client-003',
    name: 'C. Client',
    program: 'Week 1 pilot',
    status: 'Stable',
    lastTouchpoint: '2 days ago',
  },
] as const;

export const metadata: Metadata = {
  title: 'Provider clients',
};

export default function ProviderClientsPage() {
  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <h1>Clients</h1>

      <p style={{ maxWidth: 720 }}>
        Static sample roster for the provider shell. These are mock rows, not real
        client records.
      </p>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {clients.map((client) => (
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
              <h2 style={{ margin: 0 }}>{client.name}</h2>
              <p style={{ margin: 0 }}>
                <strong>Program:</strong> {client.program}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Status:</strong> {client.status}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Last touchpoint:</strong> {client.lastTouchpoint}
              </p>
              <p style={{ marginBottom: 0 }}>
                <Link href={`/provider/clients/${client.id}`} className="actionLink secondary">
                  Open client summary
                </Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <ProviderNav className="sectionStack" style={{ marginTop: 32 }} />
    </main>
  );
}