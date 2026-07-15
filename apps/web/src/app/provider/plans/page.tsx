import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { getDb } from '@/db';
import { plans } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';

/**
 * Plan review is no longer a second counselor home.
 * Caseload filter deep-links into Client Chart → Plan mode.
 * Optional ?highlight=<planId> opens that client's chart.
 */
export default async function ProviderPlansRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<{ highlight?: string }>;
}) {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/provider/clients?filter=plans');

  const sp = (await Promise.resolve(searchParams ?? {})) as { highlight?: string };
  if (sp.highlight) {
    const db = getDb();
    const [row] = await db
      .select({ userId: plans.userId })
      .from(plans)
      .where(eq(plans.id, sp.highlight))
      .limit(1);
    if (row?.userId) {
      redirect(`/provider/clients/${row.userId}?tab=plan`);
    }
  }

  redirect('/provider/clients?filter=plans');
}
