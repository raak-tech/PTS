import type { Metadata } from "next";

import { Guardrails } from "../../components/Guardrails";
import { ProgramNav } from "../../components/ProgramNav";

type WeekCard = {
  week: string;
  focus: string;
  practice: string;
  review: string;
};

const weekCards: WeekCard[] = [
  {
    week: "Week 2",
    focus: "Repeat the Week 1 basics and keep the effort comfortable.",
    practice: "Use the daily checklist most days and keep each step short.",
    review: "What felt steady enough to repeat next week?",
  },
  {
    week: "Week 3",
    focus: "Pick one common trigger and make it smaller or slower.",
    practice: "Reduce duration, add breaks, and stop if anything feels unsafe.",
    review: "What changed when you lowered the load?",
  },
  {
    week: "Week 4",
    focus: "Add one gentle strength or stability practice if it still feels safe.",
    practice: "Keep the range easy and leave room to recover between sessions.",
    review: "What was tolerable, and what was too much?",
  },
  {
    week: "Week 5",
    focus: "Plan for flare-ups before they happen.",
    practice: "Choose one early warning sign and one simple reset routine.",
    review: "What is the smallest safe adjustment you can make early?",
  },
  {
    week: "Week 6",
    focus: "Keep what helped and drop what did not.",
    practice: "Set one realistic next-month goal that stays conservative.",
    review: "What would a stable next step look like?",
  },
];

export const metadata: Metadata = {
  title: "Weeks 2-6",
};

export default function WeeksPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Weeks 2-6</h1>

      <p style={{ maxWidth: 680 }}>
        Conservative six-week scaffolding for planning and reflection. This is a static
        Sprint 1 outline, not a diagnosis or a treatment plan.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>How to use this</h2>
        <ul>
          <li>Keep intensity low and prioritize consistency.</li>
          <li>Pause or scale back anything that feels unsafe or sharply worsens symptoms.</li>
          <li>Use this as a conversation starter with a licensed clinician.</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Week-by-week scaffold</h2>
        <div style={{ display: "grid", gap: 20 }}>
          {weekCards.map((card) => (
            <article
              key={card.week}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0 }}>{card.week}</h3>
              <p style={{ marginBottom: 8 }}>
                <strong>Focus:</strong> {card.focus}
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>Practice:</strong> {card.practice}
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Review:</strong> {card.review}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Guardrails style={{ marginTop: 32 }} />

      <ProgramNav style={{ marginTop: 24 }} />
    </main>
  );
}
