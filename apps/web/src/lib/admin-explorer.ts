import { desc } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  auditLog,
  dailyCheckIns,
  holisticCompletions,
  intakeResponses,
  llmUsage,
  messages,
  planWeeks,
  plans,
  supportArtifacts,
  users,
  weeklyCheckIns,
} from '@/db/schema';

export const EXPLORER_TABLES = [
  'users',
  'intakes',
  'plans',
  'plan_weeks',
  'messages',
  'support_artifacts',
  'daily_check_ins',
  'holistic_completions',
  'weekly_check_ins',
  'llm_usage',
  'audit_log',
] as const;

export type ExplorerTable = (typeof EXPLORER_TABLES)[number];

export function isExplorerTable(value: string): value is ExplorerTable {
  return (EXPLORER_TABLES as readonly string[]).includes(value);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local[0] ?? ''}***@${domain}`;
}

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

export async function queryExplorerTable(
  table: ExplorerTable,
  page = 1,
  pageSize = 50,
): Promise<{ rows: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
  const db = getDb();
  const limit = Math.min(Math.max(pageSize, 10), 100);
  const offset = (Math.max(page, 1) - 1) * limit;

  switch (table) {
    case 'users': {
      const rows = await db
        .select({
          id: users.id,
          role: users.role,
          displayName: users.displayName,
          email: users.email,
          phone: users.phone,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: users.id }).from(users);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          id: r.id,
          role: r.role,
          displayName: r.displayName,
          email: maskEmail(r.email),
          phone: maskPhone(r.phone),
          createdAt: r.createdAt.toISOString(),
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'intakes': {
      const rows = await db
        .select({
          id: intakeResponses.id,
          userId: intakeResponses.userId,
          painSource: intakeResponses.painSource,
          hasRedFlags: intakeResponses.hasRedFlags,
          isSafe: intakeResponses.isSafe,
          completedAt: intakeResponses.completedAt,
        })
        .from(intakeResponses)
        .orderBy(desc(intakeResponses.completedAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: intakeResponses.id }).from(intakeResponses);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          ...r,
          completedAt: r.completedAt?.toISOString() ?? null,
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'plans': {
      const rows = await db
        .select({
          id: plans.id,
          userId: plans.userId,
          status: plans.status,
          counselorId: plans.counselorId,
          createdAt: plans.createdAt,
          approvedAt: plans.approvedAt,
        })
        .from(plans)
        .orderBy(desc(plans.createdAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: plans.id }).from(plans);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          approvedAt: r.approvedAt?.toISOString() ?? null,
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'plan_weeks': {
      const rows = await db
        .select({
          id: planWeeks.id,
          planId: planWeeks.planId,
          weekNumber: planWeeks.weekNumber,
          status: planWeeks.status,
          approvedAt: planWeeks.approvedAt,
          createdAt: planWeeks.createdAt,
        })
        .from(planWeeks)
        .orderBy(desc(planWeeks.createdAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: planWeeks.id }).from(planWeeks);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          ...r,
          approvedAt: r.approvedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'messages': {
      const rows = await db
        .select({
          id: messages.id,
          fromUserId: messages.fromUserId,
          toUserId: messages.toUserId,
          body: messages.body,
          createdAt: messages.createdAt,
          readAt: messages.readAt,
        })
        .from(messages)
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: messages.id }).from(messages);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          id: r.id,
          fromUserId: r.fromUserId,
          toUserId: r.toUserId,
          preview: r.body.slice(0, 120),
          createdAt: r.createdAt.toISOString(),
          readAt: r.readAt?.toISOString() ?? null,
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'support_artifacts': {
      const rows = await db
        .select({
          id: supportArtifacts.id,
          userId: supportArtifacts.userId,
          kind: supportArtifacts.kind,
          title: supportArtifacts.title,
          bodyText: supportArtifacts.bodyText,
          createdAt: supportArtifacts.createdAt,
        })
        .from(supportArtifacts)
        .orderBy(desc(supportArtifacts.createdAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: supportArtifacts.id }).from(supportArtifacts);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          ...r,
          bodyText: r.bodyText.slice(0, 160),
          createdAt: r.createdAt.toISOString(),
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'daily_check_ins': {
      const rows = await db
        .select()
        .from(dailyCheckIns)
        .orderBy(desc(dailyCheckIns.submittedAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: dailyCheckIns.id }).from(dailyCheckIns);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          ...r,
          submittedAt: r.submittedAt.toISOString(),
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'holistic_completions': {
      const rows = await db
        .select()
        .from(holisticCompletions)
        .orderBy(desc(holisticCompletions.completedAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: holisticCompletions.id }).from(holisticCompletions);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          ...r,
          completedAt: r.completedAt.toISOString(),
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'weekly_check_ins': {
      const rows = await db
        .select()
        .from(weeklyCheckIns)
        .orderBy(desc(weeklyCheckIns.submittedAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: weeklyCheckIns.id }).from(weeklyCheckIns);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          ...r,
          submittedAt: r.submittedAt.toISOString(),
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'llm_usage': {
      const rows = await db
        .select()
        .from(llmUsage)
        .orderBy(desc(llmUsage.createdAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: llmUsage.id }).from(llmUsage);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          operation: r.operation,
          model: r.model,
          userId: r.userId,
          planId: r.planId,
          weekNumber: r.weekNumber,
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          costUsd: r.costUsd ? Number(r.costUsd) : null,
          status: r.status,
          latencyMs: r.latencyMs,
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    case 'audit_log': {
      const rows = await db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset);
      const all = await db.select({ id: auditLog.id }).from(auditLog);
      return {
        rows: rows.map((r: (typeof rows)[number]) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          actorUserId: r.actorUserId,
          actorRole: r.actorRole,
          action: r.action,
          targetType: r.targetType,
          targetId: r.targetId,
          metadata: r.metadata,
        })),
        total: all.length,
        page,
        pageSize: limit,
      };
    }

    default:
      return { rows: [], total: 0, page, pageSize: limit };
  }
}

export async function queryAuditLog(page = 1, pageSize = 50) {
  return queryExplorerTable('audit_log', page, pageSize);
}
