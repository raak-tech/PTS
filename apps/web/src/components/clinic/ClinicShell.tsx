'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { webTheme as t } from '@/lib/web-theme';

type Props = {
  clinicName: string;
  role: 'referrer' | 'clinic_admin';
  canViewAggregate: boolean;
  children: React.ReactNode;
};

export function ClinicShell({ clinicName, role, canViewAggregate, children }: Props) {
  const pathname = usePathname();

  const nav = [
    { href: '/clinic/patients', label: 'Patients' },
    { href: '/clinic/codes', label: 'Enrollment codes' },
    ...(canViewAggregate
      ? [
          { href: '/clinic/dashboard', label: 'Outcomes' },
          { href: '/clinic/billing', label: 'Billing' },
        ]
      : []),
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: t.page, color: t.text }}>
      <aside
        style={{
          width: 240,
          background: t.bg,
          color: '#fff',
          padding: '28px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>Pain to Strength</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{clinicName}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, textTransform: 'capitalize' }}>
            {role.replace('_', ' ')}
          </div>
        </div>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '10px 12px',
                borderRadius: 10,
                color: active ? t.bg : '#fff',
                background: active ? t.accent : 'transparent',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <form action="/logout" method="post" style={{ marginTop: 'auto' }}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              color: '#fff',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              font: 'inherit',
              fontWeight: 600,
              opacity: 0.85,
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </form>
      </aside>
      <main style={{ flex: 1, padding: '36px 40px', maxWidth: 1100 }}>{children}</main>
    </div>
  );
}
