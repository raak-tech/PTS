"use client";

import { useMemo, useState } from "react";
import { Guardrails } from "../../components/Guardrails";
import { ProgramNav } from "../../components/ProgramNav";

type ChecklistItem = {
  id: string;
  label: string;
};

export default function DailyChecklistPage() {
  const items: ChecklistItem[] = useMemo(
    () => [
      { id: "grounding", label: "2 minutes: breathing / grounding" },
      { id: "movement", label: "5 minutes: gentle movement (comfortable range only)" },
      { id: "values", label: "2 minutes: one small values-based action" },
    ],
    []
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [reflection, setReflection] = useState("");

  const totalCount = items.length;
  const completedCount = items.reduce(
    (acc, item) => acc + (checked[item.id] ? 1 : 0),
    0
  );

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Daily Checklist</h1>

      <p style={{ maxWidth: 680 }}>
        Local-only: your checkmarks stay in this browser session only (no storage, no
        syncing).
      </p>

      <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: "#333" }}>
        <strong>Progress:</strong> {completedCount}/{totalCount}
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Today’s micro-practices</h2>

        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => {
              setChecked({});
              setReflection("");
            }}
          >
            Reset checklist
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
          {items.map((item) => (
            <li key={item.id}>
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked[item.id])}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))
                  }
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 18 }}>
          <label htmlFor="reflection" style={{ display: "block", fontWeight: 600 }}>
            Reflection (optional)
          </label>
          <textarea
            id="reflection"
            name="reflection"
            rows={4}
            placeholder="Optional. Not saved."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            style={{ width: "100%", maxWidth: 680 }}
          />
        </div>
      </section>

      <Guardrails style={{ marginTop: 24 }} />

      <ProgramNav style={{ marginTop: 24 }} />

    </main>
  );
}
