import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { counselorNotes, formulations, intakeResponses, messages, plans, users } from '@/db/schema';
import {
  getClientCounselorMap,
  getCompletedIntakeClientIds,
  isClientVisibleToProvider,
} from '@/lib/client-access';
import { formatClientLabel } from '@/lib/provider-display';
import { getUserFromCookieHeader } from '@/lib/session';
import { ProviderClientsListClient } from '@/components/provider/ProviderClientsListClient';
import { AddressedNotesPanel } from '@/components/provider/AddressedNotesPanel';
import {
  PendingFormulationsClient,
  type PendingFormulationRow,
} from '@/app/provider/plans/PendingFormulationsClient';

export const metadata: Metadata = { title: 'Caseload | Counselor' };

function intakeTeaser(description: string | null | undefined, goal: string | null | undefined): string | null {
  const d = description?.trim();
  const g = goal?.trim();
  if (d && g) {
    const short = d.length > 110 ? `${d.slice(0, 107)}…` : d;
    return `${short} · Goal: ${g.length > 60 ? `${g.slice(0, 57)}…` : g}`;
  }
  if (d) return d.length > 140 ? `${d.slice(0, 137)}…` : d;
  if (g) return `Goal: ${g}`;
  return null;
}

export default async function ProviderClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const user = await getUserFromCookieHeader((await headers()).get('cookie'));
  if (!user) redirect('/login?next=/provider/clients');

  const sp = (await Promise.resolve(searchParams ?? {})) as { filter?: string };
  const filter = sp.filter === 'plans' ? 'plans' : null;

  const db = getDb();
  const [assignmentMap, completedIntakeIds] = await Promise.all([
    getClientCounselorMap(),
    getCompletedIntakeClientIds(),
  ]);

  const clients: {
    id: string;
    email: string;
    displayName: string | null;
    phone: string | null;
    createdAt: Date;
  }[] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'client'))
    .orderBy(desc(users.createdAt));

  // Hybrid ready-pool: incomplete intake never appears; completed + unassigned = pickup.
  const visibleClients = clients.filter((c) =>
    isClientVisibleToProvider(c.id, user.id, assignmentMap, completedIntakeIds),
  );

  const clientIds = visibleClients.map((c) => c.id);

  const allPlans: { userId: string; status: string; createdAt: Date }[] =
    clientIds.length > 0
      ? await db.select({ userId: plans.userId, status: plans.status, createdAt: plans.createdAt }).from(plans)
      : [];
  const latestStatusByClient: Record<string, string> = {};
  for (const p of allPlans.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    latestStatusByClient[p.userId] = p.status;
  }

  const intakeRows: {
    userId: string;
    hasRedFlags: boolean;
    isSafe: boolean;
    painDescription: string;
    recoveryGoal: string;
  }[] =
    clientIds.length > 0
      ? await db
          .select({
            userId: intakeResponses.userId,
            hasRedFlags: intakeResponses.hasRedFlags,
            isSafe: intakeResponses.isSafe,
            painDescription: intakeResponses.painDescription,
            recoveryGoal: intakeResponses.recoveryGoal,
          })
          .from(intakeResponses)
      : [];
  const intakeByClient = Object.fromEntries(intakeRows.map((i) => [i.userId, i]));

  const unreadRows = await db
    .select({ fromUserId: messages.fromUserId })
    .from(messages)
    .where(and(eq(messages.toUserId, user.id), isNull(messages.readAt)));
  const unreadByClient: Record<string, number> = {};
  for (const row of unreadRows) {
    unreadByClient[row.fromUserId] = (unreadByClient[row.fromUserId] ?? 0) + 1;
  }

  const noteRows =
    clientIds.length > 0
      ? await db
          .select({ clientId: counselorNotes.clientId })
          .from(counselorNotes)
          .where(isNull(counselorNotes.resolvedAt))
      : [];
  const noteCountByClient: Record<string, number> = {};
  for (const row of noteRows) {
    noteCountByClient[row.clientId] = (noteCountByClient[row.clientId] ?? 0) + 1;
  }

  // Pain Script: formulations awaiting counselor approval (was on /provider/plans)
  const pendingFormulationRows =
    clientIds.length > 0
      ? await db
          .select({
            userId: formulations.userId,
            status: formulations.status,
            version: formulations.version,
            safetyFlag: formulations.safetyFlag,
            source: formulations.source,
            createdAt: formulations.createdAt,
            email: users.email,
            pilotCohort: users.pilotCohort,
          })
          .from(formulations)
          .innerJoin(users, eq(formulations.userId, users.id))
          .where(inArray(formulations.status, ['draft', 'edited']))
      : [];

  const pendingFormulations: PendingFormulationRow[] = pendingFormulationRows
    .filter(
      (r) =>
        r.pilotCohort === 'pain_script' &&
        isClientVisibleToProvider(r.userId, user.id, assignmentMap, completedIntakeIds),
    )
    .map((r) => ({
      userId: r.userId,
      email: r.email,
      status: r.status,
      version: r.version,
      safetyFlag: r.safetyFlag,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    }));

  const formulationPendingByClient = Object.fromEntries(
    pendingFormulations.map((r) => [r.userId, true as const]),
  );

  const rows = visibleClients.map((client) => {
    const intake = intakeByClient[client.id];
    const hasCompletedIntake = Boolean(intake);
    const assigned = Boolean(assignmentMap[client.id]);
    const hasRedFlag = Boolean(intake?.hasRedFlags) || intake?.isSafe === false;
    const unreadCount = unreadByClient[client.id] ?? 0;
    const noteCount = noteCountByClient[client.id] ?? 0;
    const planStatus = latestStatusByClient[client.id] ?? 'none';
    const formulationPending = Boolean(formulationPendingByClient[client.id]);
    const needsAction =
      hasRedFlag ||
      unreadCount > 0 ||
      noteCount > 0 ||
      formulationPending ||
      (hasCompletedIntake && planStatus === 'none') ||
      planStatus === 'pending_review' ||
      planStatus === 'draft';
    return {
      id: client.id,
      label: formatClientLabel(client),
      phone: client.phone,
      registered: client.createdAt.toLocaleDateString(),
      planStatus,
      hasRedFlag,
      unreadCount,
      noteCount,
      needsAction,
      formulationPending,
      hasCompletedIntake,
      assigned,
      intakeTeaser: intakeTeaser(intake?.painDescription, intake?.recoveryGoal),
    };
  });

  rows.sort((a, b) => {
    const score = (c: (typeof rows)[0]) => {
      if (c.hasRedFlag) return 0;
      if (c.unreadCount > 0) return 1;
      if (c.formulationPending) return 2;
      if (c.planStatus === 'draft' || c.planStatus === 'pending_review') return 3;
      if (c.planStatus === 'none') return 4;
      if (c.noteCount > 0) return 5;
      if (c.needsAction) return 6;
      return 7;
    };
    const d = score(a) - score(b);
    if (d !== 0) return d;
    return 0;
  });

  const actionCount = rows.filter((c) => c.needsAction).length;

  return (
    <>
      <PendingFormulationsClient rows={pendingFormulations} />
      <AddressedNotesPanel />
      <ProviderClientsListClient
        clients={rows}
        actionCount={actionCount}
        totalCount={rows.length}
        filter={filter}
      />
    </>
  );
}
