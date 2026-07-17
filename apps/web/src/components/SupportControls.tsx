"use client";

import { useState } from 'react';

type Props = {
  initialEnabled: boolean;
};

export function SupportControls({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function updateConsent(nextEnabled: boolean) {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/support/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });

      if (!response.ok) {
        throw new Error('Unable to update consent.');
      }

      setEnabled(nextEnabled);
      setStatus(nextEnabled ? 'Consent saved.' : 'Consent revoked.');
    } catch {
      setStatus('Unable to update consent right now.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAll() {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/support/delete', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Unable to delete data.');
      }
      setEnabled(false);
      setStatus('Account deleted. Sign in again if you want to start over.');
      window.location.href = '/login';
    } catch {
      setStatus('Unable to delete account right now.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ marginTop: 24, display: 'grid', gap: 12 }}>
      <h2>Support storage</h2>
      <p style={{ maxWidth: 720 }}>
        Storage is off until you consent. When enabled, PTS can save intake
        summaries, plan snapshots, daily completion events, and weekly check-ins for
        your account.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => updateConsent(e.target.checked)}
          disabled={busy}
        />
        Save my support data on this account
      </label>

      <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
        {enabled ? 'Consent is currently enabled.' : 'Consent is currently off.'}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button type="button" onClick={() => void updateConsent(true)} disabled={busy}>
          Enable consent
        </button>
        <button type="button" onClick={() => void updateConsent(false)} disabled={busy}>
          Revoke consent
        </button>
        <button type="button" onClick={() => void deleteAll()} disabled={busy}>
          Delete my account
        </button>
      </div>

      {status ? (
        <p role="status" style={{ margin: 0, fontWeight: 600 }}>
          {status}
        </p>
      ) : null}
    </section>
  );
}
