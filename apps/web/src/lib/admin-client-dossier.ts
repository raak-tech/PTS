import { desc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { getDb } from '@/db';
import {
  clientCounselor,
  dailyCalendarEntries,
  dailyReinforcements,
  dailyScheduleFeedback,
  eveningReflections,
  holisticCompletions,
  intakeResponses,
  messages,
  plans,
  reinforcementResponses,
  supportArtifacts,
  userConsents,
  users,
  weeklyCheckIns,
} from '@/db/schema';
import { formatWeeklyCheckInSummary, parseWeeklyCheckInAnswers } from '@/lib/check-in-prompts';
import { parseCalendarBlocks } from '@/lib/daily-layer';
import type { GeneratedPlan } from '@/lib/plan-generator';
import { buildWeeklySummary, type WeeklySummary } from '@/lib/weekly-summary';

type PlanRow = typeof plans.$inferSelect;
type ReinforcementRow = typeof dailyReinforcements.$inferSelect;
type ReinforcementResponseRow = typeof reinforcementResponses.$inferSelect;
type CalendarRow = typeof dailyCalendarEntries.$inferSelect;
type FeedbackRow = typeof dailyScheduleFeedback.$inferSelect;
type HolisticRow = typeof holisticCompletions.$inferSelect;
type ArtifactRow = Pick<
  typeof supportArtifacts.$inferSelect,
  'id' | 'kind' | 'title' | 'bodyText' | 'createdAt'
>;

export type AdminDossierPlan = {
  id: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  counselorId: string | null;
  counselorNotes: string | null;
  overview: string | null;
  clientSummary: string | null;
  weekCount: number;
  generatedContent: string;
};

export type AdminDossierMessage = {
  id: string;
  body: string;
  direction: 'outbound' | 'inbound';
  from: { id: string; label: string };
  to: { id: string; label: string };
  readAt: string | null;
  createdAt: string;
};

export type AdminDossierReinforcement = {
  id: string;
  title: string;
  bodyText: string;
  hasCounselorAudio: boolean;
  planWeek: number | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  responses: Array<{
    id: string;
    responseType: string;
    bodyText: string | null;
    hasAudio: boolean;
    submittedAt: string;
  }>;
};

export type AdminClientDossier = {
  client: {
    id: string;
    displayName: string | null;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
  };
  consent: {
    dataStorageEnabled: boolean;
    enabledAt: string | null;
    reflectionEncryptionEnabled: boolean;
  } | null;
  intake: {
    id: string;
    painSource: string | null;
    painSourceOther: string | null;
    painDescription: string | null;
    painDuration: string | null;
    ageRange: string | null;
    gender: string | null;
    occupation: string | null;
    affectsWork: string | null;
    hasDependents: boolean | null;
    priorTherapy: string | null;
    countryRegion: string | null;
    activitiesAffected: string | null;
    biggestChange: string | null;
    recoveryGoal: string | null;
    recoveryTimeline: string | null;
    currentTreatment: string | null;
    socialSupport: string | null;
    structurePreference: string | null;
    engagementTime: string | null;
    ayurvedaPreferences: string | null;
    hasRedFlags: boolean | null;
    isSafe: boolean | null;
    consentGiven: boolean | null;
    completedAt: string | null;
    updatedAt: string;
  } | null;
  counselor: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    assignedAt: string;
  } | null;
  plans: AdminDossierPlan[];
  approvedPlanContent: string | null;
  messages: AdminDossierMessage[];
  reinforcements: AdminDossierReinforcement[];
  calendar: Array<{
    dateIso: string;
    updatedAt: string;
    blocks: ReturnType<typeof parseCalendarBlocks>;
  }>;
  scheduleFeedback: Array<{
    dateIso: string;
    workedText: string | null;
    didntWorkText: string | null;
    submittedAt: string;
  }>;
  holisticCompletions: Array<{
    id: string;
    dateIso: string;
    weekNumber: number;
    activityType: string;
    notes: string | null;
    completedAt: string;
  }>;
  artifacts: Array<{
    id: string;
    kind: string;
    title: string;
    bodyText: string;
    createdAt: string;
  }>;
  weeklySummary: WeeklySummary | null;
  weeklyCheckIns: Array<{
    id: string;
    weekNumber: number;
    weekStartIso: string;
    summary: string;
    submittedAt: string;
  }>;
  eveningReflections: Array<{
    dateIso: string;
    bodyText: string;
    submittedAt: string;
  }>;
  generatedAt: string;
};

type MessageRow = {
  id: string;
  body: string;
  fromUserId: string;
  toUserId: string;
  readAt: Date | null;
  createdAt: Date;
  fromName: string | null;
  fromEmail: string;
  toName: string | null;
  toEmail: string;
};

export async function getAdminClientDossier(clientId: string): Promise<AdminClientDossier | null> {
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
    .where(eq(users.id, clientId))
    .limit(1);

  if (!client) return null;

  const [consent] = await db
    .select()
    .from(userConsents)
    .where(eq(userConsents.userId, clientId))
    .limit(1);

  const [intake] = await db
    .select()
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, clientId))
    .limit(1);

  const counselorUser = alias(users, 'counselor_user');
  const [assignment] = await db
    .select({
      counselorId: clientCounselor.counselorId,
      assignedAt: clientCounselor.assignedAt,
      counselorName: counselorUser.displayName,
      counselorEmail: counselorUser.email,
      counselorPhone: counselorUser.phone,
    })
    .from(clientCounselor)
    .innerJoin(counselorUser, eq(clientCounselor.counselorId, counselorUser.id))
    .where(eq(clientCounselor.clientId, clientId))
    .limit(1);

  const planRows = (await db
    .select()
    .from(plans)
    .where(eq(plans.userId, clientId))
    .orderBy(desc(plans.createdAt))) as PlanRow[];

  const fromUser = alias(users, 'from_user');
  const toUser = alias(users, 'to_user');
  const messageRows = (await db
    .select({
      id: messages.id,
      body: messages.body,
      fromUserId: messages.fromUserId,
      toUserId: messages.toUserId,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
      fromName: fromUser.displayName,
      fromEmail: fromUser.email,
      toName: toUser.displayName,
      toEmail: toUser.email,
    })
    .from(messages)
    .innerJoin(fromUser, eq(messages.fromUserId, fromUser.id))
    .innerJoin(toUser, eq(messages.toUserId, toUser.id))
    .where(or(eq(messages.fromUserId, clientId), eq(messages.toUserId, clientId)))
    .orderBy(messages.createdAt)
    .limit(200)) as MessageRow[];

  const reinforcements = (await db
    .select()
    .from(dailyReinforcements)
    .where(eq(dailyReinforcements.clientId, clientId))
    .orderBy(desc(dailyReinforcements.createdAt))
    .limit(20)) as ReinforcementRow[];

  const reinforcementIds = reinforcements.map((r) => r.id);
  const responses: ReinforcementResponseRow[] =
    reinforcementIds.length > 0
      ? ((await db
          .select()
          .from(reinforcementResponses)
          .where(eq(reinforcementResponses.clientId, clientId))
          .orderBy(desc(reinforcementResponses.submittedAt))
          .limit(100)) as ReinforcementResponseRow[])
      : [];

  const calendarEntries = (await db
    .select()
    .from(dailyCalendarEntries)
    .where(eq(dailyCalendarEntries.clientId, clientId))
    .orderBy(desc(dailyCalendarEntries.dateIso))
    .limit(14)) as CalendarRow[];

  const feedbackRows = (await db
    .select()
    .from(dailyScheduleFeedback)
    .where(eq(dailyScheduleFeedback.clientId, clientId))
    .orderBy(desc(dailyScheduleFeedback.dateIso))
    .limit(30)) as FeedbackRow[];

  const holisticRows = (await db
    .select()
    .from(holisticCompletions)
    .where(eq(holisticCompletions.clientId, clientId))
    .orderBy(desc(holisticCompletions.completedAt))
    .limit(50)) as HolisticRow[];

  const checkInRows = (await db
    .select()
    .from(weeklyCheckIns)
    .where(eq(weeklyCheckIns.clientId, clientId))
    .orderBy(desc(weeklyCheckIns.weekNumber))
    .limit(12)) as Array<typeof weeklyCheckIns.$inferSelect>;

  const reflectionRows = (await db
    .select()
    .from(eveningReflections)
    .where(eq(eveningReflections.clientId, clientId))
    .orderBy(desc(eveningReflections.dateIso))
    .limit(30)) as Array<typeof eveningReflections.$inferSelect>;

  const artifacts: ArtifactRow[] = consent?.dataStorageEnabled
    ? ((await db
        .select({
          id: supportArtifacts.id,
          kind: supportArtifacts.kind,
          title: supportArtifacts.title,
          bodyText: supportArtifacts.bodyText,
          createdAt: supportArtifacts.createdAt,
        })
        .from(supportArtifacts)
        .where(eq(supportArtifacts.userId, clientId))
        .orderBy(desc(supportArtifacts.createdAt))
        .limit(50)) as ArtifactRow[])
    : [];

  let weeklySummary: WeeklySummary | null = null;
  try {
    weeklySummary = await buildWeeklySummary(clientId);
  } catch {
    /* optional */
  }

  const parsedPlans: AdminDossierPlan[] = planRows.map((p) => {
    let overview: string | null = null;
    let weekCount = 0;
    let clientSummary: string | null = null;
    try {
      const content = JSON.parse(p.generatedContent) as GeneratedPlan;
      overview = content.overview ?? null;
      clientSummary = content.clientSummary ?? null;
      weekCount = content.weeks?.length ?? 0;
    } catch {
      /* ignore */
    }
    return {
      id: p.id,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() ?? null,
      counselorId: p.counselorId,
      counselorNotes: p.counselorNotes,
      overview,
      clientSummary,
      weekCount,
      generatedContent: p.generatedContent,
    };
  });

  const approvedPlan = parsedPlans.find((p) => p.status === 'approved') ?? parsedPlans[0];

  return {
    client: {
      id: client.id,
      displayName: client.displayName,
      email: client.email,
      phone: client.phone,
      role: client.role,
      createdAt: client.createdAt.toISOString(),
    },
    consent: consent
      ? {
          dataStorageEnabled: consent.dataStorageEnabled,
          enabledAt: consent.enabledAt?.toISOString() ?? null,
          reflectionEncryptionEnabled: consent.reflectionEncryptionEnabled,
        }
      : null,
    intake: intake
      ? {
          id: intake.id,
          painSource: intake.painSource,
          painSourceOther: intake.painSourceOther,
          painDescription: intake.painDescription,
          painDuration: intake.painDuration,
          ageRange: intake.ageRange,
          gender: intake.gender,
          occupation: intake.occupation,
          affectsWork: intake.affectsWork,
          hasDependents: intake.hasDependents,
          priorTherapy: intake.priorTherapy,
          countryRegion: intake.countryRegion,
          activitiesAffected: intake.activitiesAffected,
          biggestChange: intake.biggestChange,
          recoveryGoal: intake.recoveryGoal,
          recoveryTimeline: intake.recoveryTimeline,
          currentTreatment: intake.currentTreatment,
          socialSupport: intake.socialSupport,
          structurePreference: intake.structurePreference,
          engagementTime: intake.engagementTime,
          ayurvedaPreferences: intake.ayurvedaPreferences,
          hasRedFlags: intake.hasRedFlags,
          isSafe: intake.isSafe,
          consentGiven: intake.consentGiven,
          completedAt: intake.completedAt?.toISOString() ?? null,
          updatedAt: intake.updatedAt.toISOString(),
        }
      : null,
    counselor: assignment
      ? {
          id: assignment.counselorId,
          name: assignment.counselorName,
          email: assignment.counselorEmail,
          phone: assignment.counselorPhone,
          assignedAt: assignment.assignedAt.toISOString(),
        }
      : null,
    plans: parsedPlans,
    approvedPlanContent: approvedPlan?.generatedContent ?? null,
    messages: messageRows.map(
      (m): AdminDossierMessage => ({
      id: m.id,
      body: m.body,
      direction: m.fromUserId === clientId ? 'outbound' : 'inbound',
      from: {
        id: m.fromUserId,
        label: m.fromName ?? m.fromEmail,
      },
      to: {
        id: m.toUserId,
        label: m.toName ?? m.toEmail,
      },
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      }),
    ),
    reinforcements: reinforcements.map((r) => ({
      id: r.id,
      title: r.title,
      bodyText: r.bodyText,
      hasCounselorAudio: Boolean(r.counselorAudioUrl),
      planWeek: r.planWeek,
      startDate: r.startDate,
      endDate: r.endDate,
      createdAt: r.createdAt.toISOString(),
      responses: responses
        .filter((resp) => resp.reinforcementId === r.id)
        .map((resp) => ({
          id: resp.id,
          responseType: resp.responseType,
          bodyText: resp.bodyText,
          hasAudio: Boolean(resp.audioUrl),
          submittedAt: resp.submittedAt.toISOString(),
        })),
    })),
    calendar: calendarEntries.map((c) => ({
      dateIso: c.dateIso,
      updatedAt: c.updatedAt.toISOString(),
      blocks: parseCalendarBlocks(c.blocks),
    })),
    scheduleFeedback: feedbackRows.map((f) => ({
      dateIso: f.dateIso,
      workedText: f.workedText,
      didntWorkText: f.didntWorkText,
      submittedAt: f.submittedAt.toISOString(),
    })),
    holisticCompletions: holisticRows.map((h) => ({
      id: h.id,
      dateIso: h.dateIso,
      weekNumber: h.weekNumber,
      activityType: h.activityType,
      notes: h.notes,
      completedAt: h.completedAt.toISOString(),
    })),
    artifacts: artifacts.map((a) => ({
      id: a.id,
      kind: a.kind,
      title: a.title,
      bodyText: a.bodyText,
      createdAt: a.createdAt.toISOString(),
    })),
    weeklySummary,
    weeklyCheckIns: checkInRows.map((c) => ({
      id: c.id,
      weekNumber: c.weekNumber,
      weekStartIso: c.weekStartIso,
      summary: formatWeeklyCheckInSummary(parseWeeklyCheckInAnswers(c.answersJson)),
      submittedAt: c.submittedAt.toISOString(),
    })),
    eveningReflections: reflectionRows.map((r) => ({
      dateIso: r.dateIso,
      bodyText: r.bodyText,
      submittedAt: r.submittedAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  } satisfies AdminClientDossier;
}

