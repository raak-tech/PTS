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

  const totalCount = prompts.length;
  const completedCount = prompts.reduce(
    (acc, p) => acc + (answers[p.id]?.trim() ? 1 : 0),
    0
  );

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Weekly Check-in</h1>

      <p style={{ maxWidth: 680 }}>
        Local-only: your answers stay in this browser session only (no storage, no
        syncing).
      </p>

      <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: "#333" }}>
        <strong>Progress:</strong> {completedCount}/{totalCount}
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Prompts</h2>

        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <button type="button" onClick={() => setAnswers({})}>
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

      <Guardrails style={{ marginTop: 32 }} />

      <ProgramNav style={{ marginTop: 24 }} />
    </main>
  );
}
