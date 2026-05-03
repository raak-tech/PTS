'use client';

import { useState } from 'react';

import { ProviderNav } from '../../../components/ProviderNav';
import {
  linkClientIfCodeMatches,
  readAssignmentState,
  writeAssignmentState,
} from '../../../lib/provider-assignment';

export default function ProviderJoinPage() {
  const [inviteCode, setInviteCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState('');

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Join with invite code</h1>

      <p style={{ maxWidth: 720 }}>
        A client uses this page to enter an invite code and link to a provider.
        This demo keeps the data in the browser only.
      </p>

      <section style={{ marginTop: 24, display: 'grid', gap: 12, maxWidth: 520 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Invite code</span>
          <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Client name</span>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} />
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

        {message ? <p role="status">{message}</p> : null}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Need the latest code?</h2>
        <p>
          <a href="/provider/assignments">Check the provider assignment page</a>
        </p>
      </section>

      <ProviderNav style={{ marginTop: 32 }} />
    </main>
  );
}
