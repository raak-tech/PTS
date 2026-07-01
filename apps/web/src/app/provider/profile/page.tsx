import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { getDb } from '../../../db';
import { counselorProfiles } from '../../../db/schema';
import { getUserFromCookieHeader } from '../../../lib/session';
import { ProfileEditorClient } from './ProfileEditorClient';

export const metadata: Metadata = { title: 'My profile | Provider' };

export default async function ProviderProfilePage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  const db = getDb();

  const [profile] = await db
    .select()
    .from(counselorProfiles)
    .where(eq(counselorProfiles.userId, user!.id))
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
    <>
      <h1 className="provider-page-title">My profile</h1>
      <p className="provider-page-subtitle">How clients see you in the app.</p>

      <ProfileEditorClient initialData={initialData} />
    </>
  );
}
