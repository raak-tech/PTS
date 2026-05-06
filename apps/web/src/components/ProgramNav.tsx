'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';

type Props = {
  style?: CSSProperties;
  className?: string;
};

export function ProgramNav({ style, className }: Props) {
  const pathname = usePathname();

  const links = [
    { href: '/daily', label: 'Daily checklist' },
    { href: '/check-in', label: 'Weekly check-in' },
    { href: '/support', label: 'Support storage' },
    { href: '/plan', label: 'Back to Week 1 plan' },
    { href: '/weeks', label: 'Weeks 2-6' },
    { href: '/flare-up', label: 'Flare-up protocol' },
    { href: '/red-flags', label: 'Red flags guidance' },
    { href: '/', label: 'Back to intake' },
  ] as const;

  return (
    <nav aria-label="Program navigation" className={className} style={style}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Program navigation</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
