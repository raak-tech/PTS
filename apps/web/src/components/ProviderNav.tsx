'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';

type Props = {
  style?: CSSProperties;
};

export function ProviderNav({ style }: Props) {
  const pathname = usePathname();

  const links = [
    { href: '/provider', label: 'Console home' },
    { href: '/provider/clients', label: 'Clients' },
    { href: '/provider/clients/client-001', label: 'Sample client' },
  ] as const;

  return (
    <nav aria-label="Provider navigation" style={style}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Provider navigation</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}