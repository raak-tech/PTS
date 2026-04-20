import Link from 'next/link';
import type { CSSProperties } from 'react';

type Props = {
  style?: CSSProperties;
};

export function ProgramNav({ style }: Props) {
  return (
    <nav aria-label="Program navigation" style={style}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Program navigation</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
        <li>
          <Link href="/daily">Daily checklist</Link>
        </li>
        <li>
          <Link href="/check-in">Weekly check-in</Link>
        </li>
        <li>
          <Link href="/plan">Back to Week 1 plan</Link>
        </li>
        <li>
          <Link href="/flare-up">Flare-up protocol</Link>
        </li>
        <li>
          <Link href="/red-flags">Safety guidance</Link>
        </li>
        <li>
          <Link href="/">Back to intake</Link>
        </li>
      </ul>
    </nav>
  );
}
