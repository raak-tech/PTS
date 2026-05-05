import type { Metadata } from 'next';
import Link from 'next/link';

import { ProviderNav } from '../../components/ProviderNav';

export const metadata: Metadata = {
  title: 'Provider console',
};

export default function ProviderHomePage() {
  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <h1>Provider Console</h1>

      <p style={{ maxWidth: 720 }}>
        Mock-only provider shell for the pilot. Nothing here saves client data,
        and nothing implies production records. It is just a place to inspect a
        few sample client views.
      </p>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>What is here</h2>
        <ul>
          <li>Client list with a few hardcoded examples</li>
          <li>One sample client detail view</li>
          <li>No editing, no persistence, no hidden backend calls</li>
        </ul>
      </section>

      <section className="heroPanel" style={{ marginTop: 32 }}>
        <h2>Open the mock views</h2>
        <p style={{ marginTop: 12 }}>
          <Link href="/provider/assignments" className="actionLink">
            Manage assignments
          </Link>
        </p>
        <p style={{ marginTop: 10 }}>
          <Link href="/provider/join" className="actionLink secondary">
            Open client join flow
          </Link>
        </p>
        <p style={{ marginTop: 10 }}>
          <Link href="/provider/clients" className="actionLink secondary">
            Browse clients
          </Link>
        </p>
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