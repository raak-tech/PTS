import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProviderNav } from '../../../../components/ProviderNav';

const clientSummaries = {
  'client-001': {
    name: 'A. Client',
    program: 'Week 1 pilot',
    status: 'On track',
    adherence: '4 of 5 daily items completed this week',
    summary: 'Small, steady progress. No escalation signals in this mock view.',
    safety: 'No red flags recorded in sample data.',
  },
  'client-002': {
    name: 'B. Client',
    program: 'Week 2 pilot',
    status: 'Needs review',
    adherence: '2 of 5 daily items completed this week',
    summary: 'A gentle follow-up would make sense in a real workflow.',
    safety: 'Mock caution note only, nothing urgent.',
  },
  'client-003': {
    name: 'C. Client',
    program: 'Week 1 pilot',
    status: 'Stable',
    adherence: '3 of 5 daily items completed this week',
    summary: 'Stable sample case with routine follow-up only.',
    safety: 'No safety concerns in sample data.',
  },
} as const;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const client = clientSummaries[id as keyof typeof clientSummaries];

  return {
    title: client ? `${client.name} | Provider console` : 'Provider client',
  };
}

export default async function ProviderClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = clientSummaries[id as keyof typeof clientSummaries];

  if (!client) {
    notFound();
  }

  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <p>
        <Link href="/provider/clients" className="actionLink secondary">
          ← Back to clients
        </Link>
      </p>

      <h1>{client.name}</h1>

      <p style={{ maxWidth: 720 }}>
        Mock-only client detail page for the provider shell. This is a static
        preview, not a live patient chart.
      </p>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Snapshot</h2>
        <ul>
          <li><strong>Program:</strong> {client.program}</li>
          <li><strong>Status:</strong> {client.status}</li>
          <li><strong>Adherence:</strong> {client.adherence}</li>
        </ul>
      </section>

      <section className="sectionStack" style={{ marginTop: 32 }}>
        <h2>Provider note</h2>
        <p style={{ maxWidth: 720 }}>{client.summary}</p>
      </section>

      <section className="sectionStack" style={{ marginTop: 32 }}>
        <h2>Safety and follow-up</h2>
        <p style={{ maxWidth: 720 }}>{client.safety}</p>
      </section>

      <section className="heroPanel" style={{ marginTop: 32 }}>
        <h2>Next action</h2>
        <p style={{ maxWidth: 720 }}>
          In the real console this is where a provider would review the next
          touchpoint. For now it is just a static placeholder.
        </p>
      </section>

      <ProviderNav className="sectionStack" style={{ marginTop: 32 }} />
    </main>
  );
}