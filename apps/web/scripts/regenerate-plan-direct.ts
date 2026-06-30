/**
 * Direct plan regeneration against production DB (bypasses Vercel after()).
 *
 *   node --env-file=.env.production.local --import tsx ./scripts/regenerate-plan-direct.ts [userId]
 */

import { regeneratePlanDraftForUser } from '../src/lib/regenerate-plan-for-user';

const userId = process.argv[2] ?? 'f482896c-14a4-4976-8fc8-c0591b9dcf8e';

async function main() {
  const planId = await regeneratePlanDraftForUser(userId);
  if (!planId) {
    console.error('No intake found for user', userId);
    process.exit(1);
  }
  console.log('Created draft plan:', planId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
