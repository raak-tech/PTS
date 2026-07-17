import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logError } from '@/lib/logger';
import { recordFlareEvent } from '@/lib/pain-script/flare-orchestration';
import { getUserFromRequest } from '@/lib/session';

const bodySchema = z.object({
  painLevel: z.number().int().min(0).max(10).optional(),
  triggerText: z.string().max(3000).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'client') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const result = await recordFlareEvent({
      clientId: user.id,
      painLevel: parsed.data.painLevel,
      triggerText: parsed.data.triggerText,
    });

    return NextResponse.json({
      ok: true,
      flareId: result.id,
      safetyConcern: result.classification.safetyConcern,
      severity: result.classification.severity,
      message: result.message,
    });
  } catch (err) {
    logError('flare_post_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
