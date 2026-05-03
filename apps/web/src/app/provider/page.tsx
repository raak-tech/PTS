import type { Metadata } from 'next';
import Link from 'next/link';

import { ProviderNav } from '../../components/ProviderNav';

export const metadata: Metadata = {
  title: 'Provider console',
};

export default function ProviderHomePage() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Provider Console</h1>

      <p style={{ maxWidth: 720 }}>
        Mock-only provider shell for the pilot. Nothing here saves client data,
        and nothing implies production records. It is just a place to inspect a
        few sample client views.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>What is here</h2>
        <ul>
          <li>Client list with a few hardcoded examples</li>
          <li>One sample client detail view</li>
          <li>No editing, no persistence, no hidden backend calls</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Open the mock views</h2>
        <p>
          <Link href="/provider/assignments">Manage assignments</Link>
        </p>
        <p>
          <Link href="/provider/join">Open client join flow</Link>
        </p>
        <p>
          <Link href="/provider/clients">Browse clients</Link>
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>What this is not</h2>
        <ul>
          <li>Not an auth gate</li>
          <li>Not a storage layer</li>
          <li>Not a patient record system</li>
        </ul>
      </section>

      <ProviderNav style={{ marginTop: 32 }} />
    </main>
  );
}