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

export default function ProviderAssignmentsClient() {
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
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <h1>Provider assignments</h1>

      <p style={{ maxWidth: 720 }}>
        Invite-code linking for the pilot. The flow is local to this browser for now,
        which is enough to demo the shape of the workflow without introducing backend storage.
      </p>

      <section className="sectionStack" style={{ marginTop: 24 }}>
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

      <section className="sectionStack" style={{ marginTop: 32 }}>
        <h2>Linked clients</h2>
        {state.links.length === 0 ? (
          <p>No clients linked yet.</p>
        ) : (
          <ul data-testid="linked-clients-list" style={{ display: 'grid', gap: 12, paddingLeft: 20 }}>
            {state.links.map((client) => (
              <li key={client.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 18, background: 'var(--surface-2)' }}>
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

      <section className="sectionStack" style={{ marginTop: 32 }}>
        <h2>Audit trail</h2>
        <ul data-testid="assignment-audit-trail" style={{ display: 'grid', gap: 8, paddingLeft: 20 }}>
          {state.auditTrail.map((event) => (
            <li key={event.id}>
              <strong>{event.kind}</strong> at {formatUtcTimestamp(event.at)}: {event.detail}
            </li>
          ))}
        </ul>
      </section>

      <section className="heroPanel" style={{ marginTop: 32 }}>
        <h2>Try the client join flow</h2>
        <p>
          <a href="/provider/join" className="actionLink secondary">Open the client code entry page</a>
        </p>
      </section>

      <ProviderNav className="sectionStack" style={{ marginTop: 32 }} />
    </main>
  );
}
