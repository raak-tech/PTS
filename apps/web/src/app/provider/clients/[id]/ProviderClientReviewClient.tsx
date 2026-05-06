"use client";

import Link from 'next/link';
import { useState } from 'react';

import { ProviderNav } from '../../../../components/ProviderNav';

export type ClientReviewData = {
  name: string;
  program: string;
  status: string;
  adherence: string;
  summary: string;
  safety: string;
  intakeSummary: string;
  currentPlan: string;
  weeklyCheckIn: string;
  dailyAdherence: string;
  redFlagStatus: string;
};

type ReviewArtifact = {
  reviewedAt: string;
  status: 'continue' | 'adjusted' | 'escalated';
  planChanged: boolean;
  escalated: boolean;
};

type Props = {
  client: ClientReviewData;
};

export function ProviderClientReviewClient({ client }: Props) {
  const [artifact, setArtifact] = useState<ReviewArtifact | null>(null);

  function saveArtifact(status: ReviewArtifact['status'], planChanged: boolean, escalated: boolean) {
    setArtifact({
      reviewedAt: new Date().toISOString(),
      status,
      planChanged,
      escalated,
    });
  }

  return (
    <main className="pageShell" style={{ maxWidth: 900 }}>
      <p>
        <Link href="/provider/clients" className="actionLink secondary">
          ← Back to clients
        </Link>
      </p>

      <h1>{client.name}</h1>

      <p style={{ maxWidth: 720 }}>
        Mock-only client detail page for the provider shell. It shows a conservative
        review snapshot without acting like a live patient chart.
      </p>

      <section className="heroPanel" style={{ marginTop: 24 }}>
        <h2>Intake summary</h2>
        <p style={{ maxWidth: 720 }}>{client.intakeSummary}</p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Current plan</h2>
        <p style={{ maxWidth: 720 }}>{client.currentPlan}</p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Weekly check-in snapshot</h2>
        <p style={{ maxWidth: 720 }}>{client.weeklyCheckIn}</p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Daily adherence snapshot</h2>
        <p style={{ maxWidth: 720 }}>{client.dailyAdherence}</p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Red-flags status</h2>
        <p style={{ maxWidth: 720 }}>{client.redFlagStatus}</p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Snapshot</h2>
        <ul>
          <li><strong>Program:</strong> {client.program}</li>
          <li><strong>Status:</strong> {client.status}</li>
          <li><strong>Adherence:</strong> {client.adherence}</li>
        </ul>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Provider note</h2>
        <p style={{ maxWidth: 720 }}>{client.summary}</p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Safety and follow-up</h2>
        <p style={{ maxWidth: 720 }}>{client.safety}</p>
      </section>

      <section className="heroPanel" style={{ marginTop: 32 }}>
        <h2>Weekly review panel</h2>
        <p style={{ maxWidth: 720 }}>
          Choose a conservative review outcome. The panel records a simple review
          artifact with a timestamp, status, plan-changed flag, and escalation flag.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" onClick={() => saveArtifact('continue', false, false)}>
            Continue
          </button>
          <button type="button" onClick={() => saveArtifact('adjusted', true, false)}>
            Adjust
          </button>
          <button type="button" onClick={() => saveArtifact('escalated', false, true)}>
            Escalate
          </button>
        </div>

        <p style={{ marginTop: 12, maxWidth: 720 }}>
          This sample panel is local-only and does not save any live patient data.
        </p>
      </section>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Saved review artifact</h2>
        {artifact ? (
          <div>
            <p role="status" className="statusBanner" style={{ marginTop: 0 }}>
              Saved review artifact.
            </p>
            <ul>
              <li><strong>Reviewed at:</strong> {artifact.reviewedAt}</li>
              <li><strong>Status:</strong> {artifact.status}</li>
              <li><strong>Plan changed:</strong> {artifact.planChanged ? 'yes' : 'no'}</li>
              <li><strong>Escalation:</strong> {artifact.escalated ? 'yes' : 'no'}</li>
            </ul>
          </div>
        ) : (
          <p>No review artifact saved yet.</p>
        )}
      </section>

      <ProviderNav className="sectionStack" style={{ marginTop: 32 }} />
    </main>
  );
}
