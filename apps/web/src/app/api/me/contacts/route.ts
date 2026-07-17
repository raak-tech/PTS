import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { clientCounselor, counselorProfiles, messages, plans, users } from '@/db/schema';
import { logError } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/session';

type UserLabelRow = {
  id: string;
  displayName: string | null;
  phone: string | null;
  email: string;
};

function displayLabel(user: { displayName: string | null; phone: string | null; email: string }) {
  if (user.displayName) return user.displayName;
  if (user.phone) return user.phone.replace('+91', '+91 ');
  const [local, domain] = user.email.split('@');
  return domain === 'phone.pts.local' ? `+${local.replace(/^91/, '91 ')}` : user.email;
}

function parseStringList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

/** Public counselor card for assigned clients — no personal email/phone. */
export type PublicCounselorProfile = {
  id: string;
  name: string;
  title: string | null;
  credentials: string | null;
  bio: string | null;
  yearsExperience: string | null;
  specialisations: string[];
  languages: string[];
  calendlyUrl: string | null;
  sessionJoinUrl: string | null;
  unreadCount: number;
};

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const db = getDb();

    if (user.role === 'client') {
      const [assignment] = await db
        .select({ counselorId: clientCounselor.counselorId })
        .from(clientCounselor)
        .where(eq(clientCounselor.clientId, user.id))
        .limit(1);

      if (!assignment?.counselorId) {
        return NextResponse.json({ ok: true, counselor: null });
      }

      const [counselor] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          phone: users.phone,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, assignment.counselorId))
        .limit(1);

      if (!counselor) {
        return NextResponse.json({ ok: true, counselor: null });
      }

      let profile: {
        fullName: string;
        title: string;
        credentials: string | null;
        bio: string;
        yearsExperience: string | null;
        specialisations: string;
        languages: string;
        calendlyUrl: string | null;
        sessionJoinUrl: string | null;
      } | null = null;
      try {
        const [row] = await db
          .select({
            fullName: counselorProfiles.fullName,
            title: counselorProfiles.title,
            credentials: counselorProfiles.credentials,
            bio: counselorProfiles.bio,
            yearsExperience: counselorProfiles.yearsExperience,
            specialisations: counselorProfiles.specialisations,
            languages: counselorProfiles.languages,
            calendlyUrl: counselorProfiles.calendlyUrl,
            sessionJoinUrl: counselorProfiles.sessionJoinUrl,
          })
          .from(counselorProfiles)
          .where(eq(counselorProfiles.userId, counselor.id))
          .limit(1);
        profile = row ?? null;
      } catch (profileErr) {
        logError('me_contacts_profile_error', profileErr, { counselorId: counselor.id });
      }

      let unreadCount = 0;
      try {
        const unread = await db
          .select({ id: messages.id })
          .from(messages)
          .where(
            and(
              eq(messages.toUserId, user.id),
              eq(messages.fromUserId, counselor.id),
              isNull(messages.readAt),
            ),
          );
        unreadCount = unread.length;
      } catch (unreadErr) {
        logError('me_contacts_unread_error', unreadErr, {
          clientId: user.id,
          counselorId: counselor.id,
        });
      }

      const name = profile?.fullName?.trim() || displayLabel(counselor);

      const publicCounselor: PublicCounselorProfile = {
        id: counselor.id,
        name,
        title: profile?.title?.trim() || null,
        credentials: profile?.credentials?.trim() || null,
        bio: profile?.bio?.trim() || null,
        yearsExperience: profile?.yearsExperience?.trim() || null,
        specialisations: parseStringList(profile?.specialisations),
        languages: parseStringList(profile?.languages),
        calendlyUrl: profile?.calendlyUrl ?? null,
        sessionJoinUrl: profile?.sessionJoinUrl ?? null,
        unreadCount,
      };

      return NextResponse.json({
        ok: true,
        counselor: publicCounselor,
      });
    }

    const assignments = (await db
      .select({ clientId: clientCounselor.clientId })
      .from(clientCounselor)
      .where(eq(clientCounselor.counselorId, user.id))) as { clientId: string }[];

    const assignedIds: string[] = assignments.map((a) => a.clientId);
    const clients: UserLabelRow[] =
      assignedIds.length > 0
        ? ((await db
            .select({
              id: users.id,
              displayName: users.displayName,
              phone: users.phone,
              email: users.email,
            })
            .from(users)
            .where(and(eq(users.role, 'client'), inArray(users.id, assignedIds)))) as UserLabelRow[])
        : [];

    const unreadRows = await db
      .select({ fromUserId: messages.fromUserId })
      .from(messages)
      .where(and(eq(messages.toUserId, user.id), isNull(messages.readAt)));

    const unreadByClient: Record<string, number> = {};
    for (const row of unreadRows) {
      unreadByClient[row.fromUserId] = (unreadByClient[row.fromUserId] ?? 0) + 1;
    }

    const planRows = (await db.select({ userId: plans.userId, status: plans.status }).from(plans)) as {
      userId: string;
      status: string;
    }[];
    const planStatusByUser = Object.fromEntries(planRows.map((p) => [p.userId, p.status]));

    return NextResponse.json({
      ok: true,
      clients: clients.map((client) => ({
        id: client.id,
        name: displayLabel(client),
        planStatus: planStatusByUser[client.id] ?? 'none',
        unreadCount: unreadByClient[client.id] ?? 0,
      })),
    });
  } catch (err) {
    logError('me_contacts_error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
