'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ResolvedNote = {
  id: string;
  clientId: string;
  clientName: string;
  body: string;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
};

/**
 * Recently addressed admin notes — completed actions on Caseload.
 * Click expands original note + counselor response; deep-links into Chart Notes.
 */
export function AddressedNotesPanel() {
  const [notes, setNotes] = useState<ResolvedNote[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/provider/client-notes?includeResolved=1', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error('failed');
        return r.json() as Promise<{ resolvedNotes?: ResolvedNote[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        const list = data.resolvedNotes ?? [];
        setNotes(list);
        setStatus(list.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading' || status === 'empty' || status === 'unavailable') {
    return null;
  }

  return (
    <section className="provider-panel" style={{ marginBottom: 20 }}>
      <h2 style={{ margin: '0 0 4px' }}>Recently addressed</h2>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>
        Completed admin notes — open to see the original flag and your response.
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {notes.map((note) => {
          const open = expandedId === note.id;
          return (
            <div
              key={note.id}
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                overflow: 'hidden',
                background: 'var(--surface)',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : note.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  border: 'none',
                  padding: '12px 14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <span className="provider-tag provider-tag--ok" style={{ marginRight: 8 }}>
                      Addressed
                    </span>
                    <strong style={{ fontSize: 14 }}>{note.clientName}</strong>
                    <div style={{ fontSize: 13, marginTop: 6, color: 'var(--foreground-secondary)' }}>
                      {note.body.length > 100 ? `${note.body.slice(0, 97)}…` : note.body}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {note.resolvedAt
                        ? `Completed ${new Date(note.resolvedAt).toLocaleString()}`
                        : 'Completed'}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{open ? 'Hide' : 'View'}</span>
                </div>
              </button>
              {open ? (
                <div
                  style={{
                    padding: '0 14px 14px',
                    borderTop: '1px solid var(--border-light)',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                      Admin note
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{note.body}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                      Your response
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                      {note.resolutionNote?.trim() || (
                        <em style={{ color: 'var(--muted)' }}>No response text recorded.</em>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/provider/clients/${note.clientId}?tab=notes#addressed-notes`}
                    className="actionLink secondary"
                    style={{ justifySelf: 'start' }}
                  >
                    Open in chart →
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
