'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { SCRIPT_TAGS, type FormulationTag } from '@/lib/pain-script/tags';
import type { StoredFormulation } from '@/lib/pain-script/formulation-store';
import { ApprovedFormulationSnapshot, RescoreReviewPanel } from '@/components/provider/RescoreReviewPanel';

export function FormulationReviewClient({
  userId,
  clientEmail,
}: {
  userId: string;
  clientEmail: string;
}) {
  const [data, setData] = useState<StoredFormulation | null>(null);
  const [approvedFormulation, setApprovedFormulation] = useState<StoredFormulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/provider/formulations/${userId}`, { credentials: 'include' });
      const json = (await res.json()) as {
        formulation?: StoredFormulation;
        approvedFormulation?: StoredFormulation | null;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? 'load_failed');
      setData(json.formulation ?? null);
      setApprovedFormulation(json.approvedFormulation ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/provider/formulations/${userId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('approve_failed');
      await load();
    } catch {
      setError('Could not approve formulation');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/provider/formulations/${userId}/regenerate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('regen_failed');
      await load();
    } catch {
      setError('Could not regenerate formulation');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p style={{ padding: 24 }}>Loading formulation…</p>;
  if (error && !data) return <p style={{ padding: 24, color: '#b71c1c' }}>{error}</p>;
  if (!data) return <p style={{ padding: 24 }}>No formulation yet.</p>;

  const f = data.formulation;
  const tagLabel = (t: FormulationTag) => SCRIPT_TAGS[t as keyof typeof SCRIPT_TAGS] ?? t;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>
        <Link href="/provider/clients">← Caseload</Link>
      </p>
      <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>Formulation review</h1>
      <p style={{ margin: '0 0 20px', color: '#444' }}>
        {clientEmail} · v{data.version} · <strong>{data.status}</strong>
        {data.source === 'rescore' ? (
          <span style={{ marginLeft: 8, background: '#fff8e1', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
            Weekly rescore
          </span>
        ) : null}
        {data.safetyFlag ? (
          <span style={{ marginLeft: 8, color: '#b71c1c', fontWeight: 700 }}>⚠ Safety flag</span>
        ) : null}
      </p>

      <div style={{ background: '#fce4ec', border: '2px solid #f48fb1', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 12, color: '#880e4f' }}>
        CONFIDENTIAL / PROTECTED IP — RAak Pain Script System. Counselor eyes only.
      </div>

      {data.source === 'rescore' && data.rescoreResult ? (
        <>
          <RescoreReviewPanel
            rescore={data.rescoreResult}
            approvedVersion={approvedFormulation?.version}
          />
          {approvedFormulation ? (
            <ApprovedFormulationSnapshot approved={approvedFormulation} />
          ) : null}
        </>
      ) : null}

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16 }}>Maintenance hypothesis</h2>
        <p style={{ lineHeight: 1.6 }}>{f.maintenanceHypothesis}</p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16 }}>Primary targets</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {f.primaryTargets.map((t) => (
            <span key={t} title={tagLabel(t)} style={{ background: '#e8f5e9', padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              {t}
            </span>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16 }}>Script beliefs</h2>
        {(['self', 'others', 'life'] as const).map((key) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <strong>{key}</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {f.scriptBeliefs[key].map((b, i) => (
                <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                  {b.statement}
                  {b.evidence ? <em style={{ display: 'block', color: '#666', fontSize: 12 }}>Evidence: {b.evidence}</em> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16 }}>BASIC I.D.</h2>
        {Object.entries(f.basicId).map(([domain, d]) => (
          <p key={domain} style={{ fontSize: 14, margin: '0 0 8px' }}>
            <strong>{domain}:</strong> {d.present ? d.summary : '— explore with client'}
          </p>
        ))}
      </section>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={busy || data.status === 'approved'}
          onClick={() => void approve()}
          style={{ padding: '10px 18px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          Approve formulation
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void regenerate()}
          style={{ padding: '10px 18px', background: '#fff', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer' }}
        >
          Regenerate (Stage 1)
        </button>
        {data.status === 'approved' ? (
          <Link
            href="/provider/clients?filter=plans"
            style={{ padding: '10px 18px', background: '#111', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
          >
            Generate Week 1 from plans queue →
          </Link>
        ) : null}
      </div>
      {error ? <p style={{ marginTop: 12, color: '#b71c1c' }}>{error}</p> : null}
    </div>
  );
}
