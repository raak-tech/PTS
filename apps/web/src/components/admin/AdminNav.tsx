import Link from 'next/link';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/costs', label: 'LLM costs' },
  { href: '/admin/explorer', label: 'Data explorer' },
  { href: '/admin/audit', label: 'Audit log' },
  { href: '/admin/music', label: 'Music' },
];

export function AdminNav({ current }: { current?: string }) {
  return (
    <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          style={{
            fontSize: 14,
            fontWeight: current === l.href ? 700 : 500,
            color: current === l.href ? '#111' : '#555',
            textDecoration: current === l.href ? 'underline' : 'none',
          }}
        >
          {l.label}
        </Link>
      ))}
      <Link href="/" style={{ fontSize: 14, color: '#888', marginLeft: 'auto' }}>
        Home
      </Link>
    </nav>
  );
}
