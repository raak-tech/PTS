'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type QueuePlan = {
  id: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  counselorNotes: string | null;
  pendingWeeksLabel?: string;
  intake: { hasRedFlags: boolean } | null;
};

type QueueData = {
  pendingPlans: QueuePlan[];
  unreadMessages: { clientId: string; clientName: string; count: number }[];
  clients: {
    id: string;
    name: string;
    planStatus: string;
    hasRedFlag: boolean;
    unreadCount: number;
  }[];
  redFlags: number;
};

type PendingIntake = {
  userId: string;
  anonEmail: string;
  painSource: string;
  submittedAt: string;
  hasRedFlags: boolean;
  isSafe: boolean;
};

type EngagementClient = {
  clientId: string;
  name: string;
  reinforcementRecordedToday: boolean;
  reinforcementPendingCount?: number;
  calendarBlocksDone: number;
  calendarBlocksTotal: number;
  holisticDone: number;
  holisticTotal: number;
  needsAttention: boolean;
};

type AdminNote = {
  id: string;
  clientId: string;
  clientName: string;
  body: string;
  createdAt: string;
};

export function ProviderQueueClient() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [intakes, setIntakes] = useState<PendingIntake[]>([]);
  const [engagement, setEngagement] = useState<EngagementClient[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [resolvingNote, setResolvingNote] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [queueRes, intakesRes, engagementRes, notesRes] = await Promise.all([
        fetch('/api/provider/queue', { credentials: 'include' }),
        fetch('/api/provider/pending-intakes', { credentials: 'include' }),
        fetch('/api/provider/engagement', { credentials: 'include' }),
        fetch('/api/provider/client-notes', { credentials: 'include' }),
      ]);
      const [queueData, intakesData, engagementData, notesData] = await Promise.all([
        queueRes.json(),
        intakesRes.json(),
        engagementRes.json(),
        notesRes.json(),
      ]);
      if (queueRes.ok) setQueue(queueData as QueueData);
      if (intakesRes.ok) setIntakes((intakesData.pendingIntakes as PendingIntake[]) ?? []);
      if (engagementRes.ok) setEngagement((engagementData.clients as EngagementClient[]) ?? []);
      if (notesRes.ok) setAdminNotes((notesData.notes as AdminNote[]) ?? []);
      if (!queueRes.ok) setError('Could not load queue');
    } catch {
      setError('Network error loading queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const onResolveNote = async (note: AdminNote) => {
    setResolvingNote(note.id);
    try {
      const res = await fetch(`/api/provider/clients/${note.clientId}/notes/${note.id}/resolve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setAdminNotes((prev) => prev.filter((n) => n.id !== note.id));
      }
    } finally {
      setResolvingNote(null);
    }
  };

  const onGeneratePlan = async (userId: string) => {
    setGenerating(userId);
    try {
      const res = await fetch('/api/provider/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (!data.ok) {
        setError(data.reason ?? 'Plan generation failed');
        return;
      }
      await load();
    } catch {
      setError('Error generating plan');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--muted)' }}>Loading your queue…</p>;
  }

  if (error && !queue) {
    return (
      <p role="alert" style={{ color: 'var(--danger)' }}>
        {error}
      </p>
    );
  }

  const pendingPlans = queue?.pendingPlans ?? [];
  const unread = queue?.unreadMessages ?? [];
  const redFlags = queue?.redFlags ?? 0;
  const crisisPlans = pendingPlans.filter((p) => (p.counselorNotes ?? '').includes('CRISIS'));
  const urgentIntakes = intakes.filter((i) => i.hasRedFlags);
  const attentionEngagement = engagement.filter((c) => c.needsAttention);

  const hasUrgent =
    redFlags > 0 ||
    crisisPlans.length > 0 ||
    urgentIntakes.length > 0 ||
    attentionEngagement.length > 0 ||
    adminNotes.length > 0;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {error ? (
        <p role="status" style={{ color: 'var(--warning)', margin: 0 }}>
          {error}
        </p>
      ) : null}

      {hasUrgent ? (
        <section className="provider-panel provider-panel--urgent">
          <h2>Needs you now</h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {redFlags > 0 ? (
              <li>
                <span className="provider-tag provider-tag--danger">Safety</span>{' '}
                {redFlags} intake{redFlags !== 1 ? 's' : ''} flagged for review
              </li>
            ) : null}
            {crisisPlans.map((p) => (
              <li key={p.id}>
                <span className="provider-tag provider-tag--danger">Crisis note</span>{' '}
                {p.clientName} —{' '}
                <Link href="/provider/plans">Review plan</Link>
              </li>
            ))}
            {urgentIntakes.map((i) => (
              <li key={i.userId}>
                <span className="provider-tag provider-tag--danger">New intake</span>{' '}
                {i.anonEmail} — {i.painSource}
              </li>
            ))}
            {attentionEngagement.map((c) => (
              <li key={c.clientId}>
                <span className="provider-tag provider-tag--warn">Today</span>{' '}
                {c.name} — engagement needs follow-up{' '}
                <Link href={`/provider/clients/${c.clientId}`}>Open client</Link>
              </li>
            ))}
            {adminNotes.map((n) => (
              <li key={n.id}>
                <span className="provider-tag provider-tag--warn">Admin note</span>{' '}
                {n.clientName} — {n.body}{' '}
                <Link href={`/provider/clients/${n.clientId}`}>Open client</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {adminNotes.length > 0 ? (
        <section className="provider-panel provider-panel--attention">
          <h2>Admin notes ({adminNotes.length})</h2>
          {adminNotes.map((note) => (
            <div key={note.id} className="provider-queue-item">
              <div>
                <div style={{ fontWeight: 700 }}>{note.clientName}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--foreground-secondary)', marginTop: 4 }}>
                  {note.body}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 4 }}>
                  Flagged {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                type="button"
                disabled={resolvingNote === note.id}
                onClick={() => void onResolveNote(note)}
              >
                {resolvingNote === note.id ? 'Marking…' : 'Mark addressed'}
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {intakes.length > 0 ? (
        <section className="provider-panel provider-panel--attention">
          <h2>Pending intakes ({intakes.length})</h2>
          {intakes.map((intake) => (
            <div key={intake.userId} className="provider-queue-item">
              <div>
                <div style={{ fontWeight: 700 }}>{intake.anonEmail}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 4 }}>
                  {intake.painSource} · {new Date(intake.submittedAt).toLocaleDateString()}
                </div>
                {intake.hasRedFlags ? (
                  <span className="provider-tag provider-tag--danger" style={{ marginTop: 8 }}>
                    Red flags
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                disabled={generating === intake.userId}
                onClick={() => void onGeneratePlan(intake.userId)}
              >
                {generating === intake.userId ? 'Generating…' : 'Generate plan'}
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {pendingPlans.length > 0 ? (
        <section className="provider-panel">
          <h2>Plans to review ({pendingPlans.length})</h2>
          {pendingPlans.map((plan) => (
            <div key={plan.id} className="provider-queue-item">
              <div>
                <div style={{ fontWeight: 700 }}>{plan.clientName}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 4 }}>
                  {plan.pendingWeeksLabel ?? 'Draft'} · {new Date(plan.createdAt).toLocaleDateString()}
                </div>
                {plan.intake?.hasRedFlags ? (
                  <span className="provider-tag provider-tag--danger" style={{ marginTop: 8 }}>
                    Red flags in intake
                  </span>
                ) : null}
              </div>
              <Link href={`/provider/plans?highlight=${plan.id}`} className="actionLink secondary">
                Review →
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {unread.length > 0 ? (
        <section className="provider-panel">
          <h2>Unread messages</h2>
          {unread.map((row) => (
            <div key={row.clientId} className="provider-queue-item">
              <div style={{ fontWeight: 600 }}>
                {row.clientName}{' '}
                <span className="provider-tag provider-tag--warn">{row.count} new</span>
              </div>
              <Link href={`/provider/messages?with=${row.clientId}`} className="actionLink secondary">
                Open →
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {engagement.length > 0 ? (
        <section className="provider-panel">
          <h2>Today&apos;s engagement</h2>
          {engagement.map((c) => (
            <div key={c.clientId} className="provider-queue-item">
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 4 }}>
                  Read-out:{' '}
                  {c.reinforcementRecordedToday ? (
                    <span className="provider-tag provider-tag--ok">Done</span>
                  ) : (
                    <span className="provider-tag provider-tag--warn">Pending</span>
                  )}{' '}
                  · Calendar {c.calendarBlocksDone}/{c.calendarBlocksTotal} · Holistic{' '}
                  {c.holisticDone}/{c.holisticTotal}
                </div>
              </div>
              <Link href={`/provider/clients/${c.clientId}`} className="actionLink secondary">
                Client →
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {(queue?.clients.length ?? 0) > 0 ? (
        <section className="provider-panel">
          <h2>All clients</h2>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Link href="/provider/clients" className="actionLink secondary">
              Full list →
            </Link>
          </div>
          {(queue?.clients ?? []).slice(0, 8).map((client) => (
            <div key={client.id} className="provider-queue-item">
              <div>
                <div style={{ fontWeight: 600 }}>{client.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 4 }}>
                  Plan: {client.planStatus}
                  {client.unreadCount > 0 ? ` · ${client.unreadCount} unread` : ''}
                </div>
              </div>
              <Link href={`/provider/clients/${client.id}`} className="actionLink secondary">
                Open →
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {!hasUrgent &&
      intakes.length === 0 &&
      pendingPlans.length === 0 &&
      unread.length === 0 &&
      engagement.length === 0 ? (
        <section className="provider-panel">
          <h2>All caught up</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            No pending intakes, plan reviews, or unread messages right now.
          </p>
        </section>
      ) : null}
    </div>
  );
}
