import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { plans, users } from '@/db/schema';
import { getUserFromCookieHeader } from '@/lib/session';
import { regeneratePlanDraftForUser } from '@/lib/regenerate-plan-for-user';
import { sendPushToUser } from '@/lib/expo-push';

export async function POST(request: Request) {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));

  if (!user || user.role !== 'provider') {
    return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { userId?: string };
  const { userId } = body;

  if (!userId) {
    return Response.json({ ok: false, reason: 'missing_user_id' }, { status: 400 });
  }

  const db = getDb();

  // Check if a plan already exists for this user
  const [existing] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.userId, userId))
    .limit(1);

  if (existing) {
    return Response.json({ ok: false, reason: 'plan_exists' }, { status: 200 });
  }

  // Generate the plan
  const planId = await regeneratePlanDraftForUser(userId);
  if (!planId) {
    return Response.json({ ok: false, reason: 'generation_failed' }, { status: 500 });
  }

  // Send push notification to all admin users
  const adminUsers = await db
    .select({ expoPushToken: users.expoPushToken })
    .from(users)
    .where(eq(users.role, 'admin'));

  const clientEmail = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .then(rows => rows[0]?.email ?? 'unknown');

  const [clientFirstChar] = clientEmail.split('@');
  const anonEmail = `${clientFirstChar[0]}***@${clientEmail.split('@')[1]}`;

  for (const admin of adminUsers) {
    if (admin.expoPushToken) {
      void sendPushToUser(
        admin.expoPushToken,
        'New plan draft ready',
        `Plan generated for ${anonEmail}`,
      );
    }
  }

  return Response.json({ ok: true, planId });
}
