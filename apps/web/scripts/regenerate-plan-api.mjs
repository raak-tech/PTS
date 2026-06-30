/**
 * Counselor-triggered plan regeneration only (intake must already exist).
 *
 *   PTS_API_URL=... PTS_COUNSELOR_PHONE=+919900000002 PTS_CLIENT_ID=... node scripts/regenerate-plan-api.mjs
 */

const API = process.env.PTS_API_URL ?? 'https://pts-web-pied.vercel.app';
const OTP = process.env.PTS_OTP ?? '123456';
const counselorPhone = process.env.PTS_COUNSELOR_PHONE ?? '+919900000002';
const clientId = process.env.PTS_CLIENT_ID ?? 'f482896c-14a4-4976-8fc8-c0591b9dcf8e';

async function parseJson(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function fetchLong(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 320_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  await parseJson(
    await fetch(`${API}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: counselorPhone }),
    }),
  );

  const { token } = await parseJson(
    await fetch(`${API}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: counselorPhone, code: OTP }),
    }),
  );

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const { plan } = await parseJson(
    await fetch(`${API}/api/plans?userId=${encodeURIComponent(clientId)}`, { headers }),
  );
  if (!plan) throw new Error('no plan');

  console.log('Requesting regeneration (may take 2–4 min)…');
  const regen = await parseJson(
    await fetchLong(`${API}/api/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ planId: plan.id, action: 'regenerate' }),
    }),
  );

  if (regen.planId) {
    const { plan: latest } = await parseJson(
      await fetch(`${API}/api/plans?userId=${encodeURIComponent(clientId)}`, { headers }),
    );
    const parsed = JSON.parse(latest.generatedContent);
    const w1 = parsed.weeks?.[0];
    console.log('\n✓ Holistic draft ready:', latest.id);
    console.log('Yoga:', w1?.yogaTrial?.principle);
    console.log('Music:', w1?.musicMoment?.playlist?.title);
    return;
  }

  for (let i = 1; i <= 6; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const { plan: latest } = await parseJson(
      await fetch(`${API}/api/plans?userId=${encodeURIComponent(clientId)}`, { headers }),
    );
    if (!latest || latest.id === plan.id) {
      console.log(`  [${i}/24] waiting for new draft…`);
      continue;
    }
    const parsed = JSON.parse(latest.generatedContent);
    const w1 = parsed.weeks?.[0];
    const ok = w1?.yogaTrial && w1?.musicMoment?.playlist;
    console.log(`  [${i}/24] ${latest.id.slice(0, 8)} status=${latest.status}`);
    if (latest.status === 'draft' && ok) {
      console.log('\n✓ Holistic draft ready:', latest.id);
      console.log('Yoga:', w1.yogaTrial.principle);
      console.log('Music:', w1.musicMoment.playlist.title);
      return;
    }
  }
  throw new Error('timed out');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
