import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ClinicShell } from '@/components/clinic/ClinicShell';
import { getClinicActor } from '@/lib/clinic-access';
import { getUserFromCookieHeader } from '@/lib/session';

export default async function ClinicLayout({ children }: { children: React.ReactNode }) {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/clinic/patients');

  const actor = await getClinicActor(user.id);
  if (!actor) redirect('/login?error=clinic-only');

  return (
    <ClinicShell
      clinicName={actor.clinicName}
      role={actor.membershipRole}
      canViewAggregate={actor.membershipRole === 'clinic_admin'}
    >
      {children}
    </ClinicShell>
  );
}
