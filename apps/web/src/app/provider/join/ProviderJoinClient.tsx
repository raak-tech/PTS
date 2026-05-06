'use client';

import { useState } from 'react';
import Link from 'next/link';

import { ProviderNav } from '../../../components/ProviderNav';
import {
  linkClientIfCodeMatches,
  readAssignmentState,
  writeAssignmentState,
} from '../../../lib/provider-assignment';

export default function ProviderJoinClient() {
  const [inviteCode, setInviteCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState('');

  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <h1>Join with invite code</h1>

      <p style={{ maxWidth: 720 }}>
        A client uses this page to enter an invite code and link to a provider.
        This demo keeps the data in the browser only.
      </p>

      <section className="sectionStack" style={{ marginTop: 24, display: 'grid', gap: 12, maxWidth: 520 }}>
        <label htmlFor="provider-invite-code" style={{ display: 'grid', gap: 6 }}>
          <span>Invite code</span>
          <input id="provider-invite-code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
        </label>

        <label htmlFor="provider-client-name" style={{ display: 'grid', gap: 6 }}>
          <span>Client name</span>
          <input id="provider-client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </label>

        <button
          type="button"
          onClick={() => {
            const current = readAssignmentState();
            const result = linkClientIfCodeMatches(current, inviteCode, clientName);

            if (result.error) {
              setMessage(result.error);
              return;
            }

            writeAssignmentState(result.state);
            setMessage(`Linked ${clientName.trim()} to the provider.`);
          }}
        >
          Link to provider
        </button>

        {message ? <p role="status" className="statusBanner">{message}</p> : null}
      </section>

      <section className="heroPanel" style={{ marginTop: 32 }}>
        <h2>Need the latest code?</h2>
        <p>
          <Link href="/provider/assignments" className="actionLink secondary">Check the provider assignment page</Link>
        </p>
      </section>

      <ProviderNav className="sectionStack" style={{ marginTop: 32 }} />
    </main>
  );
}
