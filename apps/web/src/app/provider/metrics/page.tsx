'use client';

import { useEffect, useState } from 'react';

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
  timestamp: string;
};

function MetricCard({
  label,
  value,
  subtext,
  alert,
}: {
  label: string;
  value: number;
  subtext?: string;
  alert?: boolean;
}) {
  return (
    <div
      className="provider-panel"
      style={{
        minWidth: 140,
        padding: 16,
        borderColor: alert ? 'rgba(232, 165, 152, 0.55)' : undefined,
        background: alert ? 'var(--danger-bg)' : undefined,
      }}
    >
      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: alert ? 'var(--danger)' : 'var(--foreground)',
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      {subtext ? <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{subtext}</div> : null}
    </div>
  );
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/provider/metrics');
        if (!res.ok) throw new Error('Failed to load metrics');
        const data = (await res.json()) as Metrics;
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    void load();
    const interval = setInterval(() => void load(), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--muted)' }}>Loading metrics…</p>;
  }

  if (error || !metrics) {
    return <p style={{ color: 'var(--danger)' }}>{error || 'Failed to load metrics'}</p>;
  }

  const m = metrics.summary;
  const safety = metrics.safety;

  return (
    <>
      <h1 className="provider-page-title">Pilot metrics</h1>
      <p className="provider-page-subtitle">
        Updated {new Date(metrics.timestamp).toLocaleTimeString()}
      </p>

      {(safety.redFlags > 0 || safety.unsafeUsers > 0) && (
        <section className="provider-panel provider-panel--urgent" style={{ marginBottom: 16 }}>
          <h2>Safety alerts</h2>
          {safety.redFlags > 0 ? (
            <p style={{ margin: '0 0 8px' }}>
              <strong>{safety.redFlags}</strong> client(s) flagged red flags in intake — review immediately
            </p>
          ) : null}
          {safety.unsafeUsers > 0 ? (
            <p style={{ margin: 0 }}>
              <strong>{safety.unsafeUsers}</strong> client(s) reported feeling unsafe — priority outreach
            </p>
          ) : null}
        </section>
      )}

      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)' }}>Participants</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <MetricCard label="Registered users" value={m.totalUsers} />
        <MetricCard label="Clients" value={m.totalClients} />
        <MetricCard label="Counselors" value={m.totalCounselors} />
        <MetricCard label="Assigned" value={m.clientCounselorAssignments} subtext={`of ${m.totalClients}`} />
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)' }}>Intake & activation</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="Intakes completed"
          value={m.totalIntakes}
          subtext={`${m.intakeCompletionRate}% of clients`}
        />
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)' }}>
        Plan generation & approval
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <MetricCard label="Plans generated" value={m.totalPlans} />
        <MetricCard
          label="Plans approved"
          value={m.approvedPlans}
          subtext={`${m.planApprovalRate}% approval rate`}
        />
        <MetricCard label="Pending review" value={m.pendingPlans} alert={m.pendingPlans > 2} />
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--muted)' }}>Engagement</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="Total messages"
          value={m.totalMessages}
          subtext={m.totalMessages > 0 ? 'active' : 'no activity yet'}
        />
      </div>

      <section className="provider-panel" style={{ fontSize: '12px', color: 'var(--muted)' }}>
        <strong style={{ color: 'var(--foreground-secondary)' }}>How to read this</strong>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li>Intake completion rate should be 60%+ for healthy product</li>
          <li>Plan approval rate should be 80%+ (low = quality/scope issue)</li>
          <li>Pending plans should be 0 when counselors are keeping up</li>
          <li>Safety alerts require immediate action</li>
        </ul>
      </section>
    </>
  );
}
