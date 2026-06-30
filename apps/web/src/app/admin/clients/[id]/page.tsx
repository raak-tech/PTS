import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { AdminClientDossierClient } from './AdminClientDossierClient';
import { isAdminUser } from '@/lib/admin';
import { getUserFromCookieHeader } from '@/lib/session';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Client ${id.slice(0, 8)} | Admin` };
}

export default async function AdminClientPage({ params }: Props) {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/admin');
  if (!isAdminUser(user)) redirect('/');

  const { id } = await params;
  if (!id) notFound();

  return <AdminClientDossierClient clientId={id} />;
}
