"use client";

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import {
  createDefaultAssignmentState,
  formatUtcTimestamp,
  readAssignmentStateSnapshot,
  subscribeToAssignmentStateChange,
  type ProviderAssignmentState,
} from '../../lib/provider-assignment';

function parseAssignmentState(snapshot: string): ProviderAssignmentState {
  try {
    return JSON.parse(snapshot) as ProviderAssignmentState;
  } catch {
    return createDefaultAssignmentState();
  }
}

export function ProviderLinkedClientsPanel() {
  const snapshot = useSyncExternalStore(
    subscribeToAssignmentStateChange,
    readAssignmentStateSnapshot,
    () => JSON.stringify(createDefaultAssignmentState())
  );
  const state = parseAssignmentState(snapshot);

  return (
    <section className="sectionStack" style={{ marginTop: 32 }}>
      <h2>Linked client access</h2>
      {state.links.length === 0 ? (
        <p>No clients linked yet. Unassigned clients stay inaccessible until a valid invite code is used.</p>
      ) : (
        <ul data-testid="linked-provider-clients" style={{ display: 'grid', gap: 12, paddingLeft: 20 }}>
          {state.links.map((client) => (
            <li key={client.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 18, background: 'var(--surface-2)' }}>
              <strong>{client.clientName}</strong>
              <div>Linked by invite code at {formatUtcTimestamp(client.linkedAt)}</div>
              <div style={{ marginTop: 8 }}>
                <Link href="/provider/assignments" className="actionLink secondary">
                  Review assignment trail
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
