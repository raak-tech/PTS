import { NextResponse } from 'next/server';

import { isAdminUser } from '@/lib/admin';
import { getAdminClientDossier } from '@/lib/admin-client-dossier';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const dossier = await getAdminClientDossier(id);
    if (!dossier) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, dossier });
  } catch (err) {
    logError('admin_client_dossier_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
