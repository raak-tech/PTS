import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAuditClient } from './AdminAuditClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

export const metadata: Metadata = { title: 'Admin — Audit Log' };

export default async function AdminAuditPage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin/audit');
  if (!isAdminUser(user)) redirect('/');

  return <AdminAuditClient />;
}
