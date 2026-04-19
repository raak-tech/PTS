"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
          <button type="button" onClick={() => setChecked({})}>
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
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Safety &amp; Boundaries</h2>
        <ul>
          <li>This is not medical advice.</li>
          <li>
            This is not for emergencies. If you think you may be in danger, seek local
            emergency help.
          </li>
          <li>Stop any activity that feels unsafe and consider professional care.</li>
        </ul>
      </section>

      <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
        <Link href="/plan">Back to Week 1 Plan</Link>
        <Link href="/">Back to intake</Link>
      </div>
    </main>
  );
}
