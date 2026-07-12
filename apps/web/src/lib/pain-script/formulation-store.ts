import { randomUUID } from 'node:crypto';

import { and, desc, eq, ne } from 'drizzle-orm';

import { getDb } from '@/db';
import { formulations } from '@/db/schema';
import type { FormulationGenerationResult, PainScriptFormulation } from '@/lib/pain-script/types';

export type StoredFormulation = {
  id: string;
  userId: string;
  intakeResponseId: string;
  version: number;
  status: string;
  formulation: PainScriptFormulation;
  safetyFlag: boolean;
  safetyReason: string | null;
  counselorNote: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
};

function rowToFormulation(row: typeof formulations.$inferSelect): StoredFormulation {
  return {
    id: row.id,
    userId: row.userId,
    intakeResponseId: row.intakeResponseId,
    version: row.version,
    status: row.status,
    formulation: {
      scriptBeliefs: JSON.parse(row.scriptBeliefs),
      scriptDisplays: JSON.parse(row.scriptDisplays),
      reinforcingExperiences: JSON.parse(row.reinforcingExperiences),
      basicId: JSON.parse(row.basicId),
      maintenanceHypothesis: row.maintenanceHypothesis,
      primaryTargets: JSON.parse(row.primaryTargets),
      confidence: row.confidenceJson ? JSON.parse(row.confidenceJson) : {},
    },
    safetyFlag: row.safetyFlag,
    safetyReason: row.safetyReason,
    counselorNote: row.counselorNote,
    approvedAt: row.approvedAt,
    approvedBy: row.approvedBy,
  };
}

export async function saveFormulationDraft(
  userId: string,
  intakeResponseId: string,
  result: FormulationGenerationResult,
  source: 'llm' | 'counselor' | 'llm+counselor' = 'llm',
): Promise<string> {
  const db = getDb();
  const now = new Date();

  const [latest] = await db
    .select({ version: formulations.version })
    .from(formulations)
    .where(eq(formulations.userId, userId))
    .orderBy(desc(formulations.version))
    .limit(1);

  const version = (latest?.version ?? 0) + 1;

  // Mark prior non-superseded drafts as superseded when inserting new draft
  await db
    .update(formulations)
    .set({ status: 'superseded', updatedAt: now })
    .where(and(eq(formulations.userId, userId), ne(formulations.status, 'approved')));

  const id = randomUUID();
  await db.insert(formulations).values({
    id,
    userId,
    intakeResponseId,
    version,
    scriptBeliefs: JSON.stringify(result.scriptBeliefs),
    scriptDisplays: JSON.stringify(result.scriptDisplays),
    reinforcingExperiences: JSON.stringify(result.reinforcingExperiences),
    basicId: JSON.stringify(result.basicId),
    maintenanceHypothesis: result.maintenanceHypothesis,
    primaryTargets: JSON.stringify(result.primaryTargets),
    confidenceJson: JSON.stringify(result.confidence),
    safetyFlag: result.safetyFlag,
    safetyReason: result.safetyReason ?? null,
    source,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function getCurrentFormulation(userId: string): Promise<StoredFormulation | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(formulations)
    .where(and(eq(formulations.userId, userId), ne(formulations.status, 'superseded')))
    .orderBy(desc(formulations.version))
    .limit(1);
  return row ? rowToFormulation(row) : null;
}

export async function getApprovedFormulation(userId: string): Promise<StoredFormulation | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(formulations)
    .where(and(eq(formulations.userId, userId), eq(formulations.status, 'approved')))
    .orderBy(desc(formulations.version))
    .limit(1);
  return row ? rowToFormulation(row) : null;
}

export async function updateFormulationDraft(
  formulationId: string,
  patch: Partial<PainScriptFormulation> & { counselorNote?: string },
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(formulations)
    .where(eq(formulations.id, formulationId))
    .limit(1);
  if (!row) throw new Error('formulation_not_found');

  const current = rowToFormulation(row).formulation;
  const merged = { ...current, ...patch };

  await db
    .update(formulations)
    .set({
      scriptBeliefs: JSON.stringify(merged.scriptBeliefs),
      scriptDisplays: JSON.stringify(merged.scriptDisplays),
      reinforcingExperiences: JSON.stringify(merged.reinforcingExperiences),
      basicId: JSON.stringify(merged.basicId),
      maintenanceHypothesis: merged.maintenanceHypothesis,
      primaryTargets: JSON.stringify(merged.primaryTargets),
      confidenceJson: JSON.stringify(merged.confidence),
      counselorNote: patch.counselorNote ?? row.counselorNote,
      status: 'edited',
      updatedAt: now,
    })
    .where(eq(formulations.id, formulationId));
}

export async function approveFormulation(
  formulationId: string,
  counselorId: string,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(formulations)
    .set({
      status: 'approved',
      approvedAt: now,
      approvedBy: counselorId,
      counselorId,
      updatedAt: now,
    })
    .where(eq(formulations.id, formulationId));
}
