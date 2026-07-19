import { NextResponse } from 'next/server';

import { INSTRUMENTS, PILOT_INSTRUMENT_ORDER } from '@/lib/outcome-instruments';
import { getUserFromRequest } from '@/lib/session';

/** Instrument definitions (item text + scales) — single source of truth for mobile. */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  return NextResponse.json({
    ok: true,
    order: PILOT_INSTRUMENT_ORDER,
    instruments: PILOT_INSTRUMENT_ORDER.map((id) => INSTRUMENTS[id]),
  });
}
