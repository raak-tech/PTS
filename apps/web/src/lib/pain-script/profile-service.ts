import { randomUUID } from 'node:crypto';

import { and, desc, eq, isNull } from 'drizzle-orm';

import { getDb } from '@/db';
import { clientProfile, consentGrants, profileFieldRequests } from '@/db/schema';
import { getUserPilotCohort } from '@/lib/pain-script/cohort';
import { getApprovedFormulation, insertRescoreDraftFormulation } from '@/lib/pain-script/formulation-store';
import { runFormulationRescore } from '@/lib/pain-script/formulation-rescore';
import {
  CONSENT_SCOPES,
  isProfileFieldKey,
  NON_SENSITIVE_PROFILE_KEYS,
  PROFILE_FIELD_DEFS,
  type ConsentScope,
  type ProfileFieldKey,
} from '@/lib/pain-script/profile-fields';
import { usesPainScriptPath } from '@/lib/pain-script/flags';
import { shouldTriggerFormulationRescore } from '@/lib/pain-script/rescore-gate';
import { log } from '@/lib/logger';
import { buildWeeklySummary } from '@/lib/weekly-summary';

export type ProfileFieldView = {
  key: ProfileFieldKey;
  label: string;
  value: string | null;
  sensitive: boolean;
  consentScope: ConsentScope | null;
  editable: boolean;
  lockedReason?: string;
};

export type FieldRequestView = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  prompt: string;
  status: string;
  createdAt: string;
};

export type ConsentGrantView = {
  scope: ConsentScope;
  granted: boolean;
  grantedAt: string | null;
};

export type ClientProfileView = {
  fields: ProfileFieldView[];
  completeness: number;
  completenessLabel: string;
  pendingFieldRequests: FieldRequestView[];
  consentGrants: ConsentGrantView[];
  microPrompt: { fieldKey: ProfileFieldKey; label: string; prompt: string } | null;
};

function fieldValue(profile: typeof clientProfile.$inferSelect | undefined, key: ProfileFieldKey): string | null {
  if (!profile) return null;
  const val = profile[key] as string | null;
  return val?.trim() ? val.trim() : null;
}

function computeCompleteness(profile: typeof clientProfile.$inferSelect | undefined): number {
  let filled = 0;
  for (const key of NON_SENSITIVE_PROFILE_KEYS) {
    if (fieldValue(profile, key)) filled += 1;
  }
  return NON_SENSITIVE_PROFILE_KEYS.length > 0 ? filled / NON_SENSITIVE_PROFILE_KEYS.length : 0;
}

async function loadActiveConsents(userId: string): Promise<Map<ConsentScope, Date>> {
  const db = getDb();
  const rows = await db
    .select()
    .from(consentGrants)
    .where(and(eq(consentGrants.userId, userId), isNull(consentGrants.revokedAt)));

  const map = new Map<ConsentScope, Date>();
  for (const row of rows) {
    if ((CONSENT_SCOPES as readonly string[]).includes(row.scope) && row.grantedAt) {
      map.set(row.scope as ConsentScope, row.grantedAt);
    }
  }
  return map;
}

function hasConsent(active: Map<ConsentScope, Date>, scope: ConsentScope | null): boolean {
  if (!scope) return true;
  return active.has(scope);
}

export async function getClientProfileView(userId: string): Promise<ClientProfileView> {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(clientProfile)
    .where(eq(clientProfile.userId, userId))
    .limit(1);

  const activeConsents = await loadActiveConsents(userId);
  const completeness = computeCompleteness(profile);

  const fields: ProfileFieldView[] = PROFILE_FIELD_DEFS.map((def) => {
    const consentOk = hasConsent(activeConsents, def.consentScope);
    const editable = !def.sensitive || consentOk;
    return {
      key: def.key,
      label: def.label,
      value: fieldValue(profile, def.key),
      sensitive: def.sensitive,
      consentScope: def.consentScope,
      editable,
      lockedReason:
        def.sensitive && !consentOk
          ? 'Enable medical sharing consent below to edit this field.'
          : undefined,
    };
  });

  const pendingRows = await db
    .select()
    .from(profileFieldRequests)
    .where(and(eq(profileFieldRequests.clientId, userId), eq(profileFieldRequests.status, 'pending')))
    .orderBy(desc(profileFieldRequests.createdAt));

  const pendingFieldRequests: FieldRequestView[] = pendingRows.map((row) => ({
    id: row.id,
    fieldKey: row.fieldKey,
    fieldLabel: isProfileFieldKey(row.fieldKey) ? PROFILE_FIELD_DEFS.find((d) => d.key === row.fieldKey)?.label ?? row.fieldKey : row.fieldKey,
    prompt: row.prompt,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }));

  const consentGrantViews: ConsentGrantView[] = CONSENT_SCOPES.map((scope) => {
    const grantedAt = activeConsents.get(scope);
    return {
      scope,
      granted: Boolean(grantedAt),
      grantedAt: grantedAt?.toISOString() ?? null,
    };
  });

  const emptyField = PROFILE_FIELD_DEFS.find(
    (def) => !def.sensitive && !fieldValue(profile, def.key),
  );
  const microPrompt = emptyField
    ? { fieldKey: emptyField.key, label: emptyField.label, prompt: emptyField.microPrompt }
    : null;

  const pct = Math.round(completeness * 100);
  return {
    fields,
    completeness,
    completenessLabel: `${pct}% complete`,
    pendingFieldRequests,
    consentGrants: consentGrantViews,
    microPrompt,
  };
}

export async function updateClientProfile(
  userId: string,
  patch: Partial<Record<ProfileFieldKey, string | null>>,
): Promise<{ ok: true; changedKeys: ProfileFieldKey[] } | { ok: false; error: string; consentScope?: ConsentScope }> {
  const activeConsents = await loadActiveConsents(userId);
  const changedKeys: ProfileFieldKey[] = [];
  const updates: Partial<Record<ProfileFieldKey, string | null>> = {};

  for (const [rawKey, rawVal] of Object.entries(patch)) {
    if (!isProfileFieldKey(rawKey)) continue;
    const def = PROFILE_FIELD_DEFS.find((d) => d.key === rawKey);
    if (!def) continue;
    if (def.consentScope && !hasConsent(activeConsents, def.consentScope)) {
      return { ok: false, error: 'consent_required', consentScope: def.consentScope };
    }
    const val = typeof rawVal === 'string' ? rawVal.trim() || null : null;
    updates[rawKey] = val;
    changedKeys.push(rawKey);
  }

  if (changedKeys.length === 0) {
    return { ok: false, error: 'no_valid_fields' };
  }

  const db = getDb();
  const now = new Date();
  const [existing] = await db
    .select()
    .from(clientProfile)
    .where(eq(clientProfile.userId, userId))
    .limit(1);

  if (existing) {
    await db.update(clientProfile).set({ ...updates, updatedAt: now }).where(eq(clientProfile.userId, userId));
  } else {
    await db.insert(clientProfile).values({
      userId,
      createdAt: now,
      updatedAt: now,
      ...updates,
    });
  }

  void handleProfileMaterialUpdate(userId, changedKeys).catch((err) => {
    log('profile_rescore_error', { userId, err: String(err) });
  });

  return { ok: true, changedKeys };
}

export async function setConsentScope(
  userId: string,
  scope: ConsentScope,
  granted: boolean,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const [existing] = await db
    .select()
    .from(consentGrants)
    .where(and(eq(consentGrants.userId, userId), eq(consentGrants.scope, scope)))
    .limit(1);

  if (existing) {
    await db
      .update(consentGrants)
      .set({
        grantedAt: granted ? now : existing.grantedAt,
        revokedAt: granted ? null : now,
      })
      .where(eq(consentGrants.id, existing.id));
  } else if (granted) {
    await db.insert(consentGrants).values({
      id: randomUUID(),
      userId,
      scope,
      grantedAt: now,
      revokedAt: null,
      createdAt: now,
    });
  }
}

export async function answerFieldRequest(
  userId: string,
  requestId: string,
  value: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [request] = await db
    .select()
    .from(profileFieldRequests)
    .where(and(eq(profileFieldRequests.id, requestId), eq(profileFieldRequests.clientId, userId)))
    .limit(1);

  if (!request || request.status !== 'pending') {
    return { ok: false, error: 'not_found' };
  }

  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: 'empty_value' };

  if (isProfileFieldKey(request.fieldKey)) {
    const result = await updateClientProfile(userId, { [request.fieldKey]: trimmed });
    if (!result.ok) return result;
  }

  await db
    .update(profileFieldRequests)
    .set({ status: 'answered', answeredAt: new Date() })
    .where(eq(profileFieldRequests.id, requestId));

  return { ok: true };
}

export async function createProfileFieldRequest(opts: {
  counselorId: string;
  clientId: string;
  fieldKey: string;
  prompt: string;
}): Promise<string> {
  const id = randomUUID();
  const db = getDb();
  await db.insert(profileFieldRequests).values({
    id,
    clientId: opts.clientId,
    counselorId: opts.counselorId,
    fieldKey: opts.fieldKey,
    prompt: opts.prompt.trim(),
    status: 'pending',
    createdAt: new Date(),
  });
  return id;
}

async function handleProfileMaterialUpdate(userId: string, changedKeys: ProfileFieldKey[]): Promise<void> {
  const cohort = await getUserPilotCohort(userId);
  if (!usesPainScriptPath(cohort)) return;

  const medicalKeys: ProfileFieldKey[] = ['diagnosesContext', 'comorbidities', 'currentTreatments'];
  const medicalChanged = changedKeys.some((k) => medicalKeys.includes(k));
  if (!medicalChanged) return;

  const summary = await buildWeeklySummary(userId);
  const freeText = `Client updated profile fields: ${changedKeys.join(', ')}`;
  const gate = shouldTriggerFormulationRescore(summary, freeText);
  const reasons = [...gate.reasons];
  if (!gate.shouldRescore) {
    reasons.push('profile_medical_update');
  }

  const approved = await getApprovedFormulation(userId);
  if (!approved) return;

  const result = await runFormulationRescore(approved.formulation, summary, freeText, {
    userId,
    weekNumber: 0,
  });

  if (!result?.materialChange) {
    log('profile_rescore_no_material_change', { userId });
    return;
  }

  await insertRescoreDraftFormulation({
    userId,
    intakeResponseId: approved.intakeResponseId,
    formulation: approved.formulation,
    counselorNote: result.note,
    rescoreResult: result,
    gateReasons: reasons,
  });

  log('profile_rescore_draft_created', { userId, changedKeys });
}
