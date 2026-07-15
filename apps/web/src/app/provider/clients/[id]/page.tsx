import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, intakeSessions, planWeeks, plans, supportArtifacts, userConsents, users } from '@/db/schema';
import { isAdminUser } from '@/lib/admin';
import { getClientCounselorMap, isClientVisibleToProvider } from '@/lib/client-access';
import type { GeneratedPlan, WeekPlan } from '@/lib/plan-generator';
import { formatClientLabel } from '@/lib/provider-display';
import { getUserFromCookieHeader } from '@/lib/session';
import { ProviderClientWorkspaceClient } from './ProviderClientWorkspaceClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string; week?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = getDb();
  const [client] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  return { title: client ? `Client | Counselor` : 'Client not found' };
}

function parseTab(tab?: string): 'activity' | 'plan' | 'messages' | 'notes' {
  if (tab === 'plan' || tab === 'messages' || tab === 'notes') return tab;
  if (tab === 'activity' || tab === 'overview' || tab === 'readouts') return 'activity';
  return 'plan';
}

export default async function ProviderClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await Promise.resolve(searchParams ?? {})) as { tab?: string; week?: string };
  const initialTab = parseTab(sp.tab);
  const parsedWeek = Number(sp.week);
  const initialWeek = Number.isFinite(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 6 ? parsedWeek : 1;

  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  const assignmentMap = user && !isAdminUser(user) ? await getClientCounselorMap() : {};
  if (user && !isAdminUser(user) && !isClientVisibleToProvider(id, user.id, assignmentMap)) {
    notFound();
  }

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
    .select({
      id: plans.id,
      status: plans.status,
      generatedContent: plans.generatedContent,
      counselorNotes: plans.counselorNotes,
      programAnchorDate: plans.programAnchorDate,
    })
    .from(plans)
    .where(eq(plans.userId, id))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  type WeekRow = { weekNumber: number; status: string; content: string };
  const weekRows: WeekRow[] = latestPlan
    ? ((await db
        .select({ weekNumber: planWeeks.weekNumber, status: planWeeks.status, content: planWeeks.content })
        .from(planWeeks)
        .where(eq(planWeeks.planId, latestPlan.id))) as WeekRow[])
    : [];

  const weekStatuses = Object.fromEntries(
    weekRows.map((r) => [r.weekNumber, r.status as 'draft' | 'edited' | 'approved']),
  );

  // Per-week content for inline editing. Prefer plan_weeks.content; fall back to
  // the matching week in plans.generatedContent (covers legacy/unsynced rows).
  const weekContents: Record<number, WeekPlan> = {};
  let generatedWeeks: WeekPlan[] = [];
  if (latestPlan?.generatedContent) {
    try {
      generatedWeeks = (JSON.parse(latestPlan.generatedContent) as GeneratedPlan).weeks ?? [];
    } catch {
      generatedWeeks = [];
    }
  }
  for (const row of weekRows) {
    try {
      weekContents[row.weekNumber] = JSON.parse(row.content) as WeekPlan;
    } catch {
      const fallback = generatedWeeks.find((w) => w.week === row.weekNumber);
      if (fallback) weekContents[row.weekNumber] = fallback;
    }
  }

  const PROGRAM_WEEKS = 6;

  const [intake] = await db
    .select({
      painSource: intakeResponses.painSource,
      painSourceOther: intakeResponses.painSourceOther,
      painDescription: intakeResponses.painDescription,
      recoveryGoal: intakeResponses.recoveryGoal,
      biggestChange: intakeResponses.biggestChange,
      onsetType: intakeResponses.onsetType,
      hasRedFlags: intakeResponses.hasRedFlags,
      isSafe: intakeResponses.isSafe,
      completedAt: intakeResponses.completedAt,
    })
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, id))
    .limit(1);

  // Fetch the latest intake session (one-box flow) for confidence data — optional.
  let latestSession:
    | {
        confidenceScores: string;
        rawText: string;
        rounds: number;
        overallConfidence: string | null;
        summary: string | null;
      }
    | undefined;
  try {
    const [row] = await db
      .select({
        confidenceScores: intakeSessions.confidenceScores,
        rawText: intakeSessions.rawText,
        rounds: intakeSessions.rounds,
        overallConfidence: intakeSessions.overallConfidence,
        summary: intakeSessions.summary,
      })
      .from(intakeSessions)
      .where(eq(intakeSessions.userId, id))
      .orderBy(desc(intakeSessions.createdAt))
      .limit(1);
    latestSession = row;
  } catch {
    latestSession = undefined;
  }

  const hasCrisisNotes =
    Boolean(latestPlan?.counselorNotes && /crisis/i.test(latestPlan.counselorNotes)) ||
    Boolean(intake && (intake.hasRedFlags || !intake.isSafe));

  return (
    <ProviderClientWorkspaceClient
      clientId={client.id}
      clientLabel={formatClientLabel(client)}
      planId={latestPlan?.id}
      initialWeekStatuses={weekStatuses}
      initialWeekContents={weekContents}
      programAnchorDate={latestPlan?.programAnchorDate ?? null}
      hasCrisisNotes={hasCrisisNotes}
      totalWeeks={PROGRAM_WEEKS}
      initialTab={initialTab}
      initialWeek={initialWeek}
      intake={
        intake
          ? {
              painSource: intake.painSourceOther ?? intake.painSource,
              painDescription: intake.painDescription,
              recoveryGoal: intake.recoveryGoal,
              biggestChange: intake.biggestChange ?? '',
              onsetType: intake.onsetType ?? '',
              hasRedFlags: intake.hasRedFlags,
              isSafe: intake.isSafe,
              completedAt: intake.completedAt ? intake.completedAt.toISOString() : null,
            }
          : null
      }
      planStatus={latestPlan?.status ?? null}
      intakeDataBar={
        latestSession && intake
          ? {
              painSource: intake.painSourceOther ?? intake.painSource,
              painDescription: intake.painDescription,
              recoveryGoal: intake.recoveryGoal,
              hasRedFlags: intake.hasRedFlags,
              isSafe: intake.isSafe,
              confidenceScores: latestSession.confidenceScores,
              rawText: latestSession.rawText,
              rounds: latestSession.rounds,
              overallConfidence: latestSession.overallConfidence,
              summary: latestSession.summary,
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

