import { NextResponse } from 'next/server';

import { buildMobileSessionUser } from '@/lib/mobile-user';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sessionUser = await buildMobileSessionUser(user.id);
  if (!sessionUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ user: sessionUser });
}
