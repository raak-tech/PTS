import Link from "next/link";
import { Guardrails } from "../../components/Guardrails";

export default function WeeklyCheckInPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Weekly Check-in</h1>

      <p style={{ maxWidth: 680 }}>
        Local-only stub: this page does not store or transmit your responses.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Prompts</h2>
        <ul>
          <li>What did you do most days this week?</li>
          <li>What felt easier vs harder?</li>
          <li>What is one small adjustment you will try next week?</li>
        </ul>
      </section>

      <Guardrails style={{ marginTop: 32 }} />

      <p style={{ marginTop: 32 }}>
        <Link href="/plan">Back to plan</Link>
      </p>
    </main>
  );
}
