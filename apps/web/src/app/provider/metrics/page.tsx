'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

function MetricCard({ label, value, subtext, alert }: any) {
  return (
    <div style={{
      background: alert ? '#fce4ec' : 'white',
      border: alert ? '1.5px solid #ef9a9a' : '1px solid #eee',
      borderRadius: 12,
      padding: '16px',
      minWidth: '140px',
    }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: alert ? '#b71c1c' : '#111', marginBottom: 4 }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: '12px', color: '#666' }}>{subtext}</div>}
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
        const data = await res.json() as Metrics;
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Loading metrics...
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#b00020' }}>
        {error || 'Failed to load metrics'}
      </div>
    );
  }

  const m = metrics.summary;
  const safety = metrics.safety;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #eee', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Pilot Metrics</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
            Updated: {new Date(metrics.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <Link href="/provider" style={{ fontSize: 14, color: '#111', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to dashboard
        </Link>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Safety Alerts */}
          {(safety.redFlags > 0 || safety.unsafeUsers > 0) && (
            <div style={{ marginBottom: 24, background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#856404' }}>⚠️ Safety Alerts</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {safety.redFlags > 0 && (
                  <div>
                    <strong>{safety.redFlags}</strong> client(s) flagged red flags in intake — review immediately
                  </div>
                )}
                {safety.unsafeUsers > 0 && (
                  <div>
                    <strong>{safety.unsafeUsers}</strong> client(s) reported feeling unsafe — priority counselor outreach
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Metrics */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#888' }}>PARTICIPANTS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <MetricCard label="Registered Users" value={m.totalUsers} />
              <MetricCard label="Clients" value={m.totalClients} />
              <MetricCard label="Counselors" value={m.totalCounselors} />
              <MetricCard label="Assigned" value={m.clientCounselorAssignments} subtext={`of ${m.totalClients}`} />
            </div>
          </div>

          {/* Intake Metrics */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#888' }}>INTAKE & ACTIVATION</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <MetricCard label="Intakes Completed" value={m.totalIntakes} subtext={`${m.intakeCompletionRate}% of clients`} />
            </div>
          </div>

          {/* Plan Metrics */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#888' }}>PLAN GENERATION & APPROVAL</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <MetricCard label="Plans Generated" value={m.totalPlans} />
              <MetricCard label="Plans Approved" value={m.approvedPlans} subtext={`${m.planApprovalRate}% approval rate`} />
              <MetricCard label="Pending Review" value={m.pendingPlans} alert={m.pendingPlans > 2} />
            </div>
          </div>

          {/* Engagement Metrics */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#888' }}>ENGAGEMENT</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <MetricCard label="Total Messages" value={m.totalMessages} subtext={`${m.totalMessages > 0 ? 'active' : 'no activity yet'}`} />
            </div>
          </div>

          {/* Reference Info */}
          <div style={{ background: 'white', borderRadius: 12, padding: '16px', marginTop: 24, fontSize: '12px', color: '#666' }}>
            <strong>How to read this:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li><strong>Intake Completion Rate:</strong> Should be 60%+ for healthy product</li>
              <li><strong>Plan Approval Rate:</strong> Should be 80%+ (low = quality/scope issue)</li>
              <li><strong>Pending Plans:</strong> Should be 0 (counselors reviewing plans)</li>
              <li><strong>Safety Alerts:</strong> Immediate action required</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
