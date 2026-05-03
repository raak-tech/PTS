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
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Clients</h1>

      <p style={{ maxWidth: 720 }}>
        Static sample roster for the provider shell. These are mock rows, not real
        client records.
      </p>

      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {clients.map((client) => (
            <article
              key={client.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 12,
                padding: 16,
                display: 'grid',
                gap: 8,
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
                <Link href={`/provider/clients/${client.id}`}>Open client summary</Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <ProviderNav style={{ marginTop: 32 }} />
    </main>
  );
}