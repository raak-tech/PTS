import Link from "next/link";

import { Guardrails } from "../../components/Guardrails";

export default function PlanPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Your Week 1 Plan</h1>

      <p style={{ maxWidth: 680 }}>
        This preview is for planning and reflection support only. It is not a
        substitute for professional care.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Next step</h2>
        <p style={{ maxWidth: 680 }}>
          If you want something more actionable, open a local-only daily checklist
          (no storage) to help you track small practices.
        </p>
        <p>
          <Link href="/daily">Open Daily Checklist</Link>
        </p>
        <p>
          <Link href="/check-in">Open Weekly Check-in</Link>
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Overview</h2>
        <p style={{ maxWidth: 680 }}>
          Week 1 is a conservative start: small daily practices, gentle pacing,
          and a simple weekly check-in. This page is static in Sprint 1 (no
          storage, no personalization).
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Weekly focus</h2>
        <p style={{ maxWidth: 680 }}>
          Aim for consistency over intensity. Keep effort in a comfortable range.
          If symptoms spike, scale down and consider pausing anything that feels
          unsafe.
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Reflection prompt</h2>
        <ul>
          <li>What felt a little easier this week?</li>
          <li>What felt harder (and what might have contributed)?</li>
          <li>What is one small adjustment you will try tomorrow?</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Daily Micro-practices</h2>
        <ul>
          <li>2 minutes: breathing / grounding</li>
          <li>5 minutes: gentle movement (comfortable range only)</li>
          <li>2 minutes: values-based action (one small step)</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Weekly check-in (preview)</h2>
        <ul>
          <li>What did you try most days this week?</li>
          <li>What felt easier vs harder?</li>
          <li>What is one small adjustment you will try next week?</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Red flags: when to seek care</h2>
        <p style={{ maxWidth: 680 }}>
          If you have symptoms that worry you (new severe weakness, loss of
          bladder/bowel control, fever with severe back pain, major trauma, or
          unexplained weight loss), pause this program and seek in-person medical
          evaluation.
        </p>
      </section>

      <Guardrails style={{ marginTop: 32 }} />

      <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
        <Link href="/">Back to intake</Link>
      </div>
    </main>
  );
}

