/**
 * Re-submit intake and trigger LLM plan generation for a pilot client.
 *
 * Usage:
 *   PTS_API_URL=https://pts-web-pied.vercel.app PTS_PHONE=+919988776655 node scripts/regenerate-client-plan.mjs
 *
 * Requires OTP_TEST_MODE on the API (pilot accepts code 123456).
 */

const API = process.env.PTS_API_URL ?? 'https://pts-web-pied.vercel.app';
const PHONE = process.env.PTS_PHONE ?? '+919988776655';
const OTP = process.env.PTS_OTP ?? '123456';

const intakePayload = {
  painSource: 'workplace',
  painDescription:
    'Lower back and shoulder tension after a workplace incident. Pain flares when sitting long hours or carrying stress. Some days feel manageable, other days confidence drops.',
  painDuration: '3to6m',
  ageRange: '35-44',
  gender: 'male',
  occupation: 'Technology professional',
  affectsWork: 'yes_significantly',
  hasDependents: 'yes',
  priorTherapy: 'some',
  countryRegion: 'India',
  activitiesAffected: JSON.stringify(['work', 'exercise', 'sleep', 'social']),
  biggestChange: 'Lost confidence in my body and stopped the activities that used to define my routine.',
  recoveryGoal:
    'Return to work without fear, rebuild gentle movement confidence, and feel like myself again socially and at home.',
  recoveryTimeline: '3-6 months with steady support',
  currentTreatment: 'Occasional physiotherapy',
  socialSupport: 'somewhat',
  structurePreference: 'mix',
  engagementTime: 'morning',
  ayurvedaPreferences: JSON.stringify({
    energyPattern: 'morning',
    dinacharyaOpenness: 'curious',
    breathStillnessOpenness: 'gentle',
    yogaOpenness: 'yes',
    movementPreference: 'balanced',
  }),
  hasRedFlags: false,
  isSafe: true,
  consentGiven: true,
};

async function parseJson(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `http-${res.status}`);
  return data;
}

async function fetchLong(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`API: ${API}`);
  console.log(`Phone: ${PHONE}`);

  await parseJson(
    await fetch(`${API}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: PHONE }),
    }),
  );
  console.log('OTP sent (pilot test mode).');

  const { token, user } = await parseJson(
    await fetch(`${API}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: PHONE, code: OTP }),
    }),
  );
  const clientId = user.id;
  console.log(`Authenticated client ${clientId}.`);

  await parseJson(
    await fetch(`${API}/api/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(intakePayload),
    }),
  );
  console.log('Intake submitted — triggering synchronous plan regeneration via counselor API.');

  const counselorPhone = process.env.PTS_COUNSELOR_PHONE ?? '+919900000002';
  await parseJson(
    await fetch(`${API}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: counselorPhone }),
    }),
  );
  const { token: counselorToken } = await parseJson(
    await fetch(`${API}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: counselorPhone, code: OTP }),
    }),
  );

  const counselorHeaders = {
    Authorization: `Bearer ${counselorToken}`,
    'Content-Type': 'application/json',
  };

  const { plan: existing } = await parseJson(
    await fetch(`${API}/api/plans?userId=${encodeURIComponent(clientId)}`, {
      headers: counselorHeaders,
    }),
  );
  const planIdForRegen = existing?.id;
  if (!planIdForRegen) {
    console.error('No existing plan to regenerate from.');
    process.exit(1);
  }

  console.log(`Regenerating from plan ${planIdForRegen} (may take 1–2 min)…`);
  const regen = await parseJson(
    await fetchLong(`${API}/api/plans`, {
      method: 'POST',
      headers: counselorHeaders,
      body: JSON.stringify({ planId: planIdForRegen, action: 'regenerate' }),
    }),
  );
  console.log('Regenerate response:', regen);

  for (let attempt = 1; attempt <= 6; attempt++) {
    const { plan } = await parseJson(
      await fetch(`${API}/api/plans?userId=${encodeURIComponent(clientId)}`, {
        headers: counselorHeaders,
      }),
    );
    if (!plan) {
      console.log(`  [${attempt}/6] no plan row`);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(plan.generatedContent);
    } catch {
      console.log(`  [${attempt}/24] plan row exists but JSON not ready`);
      continue;
    }
    const w1 = parsed.weeks?.[0];
    const hasHolistic = Boolean(
      w1?.yogaTrial && w1?.ayurvedaBlock && w1?.musicMoment?.playlist?.tracks?.length,
    );
    console.log(`  [${attempt}/6] plan ${plan.id.slice(0, 8)} status=${plan.status}`);
    if (hasHolistic) {
      console.log('\n✓ New holistic plan draft ready for counselor review.');
      console.log(`  Plan ID: ${plan.id}`);
      console.log(`  Yoga: ${w1.yogaTrial.principle}`);
      console.log(`  Music: ${w1.musicMoment.playlist.title}`);
      console.log(`  Counselor: review at ${API}/provider/plans`);
      return;
    }
    if (plan.status === 'draft' && attempt >= 6) {
      console.log('\nPlan draft exists but holistic blocks may be incomplete — counselor can still review.');
      console.log(`  Plan ID: ${plan.id}`);
      return;
    }
  }
  console.error('\nTimed out waiting for plan generation. Check Vercel logs / OPENROUTER_API_KEY.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
