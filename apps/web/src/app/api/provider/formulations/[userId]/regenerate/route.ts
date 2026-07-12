import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, intakeSessions } from '@/db/schema';
import { recordAudit } from '@/lib/audit';
import { assertProviderCanAccessClient } from '@/lib/client-access';
import { generateFormulation } from '@/lib/pain-script/formulation-generator';
import { saveFormulationDraft } from '@/lib/pain-script/formulation-store';
import {
  loadProfileSnapshot,
  seedClientProfileFromIntake,
} from '@/lib/pain-script/profile-snapshot';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';
import { canAccessProviderConsole } from '@/lib/provider-console-access';

export const maxDuration = 300;

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !canAccessProviderConsole(user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const { userId } = await context.params;
    if (!(await assertProviderCanAccessClient(user.id, userId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const db = getDb();
    const [saved] = await db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.userId, userId))
      .limit(1);
    if (!saved) {
      return NextResponse.json({ error: 'intake_missing' }, { status: 400 });
    }

    const [session] = await db
      .select({ rawText: intakeSessions.rawText })
      .from(intakeSessions)
      .where(eq(intakeSessions.userId, userId))
      .limit(1);

    await seedClientProfileFromIntake(userId, saved);
    const profile = await loadProfileSnapshot(userId);

    const result = await generateFormulation(
      {
        painSource: saved.painSource,
        painDescription: saved.painDescription,
        painDuration: saved.painDuration,
        activitiesAffected: saved.activitiesAffected,
        biggestChange: saved.biggestChange,
        recoveryGoal: saved.recoveryGoal,
        onsetType: saved.onsetType,
      },
      session?.rawText ?? null,
      profile,
      { userId },
    );

    const formulationId = await saveFormulationDraft(userId, saved.id, result);

    void recordAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'regenerate_formulation',
      targetType: 'formulation',
      targetId: formulationId,
      metadata: { clientId: userId },
    });

    return NextResponse.json({ ok: true, formulationId });
  } catch (err) {
    logError('formulation_regenerate_error', err);
    const message = err instanceof Error ? err.message : 'internal';
    return NextResponse.json({ error: 'internal', detail: message }, { status: 500 });
  }
}
