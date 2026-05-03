'use client';

import { useSyncExternalStore } from 'react';

import { ProviderNav } from '../../../components/ProviderNav';
import {
  createDefaultAssignmentState,
  formatUtcTimestamp,
  readAssignmentStateSnapshot,
  rotateInviteCode,
  subscribeToAssignmentStateChange,
  unlinkClient,
  writeAssignmentState,
  type ProviderAssignmentState,
} from '../../../lib/provider-assignment';

function parseAssignmentState(snapshot: string): ProviderAssignmentState {
  try {
    return JSON.parse(snapshot) as ProviderAssignmentState;
  } catch {
    return createDefaultAssignmentState();
  }
}

export default function ProviderAssignmentsPage() {
  const snapshot = useSyncExternalStore(
    subscribeToAssignmentStateChange,
    readAssignmentStateSnapshot,
    () => JSON.stringify(createDefaultAssignmentState())
  );
  const state = parseAssignmentState(snapshot);

  function persist(next: ProviderAssignmentState) {
    writeAssignmentState(next);
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1>Provider assignments</h1>

      <p style={{ maxWidth: 720 }}>
        Invite-code linking for the pilot. The flow is local to this browser for now,
        which is enough to demo the shape of the workflow without introducing backend storage.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Current invite code</h2>
        <p data-testid="invite-code" style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>
          {state.inviteCode}
        </p>
        <p>
          <button type="button" onClick={() => persist(rotateInviteCode(state))}>
            Generate new invite code
          </button>
        </p>
        <p style={{ maxWidth: 720 }}>
          Auto-assignment is <strong>{state.autoAssignmentEnabled ? 'on' : 'off'}</strong>.
          That stays disabled in this slice.
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Linked clients</h2>
        {state.links.length === 0 ? (
          <p>No clients linked yet.</p>
        ) : (
          <ul data-testid="linked-clients-list" style={{ display: 'grid', gap: 12, paddingLeft: 20 }}>
            {state.links.map((client) => (
              <li key={client.id}>
                <div>
                  <strong>{client.clientName}</strong> linked at {formatUtcTimestamp(client.linkedAt)}
                </div>
                <button
                  type="button"
                  onClick={() => persist(unlinkClient(state, client.id))}
                  style={{ marginTop: 6 }}
                >
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Audit trail</h2>
        <ul data-testid="assignment-audit-trail" style={{ display: 'grid', gap: 8, paddingLeft: 20 }}>
          {state.auditTrail.map((event) => (
            <li key={event.id}>
              <strong>{event.kind}</strong> at {formatUtcTimestamp(event.at)}: {event.detail}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Try the client join flow</h2>
        <p>
          <a href="/provider/join">Open the client code entry page</a>
        </p>
      </section>

      <ProviderNav style={{ marginTop: 32 }} />
    </main>
  );
}
