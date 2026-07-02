import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, planWeeks, plans, supportArtifacts, userConsents, users } from '@/db/schema';
import { formatClientLabel } from '@/lib/provider-display';
import { ProviderClientWorkspaceClient } from './ProviderClientWorkspaceClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = getDb();
  const [client] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  return { title: client ? `Client | Counselor` : 'Client not found' };
}

function parseTab(tab?: string): 'overview' | 'plan' | 'readouts' | 'messages' {
  if (tab === 'plan' || tab === 'readouts' || tab === 'messages') return tab;
  return 'overview';
}

export default async function ProviderClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await Promise.resolve(searchParams ?? {})) as { tab?: string };
  const initialTab = parseTab(sp.tab);

  const db = getDb();

  const [client] = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!client || client.role !== 'client') notFound();

  const [consent] = await db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, id))
    .limit(1);

  const artifacts: Array<{ id: string; kind: string; title: string; bodyText: string; createdAt: Date }> = consent?.dataStorageEnabled
    ? await db
        .select({
          id: supportArtifacts.id,
          kind: supportArtifacts.kind,
          title: supportArtifacts.title,
          bodyText: supportArtifacts.bodyText,
          createdAt: supportArtifacts.createdAt,
        })
        .from(supportArtifacts)
        .where(eq(supportArtifacts.userId, id))
        .orderBy(supportArtifacts.createdAt)
    : [];

  const kindCounts: Record<string, number> = {};
  for (const a of artifacts) {
    kindCounts[a.kind] = (kindCounts[a.kind] ?? 0) + 1;
  }

  const [latestPlan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.userId, id))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  type WeekStatusRow = { weekNumber: number; status: string };
  const weekStatusRows: WeekStatusRow[] = latestPlan
    ? ((await db
        .select({ weekNumber: planWeeks.weekNumber, status: planWeeks.status })
        .from(planWeeks)
        .where(eq(planWeeks.planId, latestPlan.id))) as WeekStatusRow[])
    : [];

  const weekStatuses = Object.fromEntries(
    weekStatusRows.map((r) => [r.weekNumber, r.status as 'draft' | 'edited' | 'approved']),
  );

  const PROGRAM_WEEKS = 6;

  const [intake] = await db
    .select({
      painSource: intakeResponses.painSource,
      painSourceOther: intakeResponses.painSourceOther,
      painDescription: intakeResponses.painDescription,
      recoveryGoal: intakeResponses.recoveryGoal,
      hasRedFlags: intakeResponses.hasRedFlags,
      isSafe: intakeResponses.isSafe,
      completedAt: intakeResponses.completedAt,
    })
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, id))
    .limit(1);

  return (
    <ProviderClientWorkspaceClient
      clientId={client.id}
      clientLabel={formatClientLabel(client)}
      planId={latestPlan?.id}
      initialWeekStatuses={weekStatuses}
      totalWeeks={PROGRAM_WEEKS}
      initialTab={initialTab}
      intake={
        intake
          ? {
              painSource: intake.painSourceOther ?? intake.painSource,
              painDescription: intake.painDescription,
              recoveryGoal: intake.recoveryGoal,
              hasRedFlags: intake.hasRedFlags,
              isSafe: intake.isSafe,
              completedAt: intake.completedAt ? intake.completedAt.toISOString() : null,
            }
          : null
      }
      overview={{
        registered: client.createdAt.toLocaleDateString(),
        storageConsent: Boolean(consent?.dataStorageEnabled),
        artifactCount: artifacts.length,
        kindCounts,
        artifacts: artifacts.map((a) => ({
          id: a.id,
          kind: a.kind,
          title: a.title,
          bodyText: a.bodyText,
          createdAt: a.createdAt.toISOString(),
        })),
      }}
    />
  );
}

