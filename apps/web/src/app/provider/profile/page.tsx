import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { canAccessProviderConsole } from '@/lib/provider-console-access';
import { ensureCounselorProfile } from '@/lib/counselor-profile';
import { getUserFromCookieHeader } from '../../../lib/session';
import { ProfileEditorClient } from './ProfileEditorClient';

export const metadata: Metadata = { title: 'My profile | Provider' };

function safeParseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export default async function ProviderProfilePage() {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/provider/profile');
  if (!canAccessProviderConsole(user)) redirect('/');

  const profile = await ensureCounselorProfile(user.id, user.displayName);

  const initialData = {
    fullName: profile.fullName,
    title: profile.title,
    credentials: profile.credentials ?? '',
    bio: profile.bio,
    calendlyUrl: profile.calendlyUrl ?? '',
    specialisations: safeParseList(profile.specialisations),
    languages: safeParseList(profile.languages),
  };

  return (
    <>
      <h1 className="provider-page-title">My profile</h1>
      <p className="provider-page-subtitle">How clients see you in the app.</p>

      <ProfileEditorClient initialData={initialData} />
    </>
  );
}
