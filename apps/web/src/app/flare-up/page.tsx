import Link from "next/link";

import { Guardrails } from "../../components/Guardrails";

export default function FlareUpProtocolPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Flare-up protocol</h1>

      <p style={{ maxWidth: 680 }}>
        Local-only stub: this page does not store or transmit anything you enter. It is a
        conservative checklist for planning and reflection, not a diagnosis or treatment.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>When symptoms spike: a safe reset</h2>
        <ol>
          <li>
            Pause and reduce load. Stop anything that feels unsafe or sharply increases
            symptoms.
          </li>
          <li>
            Take 60-120 seconds to breathe slowly (comfortable pace). If breathing makes
            you dizzy or worse, stop.
          </li>
          <li>
            Choose the smallest next step: rest, a short gentle walk, or a basic
            self-care task. Keep intensity low.
          </li>
          <li>
            Note what changed (sleep, stress, activity, posture, workload). This can help
            you and a clinician spot patterns.
          </li>
        </ol>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>When to stop and seek care</h2>
        <p style={{ maxWidth: 680 }}>
          If you have red-flag symptoms (for example, new severe weakness, loss of
          bladder/bowel control, fever with severe back pain, major trauma, or unexplained
          weight loss), do not use this protocol. Seek in-person medical evaluation.
        </p>
      </section>

      <Guardrails style={{ marginTop: 32 }} />

      <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
        <Link href="/plan">Back to Week 1 Plan</Link>
        <Link href="/">Back to intake</Link>
      </div>
    </main>
  );
}
