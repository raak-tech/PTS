import { randomUUID } from 'node:crypto';

import { getDb } from '@/db';
import { auditLog } from '@/db/schema';
import { logError } from '@/lib/logger';

export type AuditInput = {
  actorUserId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditLog).values({
      id: randomUUID(),
      createdAt: new Date(),
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
  } catch (err) {
    logError('audit_record_failed', err, { action: input.action });
  }
}
