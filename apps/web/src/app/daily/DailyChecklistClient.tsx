"use client";

import { useMemo, useState } from "react";

import { Guardrails } from "../../components/Guardrails";
import { Sprint1PageFooter } from "../../components/Sprint1PageFooter";

type ChecklistItem = {
  id: string;
  label: string;
};

export function DailyChecklistClient() {
  const items: ChecklistItem[] = useMemo(
    () => [
      { id: "grounding", label: "Grounding — 2 minutes: breathing / grounding" },
      { id: "movement", label: "Movement — 5 minutes: gentle movement (comfortable range only)" },
      { id: "values", label: "Values-based action — 2 minutes: values-based action (one small step)" },
    ],
    []
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [reflection, setReflection] = useState("");

  const totalCount = items.length;
  const completedCount = items.reduce((acc, item) => acc + (checked[item.id] ? 1 : 0), 0);

  return (
    <main className="pageShell" style={{ maxWidth: 800 }}>
      <h1>Daily Checklist</h1>

      <p style={{ maxWidth: 680 }}>
        Local-only / not saved: checkmarks stay in this browser session only (no storage,
        no syncing).
      </p>

      <p className="statusBanner" style={{ marginTop: 8 }}>
        <strong>Progress:</strong> {completedCount}/{totalCount}
      </p>

      <section className="sectionStack" style={{ marginTop: 24 }}>
        <h2>Today&apos;s micro-practices</h2>

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

        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
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

      <Guardrails className="sectionStack" style={{ marginTop: 24 }} />

      <Sprint1PageFooter variant="daily" className="sectionStack" style={{ marginTop: 24 }} />
    </main>
  );
}
