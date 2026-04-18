export default function PlanPage() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Your Week 1 Plan</h1>

      <p style={{ maxWidth: 680 }}>
        This preview is for planning and reflection support only. It is not a
        substitute for professional care.
      </p>

      <section style={{ marginTop: 32 }}>
        <h2>Daily Micro-practices</h2>
        <ul>
          <li>2 minutes: breathing / grounding</li>
          <li>5 minutes: gentle movement (comfortable range only)</li>
          <li>2 minutes: values-based action (one small step)</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Safety &amp; Boundaries</h2>
        <ul>
          <li>This is not medical advice.</li>
          <li>This is not for emergencies. If you think you may be in danger, seek local emergency help.</li>
          <li>Stop any activity that feels unsafe and consider consulting a licensed clinician.</li>
        </ul>
      </section>
    </main>
  );
}
