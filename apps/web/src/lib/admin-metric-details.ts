import { desc, eq, inArray, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { getDb } from '@/db';
import {
  auditLog,
  clientCounselor,
  intakeResponses,
  llmUsage,
  messages,
  planWeeks,
  plans,
  users,
} from '@/db/schema';

export const METRIC_DETAIL_KINDS = [
  'users',
  'clients',
  'counselors',
  'intakes',
  'plans',
  'pending-plans',
  'approved-plans',
  'assignments',
  'messages',
  'red-flags',
  'unsafe',
  'llm-usage',
  'audit',
] as const;

export type MetricDetailKind = (typeof METRIC_DETAIL_KINDS)[number];

export function isMetricDetailKind(value: string): value is MetricDetailKind {
  return (METRIC_DETAIL_KINDS as readonly string[]).includes(value);
}

import { displayEmail, displayPhone, displayText, userContactLabel } from '@/lib/pii';
import { describePendingPlanWeeks } from '@/lib/provider-console-access';

export async function getMetricDetail(kind: MetricDetailKind) {
  const db = getDb();
  const clientUser = alias(users, 'client_user');
  const counselorUser = alias(users, 'counselor_user');

  switch (kind) {
    case 'users': {
      const rows = (await db
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
        .limit(100)) as {
        id: string;
        role: string;
        displayName: string | null;
        email: string;
        phone: string | null;
        createdAt: Date;
      }[];

      return {
        kind,
        title: 'All users',
        rows: rows.map((r) => ({
          id: r.id,
          label: userContactLabel(r.displayName, r.email, r.phone),
          role: r.role,
          email: displayEmail(r.email),
          phone: displayPhone(r.phone),
          createdAt: r.createdAt.toISOString(),
        })),
      };
    }

    case 'clients': {
      const rows = (await db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          phone: users.phone,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, 'client'))
        .orderBy(desc(users.createdAt))
        .limit(100)) as {
        id: string;
        displayName: string | null;
        email: string;
        phone: string | null;
        createdAt: Date;
      }[];

      return {
        kind,
        title: 'Clients',
        rows: rows.map((r) => ({
          id: r.id,
          label: userContactLabel(r.displayName, r.email, r.phone),
          phone: displayPhone(r.phone),
          email: displayEmail(r.email),
          createdAt: r.createdAt.toISOString(),
        })),
      };
    }

    case 'counselors': {
      const rows = (await db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          phone: users.phone,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.role, 'provider'))
        .orderBy(desc(users.createdAt))
        .limit(100)) as {
        id: string;
        displayName: string | null;
        email: string;
        phone: string | null;
        createdAt: Date;
      }[];

      return {
        kind,
        title: 'Counselors',
        rows: rows.map((r) => ({
          id: r.id,
          label: userContactLabel(r.displayName, r.email, r.phone),
          phone: displayPhone(r.phone),
          email: displayEmail(r.email),
          createdAt: r.createdAt.toISOString(),
        })),
      };
    }

    case 'intakes': {
      const rows = (await db
        .select({
          intakeId: intakeResponses.id,
          userId: intakeResponses.userId,
          painSource: intakeResponses.painSource,
          recoveryGoal: intakeResponses.recoveryGoal,
          hasRedFlags: intakeResponses.hasRedFlags,
          isSafe: intakeResponses.isSafe,
          completedAt: intakeResponses.completedAt,
          displayName: users.displayName,
          email: users.email,
          phone: users.phone,
        })
        .from(intakeResponses)
        .innerJoin(users, eq(intakeResponses.userId, users.id))
        .orderBy(desc(intakeResponses.completedAt))
        .limit(100)) as {
        intakeId: string;
        userId: string;
        painSource: string;
        recoveryGoal: string;
        hasRedFlags: boolean;
        isSafe: boolean;
        completedAt: Date | null;
        displayName: string | null;
        email: string;
        phone: string | null;
      }[];

      return {
        kind,
        title: 'Completed intakes',
        rows: rows.map((r) => ({
          id: r.intakeId,
          userId: r.userId,
          label: userContactLabel(r.displayName, r.email, r.phone),
          painSource: r.painSource,
          recoveryGoal: displayText(r.recoveryGoal, 120),
          hasRedFlags: r.hasRedFlags,
          isSafe: r.isSafe,
          completedAt: r.completedAt?.toISOString() ?? null,
        })),
      };
    }

    case 'plans':
    case 'pending-plans':
    case 'approved-plans': {
      const where =
        kind === 'approved-plans'
          ? eq(plans.status, 'approved')
          : kind === 'pending-plans'
            ? ne(plans.status, 'approved')
            : undefined;

      const query = db
        .select({
          planId: plans.id,
          userId: plans.userId,
          status: plans.status,
          createdAt: plans.createdAt,
          approvedAt: plans.approvedAt,
          counselorNotes: plans.counselorNotes,
          displayName: users.displayName,
          email: users.email,
          phone: users.phone,
        })
        .from(plans)
        .innerJoin(users, eq(plans.userId, users.id))
        .orderBy(desc(plans.createdAt))
        .limit(100);

      const rows = (where ? await query.where(where) : await query) as {
        planId: string;
        userId: string;
        status: string;
        createdAt: Date;
        approvedAt: Date | null;
        counselorNotes: string | null;
        displayName: string | null;
        email: string;
        phone: string | null;
      }[];

      const planIds = rows.map((r) => r.planId);
      const weekRows =
        planIds.length > 0
          ? ((await db
              .select({
                planId: planWeeks.planId,
                weekNumber: planWeeks.weekNumber,
                status: planWeeks.status,
              })
              .from(planWeeks)
              .where(inArray(planWeeks.planId, planIds))) as {
              planId: string;
              weekNumber: number;
              status: string;
            }[])
          : [];

      const weeksByPlan: Record<string, { weekNumber: number; status: string }[]> = {};
      for (const row of weekRows) {
        if (!weeksByPlan[row.planId]) weeksByPlan[row.planId] = [];
        weeksByPlan[row.planId].push({ weekNumber: row.weekNumber, status: row.status });
      }

      const titles: Record<string, string> = {
        plans: 'All plans',
        'pending-plans': 'Pending plan drafts',
        'approved-plans': 'Approved plans',
      };

      return {
        kind,
        title: titles[kind],
        rows: rows.map((r) => ({
          id: r.planId,
          userId: r.userId,
          label: userContactLabel(r.displayName, r.email, r.phone),
          status: r.status,
          pendingWeeks: describePendingPlanWeeks(r.status, weeksByPlan[r.planId] ?? []),
          createdAt: r.createdAt.toISOString(),
          approvedAt: r.approvedAt?.toISOString() ?? null,
          crisisNote: r.counselorNotes?.includes('CRISIS') ?? false,
        })),
      };
    }

    case 'assignments': {
      const rows = (await db
        .select({
          clientId: clientCounselor.clientId,
          counselorId: clientCounselor.counselorId,
          assignedAt: clientCounselor.assignedAt,
          clientName: clientUser.displayName,
          clientEmail: clientUser.email,
          clientPhone: clientUser.phone,
          counselorName: counselorUser.displayName,
          counselorEmail: counselorUser.email,
          counselorPhone: counselorUser.phone,
        })
        .from(clientCounselor)
        .innerJoin(clientUser, eq(clientCounselor.clientId, clientUser.id))
        .innerJoin(counselorUser, eq(clientCounselor.counselorId, counselorUser.id))
        .orderBy(desc(clientCounselor.assignedAt))
        .limit(100)) as {
        clientId: string;
        counselorId: string;
        assignedAt: Date;
        clientName: string | null;
        clientEmail: string;
        clientPhone: string | null;
        counselorName: string | null;
        counselorEmail: string;
        counselorPhone: string | null;
      }[];

      return {
        kind,
        title: 'Client–counselor assignments',
        rows: rows.map((r) => ({
          id: r.clientId,
          clientId: r.clientId,
          counselorId: r.counselorId,
          clientLabel: userContactLabel(r.clientName, r.clientEmail, r.clientPhone),
          counselorLabel: userContactLabel(r.counselorName, r.counselorEmail, r.counselorPhone),
          assignedAt: r.assignedAt.toISOString(),
        })),
      };
    }

    case 'messages': {
      const fromUser = alias(users, 'from_user');
      const toUser = alias(users, 'to_user');

      const rows = (await db
        .select({
          id: messages.id,
          body: messages.body,
          createdAt: messages.createdAt,
          readAt: messages.readAt,
          fromName: fromUser.displayName,
          fromEmail: fromUser.email,
          fromPhone: fromUser.phone,
          toName: toUser.displayName,
          toEmail: toUser.email,
          toPhone: toUser.phone,
        })
        .from(messages)
        .innerJoin(fromUser, eq(messages.fromUserId, fromUser.id))
        .innerJoin(toUser, eq(messages.toUserId, toUser.id))
        .orderBy(desc(messages.createdAt))
        .limit(100)) as {
        id: string;
        body: string;
        createdAt: Date;
        readAt: Date | null;
        fromName: string | null;
        fromEmail: string;
        fromPhone: string | null;
        toName: string | null;
        toEmail: string;
        toPhone: string | null;
      }[];

      return {
        kind,
        title: 'Messages',
        rows: rows.map((r) => ({
          id: r.id,
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          from: userContactLabel(r.fromName, r.fromEmail, r.fromPhone),
          to: userContactLabel(r.toName, r.toEmail, r.toPhone),
          preview: displayText(r.body, 140),
          createdAt: r.createdAt.toISOString(),
          readAt: r.readAt?.toISOString() ?? null,
        })),
      };
    }

    case 'red-flags':
    case 'unsafe': {
      const rows = (await db
        .select({
          intakeId: intakeResponses.id,
          userId: intakeResponses.userId,
          painDescription: intakeResponses.painDescription,
          hasRedFlags: intakeResponses.hasRedFlags,
          isSafe: intakeResponses.isSafe,
          completedAt: intakeResponses.completedAt,
          displayName: users.displayName,
          email: users.email,
          phone: users.phone,
        })
        .from(intakeResponses)
        .innerJoin(users, eq(intakeResponses.userId, users.id))
        .where(
          kind === 'red-flags'
            ? eq(intakeResponses.hasRedFlags, true)
            : eq(intakeResponses.isSafe, false),
        )
        .orderBy(desc(intakeResponses.completedAt))
        .limit(100)) as {
        intakeId: string;
        userId: string;
        painDescription: string;
        hasRedFlags: boolean;
        isSafe: boolean;
        completedAt: Date | null;
        displayName: string | null;
        email: string;
        phone: string | null;
      }[];

      return {
        kind,
        title: kind === 'red-flags' ? 'Red-flag intakes' : 'Unsafe reports',
        rows: rows.map((r) => ({
          id: r.intakeId,
          userId: r.userId,
          label: userContactLabel(r.displayName, r.email, r.phone),
          painDescription: displayText(r.painDescription, 160),
          hasRedFlags: r.hasRedFlags,
          isSafe: r.isSafe,
          completedAt: r.completedAt?.toISOString() ?? null,
        })),
      };
    }

    case 'llm-usage': {
      const rows = (await db
        .select()
        .from(llmUsage)
        .orderBy(desc(llmUsage.createdAt))
        .limit(100)) as {
        id: string;
        createdAt: Date;
        operation: string;
        model: string;
        userId: string | null;
        costUsd: string | null;
        status: string;
        totalTokens: number | null;
      }[];

      return {
        kind,
        title: 'LLM usage (recent)',
        rows: rows.map((r) => ({
          id: r.id,
          label: r.operation,
          operation: r.operation,
          model: r.model,
          userId: r.userId,
          costUsd: r.costUsd ? Number(r.costUsd) : null,
          status: r.status,
          totalTokens: r.totalTokens,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    }

    case 'audit': {
      const rows = (await db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(100)) as {
        id: string;
        createdAt: Date;
        actorUserId: string;
        actorRole: string;
        action: string;
        targetType: string;
        targetId: string | null;
        metadata: string | null;
      }[];

      return {
        kind,
        title: 'Audit log (recent)',
        rows: rows.map((r) => ({
          id: r.id,
          label: r.action,
          actorUserId: r.actorUserId,
          actorRole: r.actorRole,
          action: r.action,
          targetType: r.targetType,
          targetId: r.targetId,
          metadata: r.metadata,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    }

    default:
      return { kind, title: 'Unknown', rows: [] };
  }
}
