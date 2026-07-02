import { NextResponse } from 'next/server';

import { isAdminUser } from '@/lib/admin';
import { isExplorerTable, queryExplorerTable } from '@/lib/admin-explorer';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') ?? 'users';
    if (!isExplorerTable(table)) {
      return NextResponse.json({ error: 'invalid_table' }, { status: 400 });
    }

    const page = Number(searchParams.get('page') ?? '1');
    const pageSize = Number(searchParams.get('pageSize') ?? '50');

    const result = await queryExplorerTable(table, page, pageSize);
    return NextResponse.json({ ok: true, table, ...result });
  } catch (err) {
    logError('admin_explorer_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
