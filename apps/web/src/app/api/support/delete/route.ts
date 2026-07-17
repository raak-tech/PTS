import { NextResponse } from 'next/server';

import { getDb } from '../../../../db';
import { clearSessionCookie } from '../../../../lib/cookies';
import { deleteClientAccountData } from '../../../../lib/delete-client-account';
import { logError } from '../../../../lib/logger';
import { getUserFromRequest } from '../../../../lib/session';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

/** Hard-delete the signed-in client account + related data. */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    if (user.role !== 'client') {
      return NextResponse.json({ error: 'clients_only' }, { status: 403 });
    }

    await deleteClientAccountData(getDb(), {
      id: user.id,
      phone: user.phone ?? null,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(clearSessionCookie());
    return response;
  } catch (err) {
    logError('delete_account_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
