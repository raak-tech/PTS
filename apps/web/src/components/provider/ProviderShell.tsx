'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import '@/app/provider/provider-console.css';

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  badgeKey?: 'queue' | 'messages';
};

const NAV: NavItem[] = [
  { href: '/provider', label: 'Work queue', match: (p) => p === '/provider' },
  { href: '/provider/clients', label: 'Clients', match: (p) => p.startsWith('/provider/clients') },
  { href: '/provider/messages', label: 'Messages', match: (p) => p.startsWith('/provider/messages'), badgeKey: 'messages' },
  { href: '/provider/plans', label: 'Plan review', match: (p) => p.startsWith('/provider/plans'), badgeKey: 'queue' },
  { href: '/provider/metrics', label: 'Metrics', match: (p) => p.startsWith('/provider/metrics') },
  { href: '/provider/profile', label: 'Profile', match: (p) => p.startsWith('/provider/profile') },
];

export function ProviderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [badges, setBadges] = useState({ queue: 0, messages: 0 });

  useEffect(() => {
    void fetch('/api/provider/queue', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { pendingPlans?: unknown[]; unreadMessages?: { count: number }[] }) => {
        const planCount = data.pendingPlans?.length ?? 0;
        const unread = (data.unreadMessages ?? []).reduce((n, u) => n + u.count, 0);
        setBadges({ queue: planCount, messages: unread });
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
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="provider-nav-link"
              aria-current={active ? 'page' : undefined}
            >
              <span>{item.label}</span>
              {badge > 0 ? <span className="provider-nav-badge">{badge > 9 ? '9+' : badge}</span> : null}
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
