'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

import { AdminNav } from '@/components/admin/AdminNav';
import type { MetricDetailKind } from '@/lib/admin-metric-details';

type Metrics = {
  summary: {
    totalUsers: number;
    totalClients: number;
    totalCounselors: number;
    totalIntakes: number;
    intakeCompletionRate: string;
    totalPlans: number;
    approvedPlans: number;
    pendingPlans: number;
    planApprovalRate: string;
    clientCounselorAssignments: number;
    totalMessages: number;
  };
  safety: {
    redFlags: number;
    unsafeUsers: number;
  };
  recentActivity: {
    intakes: number;
    messages: number;
  };
  observability?: {
    llmSpend30d: number;
    activeUsers7d: number;
  };
  timestamp: string;
};

type DetailRow = Record<string, string | number | boolean | null>;

type MetricDetail = {
  kind: MetricDetailKind;
  title: string;
  rows: DetailRow[];
};

type CardConfig = {
  key: MetricDetailKind;
  label: string;
  value: string | number;
  subtext?: string;
  alert?: boolean;
};

function MetricCard({
  label,
  value,
  subtext,
  alert,
  selected,
  onClick,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  alert?: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        background: alert ? '#fce4ec' : selected ? '#f5f5f5' : 'white',
        border: selected
          ? '2px solid #111'
          : alert
            ? '1.5px solid #ef9a9a'
            : '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        minWidth: 140,
        flex: '1 1 140px',
      }}
    >
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: alert ? '#b71c1c' : '#111', marginBottom: 4 }}>{value}</div>
      {subtext ? <div style={{ fontSize: 12, color: '#666' }}>{subtext}</div> : null}
      <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Click for details →</div>
    </button>
  );
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function DetailTable({ detail }: { detail: MetricDetail }) {
  if (detail.rows.length === 0) {
    return <p style={{ margin: 0, color: '#666', fontSize: 14 }}>No records yet.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <tbody>
          {detail.rows.map((row) => (
            <tr key={String(row.id)} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 8px', verticalAlign: 'top', minWidth: 140 }}>
                <strong>{String(row.label ?? row.clientLabel ?? row.from ?? '—')}</strong>
                {row.role ? (
                  <div style={{ fontSize: 12, color: '#888' }}>{String(row.role)}</div>
                ) : null}
              </td>
              <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#444' }}>
                {detail.kind === 'messages' ? (
                  <>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                      {String(row.from)} → {String(row.to)}
                    </div>
                    <div>{String(row.preview)}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      {formatWhen(row.createdAt as string)} · {row.readAt ? 'read' : 'unread'}
                    </div>
                    {row.fromUserId && row.fromUserId !== row.toUserId ? (
                      <div style={{ marginTop: 6 }}>
                        <Link href={`/admin/clients/${String(row.fromUserId)}`} style={{ fontSize: 12, marginRight: 8 }}>
                          From dossier
                        </Link>
                        <Link href={`/admin/clients/${String(row.toUserId)}`} style={{ fontSize: 12 }}>
                          To dossier
                        </Link>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {detail.kind === 'assignments' ? (
                  <>
                    <div>Counselor: {String(row.counselorLabel)}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      Assigned {formatWhen(row.assignedAt as string)}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Link href={`/admin/clients/${String(row.clientId)}`} style={{ fontSize: 13 }}>
                        Client dossier
                      </Link>
                    </div>
                  </>
                ) : null}
                {(detail.kind === 'plans' ||
                  detail.kind === 'pending-plans' ||
                  detail.kind === 'approved-plans') && (
                  <>
                    <div>
                      Status: <strong>{String(row.status)}</strong>
                      {row.pendingWeeks ? (
                        <span style={{ marginLeft: 8, color: '#555' }}>· {String(row.pendingWeeks)}</span>
                      ) : null}
                      {row.crisisNote ? (
                        <span style={{ color: '#b71c1c', marginLeft: 8 }}>CRISIS</span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      Created {formatWhen(row.createdAt as string)}
                      {row.approvedAt ? ` · Approved ${formatWhen(row.approvedAt as string)}` : ''}
                    </div>
                  </>
                )}
                {detail.kind === 'intakes' || detail.kind === 'red-flags' || detail.kind === 'unsafe' ? (
                  <>
                    <div>{String(row.painSource ?? row.painDescription ?? '')}</div>
                    {row.recoveryGoal ? (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Goal: {String(row.recoveryGoal)}</div>
                    ) : null}
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      {row.hasRedFlags ? 'Red flags · ' : ''}
                      {row.isSafe === false ? 'Unsafe · ' : ''}
                      {formatWhen(row.completedAt as string)}
                    </div>
                  </>
                ) : null}
                {(detail.kind === 'users' || detail.kind === 'clients' || detail.kind === 'counselors') && (
                  <>
                    {row.phone ? <div>{String(row.phone)}</div> : null}
                    {row.email ? <div style={{ fontSize: 12, color: '#888' }}>{String(row.email)}</div> : null}
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      Joined {formatWhen(row.createdAt as string)}
                    </div>
                  </>
                )}
              </td>
              <td style={{ padding: '10px 8px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                {row.userId || row.clientId ? (
                  <Link
                    href={`/admin/clients/${String(row.userId ?? row.clientId)}`}
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    Full dossier
                  </Link>
                ) : null}
                {detail.kind === 'pending-plans' && row.id ? (
                  <Link href={`/provider/plans?highlight=${String(row.id)}`} style={{ fontSize: 13, marginLeft: 8 }}>
                    Open chart →
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type CreateUserState = {
  phone: string;
  role: 'client' | 'provider';
  displayName: string;
  title: string;
  bio: string;
};

const initialCreateUser: CreateUserState = {
  phone: '',
  role: 'client',
  displayName: '',
  title: '',
  bio: '',
};

export function AdminDashboardClient() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createUser, setCreateUser] = useState<CreateUserState>(initialCreateUser);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricDetailKind | null>(null);
  const [detail, setDetail] = useState<MetricDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [slaBreaches, setSlaBreaches] = useState<
    { kind: string; clientLabel: string; counselorLabel?: string; ageHours: number; detail: string; clientId: string }[]
  >([]);
  const [slaLoading, setSlaLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/metrics', { credentials: 'include' });
      if (!res.ok) {
        setError('Could not load admin metrics.');
        return;
      }
      setMetrics((await res.json()) as Metrics);
    };

    void load();
    const interval = setInterval(() => void load(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void fetch('/api/admin/sla', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { breaches?: typeof slaBreaches } | null) => {
        setSlaBreaches(data?.breaches ?? []);
      })
      .finally(() => setSlaLoading(false));
  }, []);

  const loadDetail = async (kind: MetricDetailKind) => {
    setSelectedMetric(kind);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/admin/metrics?detail=${encodeURIComponent(kind)}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        setDetailError('Could not load details.');
        setDetail(null);
        return;
      }
      setDetail((await res.json()) as MetricDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: 32, fontFamily: 'inherit' }}>
        <p>{error}</p>
        <Link href="/">← Home</Link>
      </div>
    );
  }

  const onCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setCreateLoading(true);
    setCreateMessage(null);
    setCreateError(null);

    const body: Record<string, string> = {
      phone: createUser.phone,
      role: createUser.role,
      displayName: createUser.displayName.trim(),
    };
    if (createUser.role === 'provider') {
      if (createUser.title.trim()) body.title = createUser.title.trim();
      if (createUser.bio.trim()) body.bio = createUser.bio.trim();
    }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    setCreateLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        detail?: Record<string, string[] | undefined>;
        existing?: { role: string; displayName: string | null; phone: string | null };
      } | null;
      const code = data?.error ?? 'unknown';
      const messages: Record<string, string> = {
        unauthorized: 'Sign in as admin first at /login (email + password), then return to /admin.',
        invalid: 'Check all required fields. Display name needs 2+ characters; bio (if used) needs 10+ characters.',
        'invalid-phone': 'Enter a valid 10-digit Indian mobile number.',
        'duplicate-phone': 'That phone number is already registered.',
        internal: 'Could not create user. Try again.',
      };
      const fieldHint = data?.detail
        ? Object.entries(data.detail)
            .filter(([, v]) => v?.length)
            .map(([k, v]) => `${k}: ${v?.join(', ')}`)
            .join(' · ')
        : '';
      const duplicateHint = data?.existing
        ? ` Already registered as ${data.existing.role}${data.existing.displayName ? ` (${data.existing.displayName})` : ''}. They can sign in on the mobile app with OTP 123456.`
        : '';
      setCreateError(
        `${messages[code] ?? 'Could not create user.'}${duplicateHint}${fieldHint ? ` (${fieldHint})` : ''}`,
      );
      return;
    }

    const data = (await res.json()) as { user: { displayName: string; phone: string; role: string } };
    setCreateMessage(`Created ${data.user.role} ${data.user.displayName} (${data.user.phone}). They can sign in via the mobile app.`);
    setCreateUser(initialCreateUser);
    void fetch('/api/admin/metrics', { credentials: 'include' })
      .then((r) => r.json())
      .then((m) => setMetrics(m as Metrics));
  };

  if (!metrics) {
    return <div style={{ padding: 32, fontFamily: 'inherit' }}>Loading admin dashboard…</div>;
  }

  const { summary: s, safety } = metrics;

  const cards: CardConfig[] = [
    {
      key: 'users',
      label: 'Total users',
      value: s.totalUsers,
      subtext: `${s.totalClients} clients · ${s.totalCounselors} counselors`,
    },
    { key: 'intakes', label: 'Intakes completed', value: s.totalIntakes, subtext: `${s.intakeCompletionRate}% of clients` },
    {
      key: 'plans',
      label: 'Plans generated',
      value: s.totalPlans,
      subtext: `${s.approvedPlans} approved (${s.planApprovalRate}%)`,
    },
    {
      key: 'pending-plans',
      label: 'Pending plans',
      value: s.pendingPlans,
      subtext: 'Awaiting counselor review',
      alert: s.pendingPlans > 0,
    },
    {
      key: 'assignments',
      label: 'Assignments',
      value: s.clientCounselorAssignments,
      subtext: 'Client–counselor links',
    },
    { key: 'messages', label: 'Messages', value: s.totalMessages, subtext: 'All time' },
    { key: 'red-flags', label: 'Red flags', value: safety.redFlags, alert: safety.redFlags > 0 },
    { key: 'unsafe', label: 'Unsafe reports', value: safety.unsafeUsers, alert: safety.unsafeUsers > 0 },
  ];

  const obs = metrics.observability;

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>
      <AdminNav current="/admin" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Admin dashboard</h1>
          <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>
            Platform overview · updated {new Date(metrics.timestamp).toLocaleString()}
          </p>
        </div>
        <Link href="/provider/metrics" style={{ fontSize: 14, color: '#555' }}>
          Counselor metrics
        </Link>
      </div>

      {(safety.redFlags > 0 || safety.unsafeUsers > 0) && (
        <div style={{ background: '#ffebee', border: '1.5px solid #ef9a9a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <strong style={{ color: '#b71c1c' }}>Escalations require attention</strong>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#333' }}>
            {safety.redFlags} red-flag intake(s) · {safety.unsafeUsers} user(s) reported safety concerns — click those
            cards below for names and details.
          </p>
        </div>
      )}

      {obs ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Link
            href="/admin/costs"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              flex: '1 1 180px',
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 16,
              background: 'white',
            }}
          >
            <div style={{ fontSize: 12, color: '#888' }}>LLM spend (30d)</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>${obs.llmSpend30d.toFixed(4)}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>OpenRouter actual · view costs →</div>
          </Link>
          <Link
            href="/admin/analytics"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              flex: '1 1 180px',
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 16,
              background: 'white',
            }}
          >
            <div style={{ fontSize: 12, color: '#888' }}>Active users (7d)</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{obs.activeUsers7d}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Check-ins, holistic, read-outs · analytics →</div>
          </Link>
        </div>
      ) : null}

      <section style={{ marginBottom: 24, border: '1px solid #eee', borderRadius: 12, padding: 16, background: 'white' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>SLA breaches (12h)</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>
          Unanswered client messages, pending intakes without plans, and unresolved urgent admin notes.
        </p>
        {slaLoading ? (
          <p style={{ margin: 0, fontSize: 14, color: '#888' }}>Loading…</p>
        ) : slaBreaches.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: '#2e7d32' }}>No active SLA breaches.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {slaBreaches.slice(0, 20).map((b, i) => (
              <div
                key={`${b.kind}-${b.clientId}-${i}`}
                style={{ padding: '10px 12px', borderRadius: 8, background: '#fff8e1', border: '1px solid #ffe082', fontSize: 13 }}
              >
                <strong>{b.kind.replace(/_/g, ' ')}</strong> · {b.clientLabel}
                {b.counselorLabel ? ` · ${b.counselorLabel}` : ''} · {b.ageHours}h overdue
                <div style={{ color: '#666', marginTop: 4 }}>{b.detail}</div>
                <Link href={`/admin/clients/${b.clientId}`} style={{ fontSize: 12, marginTop: 6, display: 'inline-block' }}>
                  Client dossier →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        {cards.map((card) => (
          <MetricCard
            key={card.key}
            label={card.label}
            value={card.value}
            subtext={card.subtext}
            alert={card.alert}
            selected={selectedMetric === card.key}
            onClick={() => void loadDetail(card.key)}
          />
        ))}
      </div>

      {selectedMetric ? (
        <section
          style={{
            marginBottom: 24,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {detail?.title ?? 'Loading…'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedMetric(null);
                setDetail(null);
              }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#666', fontSize: 14 }}
            >
              Close
            </button>
          </div>
          {detailLoading ? (
            <p style={{ margin: 0, color: '#666' }}>Loading records…</p>
          ) : detailError ? (
            <p style={{ margin: 0, color: '#b71c1c' }}>{detailError}</p>
          ) : detail ? (
            <>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#888' }}>
                Showing {detail.rows.length} record{detail.rows.length === 1 ? '' : 's'} (most recent first)
              </p>
              <DetailTable detail={detail} />
            </>
          ) : null}
        </section>
      ) : null}

      <section
        style={{
          marginTop: 32,
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Register mobile user</h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666', lineHeight: 1.5 }}>
          Create client or counselor accounts for phone OTP sign-in. Users must be registered here before they can use the mobile app.
        </p>

        <form onSubmit={onCreateUser} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            <span>Mobile number</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              value={createUser.phone}
              onChange={(e) => setCreateUser((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              required
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            <span>Role</span>
            <select
              value={createUser.role}
              onChange={(e) => setCreateUser((prev) => ({ ...prev, role: e.target.value as CreateUserState['role'] }))}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15 }}
            >
              <option value="client">Client</option>
              <option value="provider">Counselor</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            <span>Display name</span>
            <input
              type="text"
              placeholder="Full name"
              value={createUser.displayName}
              onChange={(e) => setCreateUser((prev) => ({ ...prev, displayName: e.target.value }))}
              required
              minLength={2}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15 }}
            />
          </label>

          {createUser.role === 'provider' ? (
            <>
              <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                <span>Title (optional)</span>
                <input
                  type="text"
                  placeholder="Counselor"
                  value={createUser.title}
                  onChange={(e) => setCreateUser((prev) => ({ ...prev, title: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                <span>Bio (optional)</span>
                <textarea
                  placeholder="Optional — leave blank to use a default bio"
                  value={createUser.bio}
                  onChange={(e) => setCreateUser((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, resize: 'vertical' }}
                />
              </label>
            </>
          ) : null}

          <button
            type="submit"
            disabled={createLoading || createUser.phone.length !== 10 || createUser.displayName.trim().length < 2}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#111',
              color: '#FBBF24',
              fontWeight: 700,
              fontSize: 15,
              cursor: createLoading ? 'wait' : 'pointer',
              opacity: createLoading ? 0.7 : 1,
            }}
          >
            {createLoading ? 'Creating…' : 'Create user'}
          </button>
        </form>

        {createMessage ? <p style={{ margin: '12px 0 0', fontSize: 14, color: '#1b5e20' }}>{createMessage}</p> : null}
        {createError ? <p style={{ margin: '12px 0 0', fontSize: 14, color: '#b71c1c' }}>{createError}</p> : null}
      </section>

      <p style={{ fontSize: 13, color: '#888', marginTop: 24 }}>
        Admin access uses <strong>email sign-in</strong> at <Link href="/login?next=/admin">/login</Link> (not phone OTP).
        Your account needs <code>role=admin</code> or <code>ADMIN_EMAILS</code> on Vercel.
      </p>
    </div>
  );
}
