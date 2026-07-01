'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import '@/app/provider/provider-console.css';

const NAV = [
  { href: '/provider/clients', label: 'Clients', match: (p: string) => p.startsWith('/provider/clients') || p === '/provider' },
  { href: '/provider/profile', label: 'Profile', match: (p: string) => p.startsWith('/provider/profile') },
] as const;

export function ProviderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    void fetch('/api/provider/queue', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { unreadMessages?: { count: number }[] } | null) => {
        if (!data) return;
        const count = (data.unreadMessages ?? []).reduce((n, u) => n + u.count, 0);
        setUnread(count);
      })
      .catch(() => undefined);
  }, [pathname]);

  return (
    <div className="provider-console">
      <aside className="provider-sidebar" aria-label="Counselor navigation">
        <div className="provider-brand">
          Pain to Strength
          <strong>Counselor</strong>
        </div>
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="provider-nav-link"
              aria-current={active ? 'page' : undefined}
            >
              <span>{item.label}</span>
              {item.href === '/provider/clients' && unread > 0 ? (
                <span className="provider-nav-badge">{unread > 9 ? '9+' : unread}</span>
              ) : null}
            </Link>
          );
        })}
        <Link href="/logout" className="provider-nav-link" style={{ marginTop: 'auto', opacity: 0.85 }}>
          Sign out
        </Link>
      </aside>
      <div className="provider-main">{children}</div>
    </div>
  );
}
