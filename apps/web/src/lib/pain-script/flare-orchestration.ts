import { randomUUID } from 'node:crypto';

import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { dailyReinforcements, flareEvents } from '@/db/schema';
import { formatWeeklyCheckInSummary } from '@/lib/check-in-prompts';
import { log } from '@/lib/logger';
import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { classifyFlare } from '@/lib/pain-script/flare-classifier';
import { buildFlareClientMessage, pickFlareIntervention } from '@/lib/pain-script/flare-copy';
import { getApprovedFormulation, insertRescoreDraftFormulation } from '@/lib/pain-script/formulation-store';
import { runFormulationRescore } from '@/lib/pain-script/formulation-rescore';
import { shouldTriggerFormulationRescore } from '@/lib/pain-script/rescore-gate';
import { buildWeeklySummary } from '@/lib/weekly-summary';

export async function handleWeeklyCheckInRescore(opts: {
  userId: string;
  weekNumber: number;
  answers: { q1: string; q2: string; q3: string };
}): Promise<void> {
  const cohort = await getUserPilotCohort(opts.userId);
  if (!usesPainScriptPath(cohort)) return;

  const summary = await buildWeeklySummary(opts.userId);
  const freeText = formatWeeklyCheckInSummary(opts.answers);
  const gate = shouldTriggerFormulationRescore(summary, freeText);

  if (!gate.shouldRescore) {
    log('rescore_skipped_gate', { userId: opts.userId, weekNumber: opts.weekNumber });
    return;
  }

  const approved = await getApprovedFormulation(opts.userId);
  if (!approved) return;

  const result = await runFormulationRescore(
    approved.formulation,
    summary,
    freeText,
    { userId: opts.userId, weekNumber: opts.weekNumber },
  );

  if (!result?.materialChange) {
    log('rescore_no_material_change', { userId: opts.userId, note: result?.note });
    return;
  }

  await insertRescoreDraftFormulation({
    userId: opts.userId,
    intakeResponseId: approved.intakeResponseId,
    formulation: approved.formulation,
    counselorNote: result.note,
  });

  log('rescore_draft_created', { userId: opts.userId, reasons: gate.reasons });
}

export async function recordFlareEvent(opts: {
  clientId: string;
  painLevel?: number | null;
  triggerText?: string | null;
}): Promise<{
  id: string;
  classification: Awaited<ReturnType<typeof classifyFlare>>;
  message: ReturnType<typeof buildFlareClientMessage>;
}> {
  const triggerText = opts.triggerText?.trim() ?? '';
  const classification = await classifyFlare(triggerText, opts.painLevel ?? null, {
    userId: opts.clientId,
  });

  const { key } = pickFlareIntervention(classification.tags);

  const db = getDb();
  const [readOut] = await db
    .select({ bodyText: dailyReinforcements.bodyText })
    .from(dailyReinforcements)
    .where(eq(dailyReinforcements.clientId, opts.clientId))
    .orderBy(desc(dailyReinforcements.createdAt))
    .limit(1);

  const message = buildFlareClientMessage({
    tags: classification.tags,
    readOutBody: readOut?.bodyText,
  });

  const id = randomUUID();
  await db.insert(flareEvents).values({
    id,
    clientId: opts.clientId,
    painLevel: opts.painLevel ?? null,
    triggerText: triggerText || null,
    tagsJson: JSON.stringify(classification.tags),
    severity: classification.severity,
    safetyConcern: classification.safetyConcern,
    interventionKey: key,
    createdAt: new Date(),
  });

  return { id, classification, message };
}
