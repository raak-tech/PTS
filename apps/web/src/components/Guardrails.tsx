import Link from "next/link";
import type { CSSProperties } from "react";

type GuardrailsProps = {
  style?: CSSProperties;
};

export function Guardrails({ style }: GuardrailsProps) {
  return (
    <section style={style}>
      <h2>Safety &amp; Boundaries</h2>
      <ul>
        <li>
          <Link href="/red-flags">Red flags guidance</Link>
        </li>
        <li>This is not medical advice.</li>
        <li>No outcome guarantees.</li>
        <li>
          This is not for emergencies. If you think you may be in danger, seek local
          emergency help.
        </li>
        <li>
          Stop any activity that feels unsafe and consider consulting a licensed
          clinician.
        </li>
      </ul>
    </section>
  );
}
