"use client";

import { useMemo, useState } from "react";

import { Guardrails } from "../../components/Guardrails";
import { ProgramNav } from "../../components/ProgramNav";

type Prompt = {
  id: string;
  question: string;
};

export default function WeeklyCheckInPage() {
  const prompts: Prompt[] = useMemo(
    () => [
      { id: "q1", question: "What did you do most days this week?" },
      { id: "q2", question: "What felt easier vs harder?" },
      { id: "q3", question: "What is one small adjustment you will try next week?" },
    ],
    []
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  const totalCount = prompts.length;
  const completedCount = prompts.reduce(
    (acc, p) => acc + (answers[p.id]?.trim() ? 1 : 0),
    0
  );

  return (
    <main className="pageShell" style={{ maxWidth: 800 }}>
      <h1>Weekly Check-in</h1>

      <p style={{ maxWidth: 680 }}>
        Local-only: your answers stay in this browser session only (no storage, no
        syncing).
      </p>

      <p className="statusBanner" style={{ marginTop: 8 }}>
        <strong>Progress:</strong> {completedCount}/{totalCount}
      </p>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Prompts</h2>

        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setStatus('');
            }}
          >
            Reset answers
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {prompts.map((p) => {
            const id = `weekly-${p.id}`;
            return (
              <div key={p.id} style={{ display: "grid", gap: 6 }}>
                <label htmlFor={id} style={{ fontWeight: 600 }}>
                  {p.question}
                </label>
                <textarea
                  id={id}
                  name={p.id}
                  rows={3}
                  value={answers[p.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={async () => {
            setStatus('');
            const response = await fetch('/api/support/artifacts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kind: 'check-in',
                title: 'Weekly check-in',
                bodyText: prompts
                  .map((prompt) => `${prompt.question}\n${answers[prompt.id]?.trim() || 'None'}`)
                  .join('\n\n'),
              }),
            });

            setStatus(response.ok ? 'Weekly check-in saved.' : 'Enable support storage first.');
          }}
        >
          Save weekly check-in
        </button>
          {status ? (
          <p role="status" className="statusBanner" style={{ margin: 0 }}>
            {status}
          </p>
        ) : null}
      </section>

      <Guardrails className="sectionStack" style={{ marginTop: 32 }} />

      <ProgramNav className="sectionStack" style={{ marginTop: 24 }} />
    </main>
  );
}
