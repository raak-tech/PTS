"use client";

import { useState } from 'react';

type ConsentState = {
  providerAccessEnabled: boolean;
  reflectionsEnabled: boolean;
  redFlagsStorageEnabled: boolean;
  reflectionEncryptionEnabled: boolean;
  reflectionSalt: string | null;
};

type Props = {
  initialConsent: ConsentState;
};

export function SupportControls({ initialConsent }: Props) {
  const [consent, setConsent] = useState(initialConsent);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function updateConsent(nextConsent: Partial<ConsentState>) {
    setBusy(true);
    setStatus('');
    const previous = consent;
    const optimistic = { ...consent, ...nextConsent };
    setConsent(optimistic);

    try {
      const response = await fetch('/api/support/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConsent),
      });

      if (!response.ok) {
        throw new Error('Unable to update consent.');
      }

      const data = (await response.json()) as ConsentState & { ok: boolean };
      setConsent({
        providerAccessEnabled: Boolean(data.providerAccessEnabled),
        reflectionsEnabled: Boolean(data.reflectionsEnabled),
        redFlagsStorageEnabled: Boolean(data.redFlagsStorageEnabled),
        reflectionEncryptionEnabled: Boolean(data.reflectionEncryptionEnabled),
        reflectionSalt: data.reflectionSalt ?? null,
      });
      setStatus('Consent updated.');
    } catch {
      setConsent(previous);
      setStatus('Unable to update consent right now.');
    } finally {
      setBusy(false);
    }
  }

  async function revokeAll() {
    await updateConsent({
      providerAccessEnabled: false,
      reflectionsEnabled: false,
      redFlagsStorageEnabled: false,
      reflectionEncryptionEnabled: false,
    });
    setStatus('Consent revoked. Future storage is stopped.');
  }

  return (
    <section style={{ marginTop: 24, display: 'grid', gap: 12 }}>
      <h2>Support storage</h2>
      <p style={{ maxWidth: 720 }}>
        These controls are separate on purpose. Choose what PTS may store, and revoke
        any permission at any time to stop future storage immediately.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={consent.providerAccessEnabled}
            onChange={(e) => void updateConsent({ providerAccessEnabled: e.target.checked })}
            disabled={busy}
          />
          Store provider-visible support records
        </label>
        <p style={{ margin: 0, fontSize: 13, color: '#555', maxWidth: 720 }}>
          Stores intake summaries, week plans, and weekly check-in snapshots for the account.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={consent.reflectionsEnabled}
            onChange={(e) => void updateConsent({ reflectionsEnabled: e.target.checked })}
            disabled={busy}
          />
          Store reflections and free-text notes
        </label>
        <p style={{ margin: 0, fontSize: 13, color: '#555', maxWidth: 720 }}>
          Stores optional daily reflections and weekly free-text check-ins. If encryption is
          enabled, the text is encrypted before save.
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={consent.redFlagsStorageEnabled}
            onChange={(e) => void updateConsent({ redFlagsStorageEnabled: e.target.checked })}
            disabled={busy}
          />
          Store red-flags notes
        </label>
        <p style={{ margin: 0, fontSize: 13, color: '#555', maxWidth: 720 }}>
          Stores a short record when the intake flow routes to red-flags guidance.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
        <button type="button" onClick={() => void updateConsent({ providerAccessEnabled: true })} disabled={busy}>
          Enable provider access
        </button>
        <button type="button" onClick={() => void updateConsent({ reflectionsEnabled: true })} disabled={busy}>
          Enable reflections
        </button>
        <button type="button" onClick={() => void updateConsent({ redFlagsStorageEnabled: true })} disabled={busy}>
          Enable red-flags storage
        </button>
        <button type="button" onClick={() => void revokeAll()} disabled={busy}>
          Revoke all
        </button>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
        Provider access: <strong>{consent.providerAccessEnabled ? 'on' : 'off'}</strong> ·
        Reflections/free-text: <strong>{consent.reflectionsEnabled ? 'on' : 'off'}</strong> ·
        Red-flags notes: <strong>{consent.redFlagsStorageEnabled ? 'on' : 'off'}</strong>
      </p>

      <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
        {consent.reflectionEncryptionEnabled
          ? 'Reflection encryption is enabled for stored free-text.'
          : 'Reflection encryption is off.'}
      </p>

      {status ? (
        <p role="status" style={{ margin: 0, fontWeight: 600 }}>
          {status}
        </p>
      ) : null}
    </section>
  );
}
