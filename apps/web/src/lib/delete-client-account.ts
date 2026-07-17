import { eq, inArray, or } from 'drizzle-orm';

import type { Db } from '../db';
import {
  clientCounselor,
  clientProfile,
  consentGrants,
  counselorNotes,
  dailyCalendarEntries,
  dailyCheckIns,
  dailyReinforcements,
  dailyScheduleFeedback,
  eveningReflections,
  flareEvents,
  formulations,
  holisticCompletions,
  intakeFlowDrafts,
  intakeResponses,
  intakeSessions,
  messages,
  monthlyCheckIns,
  otpCodes,
  passwordResetTokens,
  plans,
  planWeeks,
  profileFacts,
  profileFieldRequests,
  pushSubscriptions,
  reinforcementResponses,
  sessions,
  supportArtifacts,
  userConsents,
  users,
  weeklyCheckIns,
} from '../db/schema';

/** Hard-delete a client account and related program/intake data (pilot). */
export async function deleteClientAccountData(
  db: Db,
  user: { id: string; phone: string | null },
) {
  const userId = user.id;

  await db.transaction(async (tx) => {
    const userPlans = await tx
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.userId, userId));
    const planIds = userPlans.map((p) => p.id);
    if (planIds.length > 0) {
      await tx.delete(planWeeks).where(inArray(planWeeks.planId, planIds));
    }

    const reinforcements = await tx
      .select({ id: dailyReinforcements.id })
      .from(dailyReinforcements)
      .where(eq(dailyReinforcements.clientId, userId));
    const reinforcementIds = reinforcements.map((r) => r.id);
    if (reinforcementIds.length > 0) {
      await tx
        .delete(reinforcementResponses)
        .where(inArray(reinforcementResponses.reinforcementId, reinforcementIds));
    }
    await tx.delete(reinforcementResponses).where(eq(reinforcementResponses.clientId, userId));
    await tx.delete(dailyReinforcements).where(eq(dailyReinforcements.clientId, userId));

    await tx.delete(formulations).where(eq(formulations.userId, userId));
    await tx.delete(plans).where(eq(plans.userId, userId));
    await tx.delete(intakeSessions).where(eq(intakeSessions.userId, userId));
    await tx.delete(intakeFlowDrafts).where(eq(intakeFlowDrafts.userId, userId));
    await tx.delete(intakeResponses).where(eq(intakeResponses.userId, userId));

    await tx
      .delete(messages)
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)));
    await tx.delete(counselorNotes).where(eq(counselorNotes.clientId, userId));
    await tx.delete(clientCounselor).where(eq(clientCounselor.clientId, userId));
    await tx.delete(profileFieldRequests).where(eq(profileFieldRequests.clientId, userId));
    await tx.delete(profileFacts).where(eq(profileFacts.userId, userId));
    await tx.delete(clientProfile).where(eq(clientProfile.userId, userId));
    await tx.delete(consentGrants).where(eq(consentGrants.userId, userId));
    await tx.delete(userConsents).where(eq(userConsents.userId, userId));
    await tx.delete(supportArtifacts).where(eq(supportArtifacts.userId, userId));
    await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    await tx.delete(dailyCalendarEntries).where(eq(dailyCalendarEntries.clientId, userId));
    await tx.delete(dailyScheduleFeedback).where(eq(dailyScheduleFeedback.clientId, userId));
    await tx.delete(holisticCompletions).where(eq(holisticCompletions.clientId, userId));
    await tx.delete(weeklyCheckIns).where(eq(weeklyCheckIns.clientId, userId));
    await tx.delete(flareEvents).where(eq(flareEvents.clientId, userId));
    await tx.delete(eveningReflections).where(eq(eveningReflections.clientId, userId));
    await tx.delete(dailyCheckIns).where(eq(dailyCheckIns.clientId, userId));
    await tx.delete(monthlyCheckIns).where(eq(monthlyCheckIns.clientId, userId));

    if (user.phone) {
      await tx.delete(otpCodes).where(eq(otpCodes.phone, user.phone));
    }
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
}
