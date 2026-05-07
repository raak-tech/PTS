import { randomUUID } from 'node:crypto';

import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { supportAuditEvents } from '../db/schema';

export type SupportAuditKind = 'consent-updated' | 'artifact-saved' | 'export-viewed' | 'delete-requested';

export function createSupportAuditDetail(kind: SupportAuditKind, detail: string) {
  return {
    id: randomUUID(),
    kind,
    detail,
    createdAt: new Date(),
  };
}

export async function recordSupportAuditEvent(
  db: PostgresJsDatabase,
  userId: string,
  kind: SupportAuditKind,
  detail: string,
) {
  await db.insert(supportAuditEvents).values({
    id: randomUUID(),
    userId,
    kind,
    detail,
    createdAt: new Date(),
  });
}
