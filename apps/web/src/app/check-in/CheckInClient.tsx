"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Guardrails } from "../../components/Guardrails";
import { Sprint1PageFooter } from "../../components/Sprint1PageFooter";
import { WEEKLY_CHECK_IN_PROMPTS } from "@/lib/check-in-prompts";

type Answers = Record<string, string>;

export function CheckInClient() {
  const router = useRouter();
  const [weekNumber, setWeekNumber] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const prompts = useMemo(() => WEEKLY_CHECK_IN_PROMPTS, []);

  useEffect(() => {
    void fetch(`/api/check-ins/weekly?weekNumber=${weekNumber}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("load_failed");
        const data = (await res.json()) as {
          checkIn?: { answers: Answers } | null;
        };
        if (data.checkIn?.answers) {
          setAnswers(data.checkIn.answers);
          setSaved(true);
        } else {
          setAnswers({});
          setSaved(false);
        }
      })
      .catch(() => setError("Could not load your check-in."))
      .finally(() => setLoading(false));
  }, [weekNumber]);

  const completedCount = prompts.reduce((acc, p) => acc + (answers[p.id]?.trim() ? 1 : 0), 0);

  const onSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const weekStartIso = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/check-ins/weekly", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          weekStartIso,
          answers: {
            q1: answers.q1 ?? "",
            q2: answers.q2 ?? "",
            q3: answers.q3 ?? "",
          },
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      setSaved(true);
      router.push("/plan");
    } catch {
      setError("Could not save check-in. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="pageShell" style={{ maxWidth: 800 }}>
        <p>Loading check-in…</p>
      </main>
    );
  }

  return (
    <main className="pageShell" style={{ maxWidth: 800 }}>
      <h1>Weekly check-in</h1>

      <p style={{ maxWidth: 680 }}>
        A few minutes to help your counselor adapt next week&apos;s plan. Your answers are saved to your program record.
      </p>

      <p className="statusBanner" style={{ marginTop: 8 }}>
        <strong>Week</strong>{" "}
        <select value={weekNumber} onChange={(e) => setWeekNumber(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        {" · "}
        <strong>Progress:</strong> {completedCount}/{prompts.length}
        {saved ? " · saved" : ""}
      </p>

      {error ? <p style={{ color: "#b71c1c" }}>{error}</p> : null}

      <section className="sectionStack" style={{ marginTop: 24 }}>
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
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => void onSubmit()} disabled={saving || completedCount === 0}>
          {saving ? "Saving…" : saved ? "Update check-in" : "Submit check-in"}
        </button>
      </section>

      <Guardrails className="sectionStack" style={{ marginTop: 32 }} />
      <Sprint1PageFooter variant="check-in" className="sectionStack" style={{ marginTop: 24 }} />
    </main>
  );
}
