import { Guardrails } from "../../components/Guardrails";
import { ProgramNav } from "../../components/ProgramNav";

export default function WeeksPlaceholderPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Weeks 2-6 (placeholder)</h1>

      <p style={{ maxWidth: 680 }}>
        This is static in Sprint 1: a conservative outline to help you plan and reflect.
        It is not a diagnosis or a treatment plan.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>How to use this</h2>
        <ul>
          <li>Keep intensity low and prioritize consistency.</li>
          <li>If anything feels unsafe or sharply increases symptoms, scale down or stop.</li>
          <li>Use this as a starting point for a conversation with a clinician.</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Week 2</h2>
        <p style={{ maxWidth: 680 }}>
          Focus: repeat Week 1 micro-practices most days, with gentle pacing.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Week 3</h2>
        <p style={{ maxWidth: 680 }}>
          Focus: identify one activity that tends to flare symptoms and practice a smaller,
          safer version (shorter duration, more breaks).
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Week 4</h2>
        <p style={{ maxWidth: 680 }}>
          Focus: add one gentle strength or stability practice (comfortable range only), and
          keep everything else steady.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Week 5</h2>
        <p style={{ maxWidth: 680 }}>
          Focus: prepare for flare-ups. Choose one early-warning signal and a simple reset
          routine you can do safely.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Week 6</h2>
        <p style={{ maxWidth: 680 }}>
          Focus: maintenance - keep what helps, drop what does not, and set one small
          next-month goal that is measurable and realistic.
        </p>
      </section>

      <Guardrails style={{ marginTop: 32 }} />

      <ProgramNav style={{ marginTop: 24 }} />
    </main>
  );
}
