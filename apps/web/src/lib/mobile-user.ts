import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { intakeResponses, plans, users } from '@/db/schema';

export type MobileSessionUser = {
  id: string;
  role: string;
  displayName: string | null;
  phone: string | null;
  intakeComplete: boolean;
  planApproved: boolean;
};

export async function buildMobileSessionUser(userId: string): Promise<MobileSessionUser | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [intake] = await db
    .select({ completedAt: intakeResponses.completedAt })
    .from(intakeResponses)
    .where(eq(intakeResponses.userId, userId))
    .limit(1);

  const [plan] = await db
    .select({ status: plans.status })
    .from(plans)
    .where(and(eq(plans.userId, userId), eq(plans.status, 'approved')))
    .orderBy(desc(plans.createdAt))
    .limit(1);

  return {
    id: user.id,
    role: user.role,
    displayName: user.displayName,
    phone: user.phone,
    intakeComplete: Boolean(intake?.completedAt),
    planApproved: Boolean(plan),
  };
}
