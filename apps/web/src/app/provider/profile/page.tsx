import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { getDb } from '../../../db';
import { counselorProfiles, users } from '../../../db/schema';
import { getUserFromCookieHeader } from '../../../lib/session';
import { ProfileEditorClient } from './ProfileEditorClient';

export const metadata: Metadata = { title: 'My profile | Provider' };

export default async function ProviderProfilePage() {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));
  if (!user || user.role !== 'provider') redirect('/login');

  const db = getDb();

  const [profile] = await db
    .select()
    .from(counselorProfiles)
    .where(eq(counselorProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    redirect('/provider');
  }

  const initialData = {
    fullName: profile.fullName,
    title: profile.title,
    credentials: profile.credentials ?? '',
    bio: profile.bio,
    calendlyUrl: profile.calendlyUrl ?? '',
    specialisations: profile.specialisations ? JSON.parse(profile.specialisations) : [],
    languages: profile.languages ? JSON.parse(profile.languages) : [],
  };

  return (
    <main className="pageShell" style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>My profile</h1>
        <Link href="/provider" className="actionLink secondary">← Console</Link>
      </div>

      <ProfileEditorClient initialData={initialData} />
    </main>
  );
}
