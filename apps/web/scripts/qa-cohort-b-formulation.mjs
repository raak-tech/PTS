/**
 * Spec H QA — cohort B: formulation → approve → Week 1 → client sees summary.
 *
 *   PTS_API_URL=https://pts-web-pied.vercel.app node scripts/qa-cohort-b-formulation.mjs
 */
const API = process.env.PTS_API_URL ?? 'https://pts-web-pied.vercel.app';
const OTP = process.env.PTS_OTP ?? '123456';
const CLIENT_PHONE = process.env.PTS_CLIENT_PHONE ?? '9988776655';
const COUNSELOR_PHONE = process.env.PTS_COUNSELOR_PHONE ?? '+919900000002';

const results = [];
function ok(name, detail = '') {
  results.push({ name, pass: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail) {
  results.push({ name, pass: false, detail });
  console.error(`✗ ${name} — ${detail}`);
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function otpLogin(phone) {
  await parseJson(
    await fetch(`${API}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, dataStorageConsent: true }),
    }),
  );
  const { token, user } = await parseJson(
    await fetch(`${API}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: OTP }),
    }),
  );
  return { token, user, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
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
  console.log(`API: ${API}\n`);

  // --- Client: cohort ---
  const client = await otpLogin(CLIENT_PHONE);
  ok('client_login', client.user?.id);

  const cohortPost = await fetch(`${API}/api/me/cohort`, {
    method: 'POST',
    headers: client.headers,
    body: JSON.stringify({ pilotCohort: 'pain_script' }),
  });
  const cohortBody = await cohortPost.json().catch(() => ({}));
  const cohortGet = await parseJson(await fetch(`${API}/api/me/cohort`, { headers: client.headers }));
  console.log('cohort POST:', cohortPost.status, cohortBody);
  console.log('cohort GET:', cohortGet);
  if (cohortGet.pilotCohort === 'pain_script') {
    ok('client_pain_script_cohort');
  } else {
    fail('client_pain_script_cohort', JSON.stringify(cohortGet));
  }
  // --- Counselor ---
  const counselor = await otpLogin(COUNSELOR_PHONE);
  ok('counselor_login', counselor.user?.id);

  const clientId = client.user.id;

  // Force cohort via admin if available; else rely on existing DB value
  // Check formulation state
  let formRes = await fetch(`${API}/api/provider/formulations/${clientId}`, {
    headers: counselor.headers,
  });
  let formData = await formRes.json().catch(() => ({}));
  console.log('formulation GET:', formRes.status, JSON.stringify(formData).slice(0, 400));

  const needsRegen =
    formRes.status === 404 ||
    formData.reason === 'not_found' ||
    !formData.formulation ||
    formData.formulation?.status === 'draft';

  if (needsRegen) {
    // Regenerate when missing or still draft so LLM/fallback produces a fresh draft.
    const regen = await fetchLong(`${API}/api/provider/formulations/${clientId}/regenerate`, {
      method: 'POST',
      headers: counselor.headers,
      body: '{}',
    });
    const regenBody = await regen.json().catch(() => ({}));
    console.log('formulation regenerate:', regen.status, JSON.stringify(regenBody).slice(0, 300));
    if (!regen.ok) {
      fail(
        'formulation_available',
        `Regenerate failed: ${regen.status} ${JSON.stringify(regenBody)}. Ensure client has intake + pilot_cohort=pain_script + PAIN_SCRIPT_ENABLED.`,
      );
    } else {
      ok('formulation_regenerated');
      formRes = await fetch(`${API}/api/provider/formulations/${clientId}`, {
        headers: counselor.headers,
      });
      formData = await formRes.json().catch(() => ({}));
    }
  } else {
    ok('formulation_available', formData.formulation?.status ?? 'present');
  }

  if (formData.formulation && formData.formulation.status !== 'approved') {
    const approve = await parseJson(
      await fetch(`${API}/api/provider/formulations/${clientId}/approve`, {
        method: 'POST',
        headers: counselor.headers,
        body: '{}',
      }),
    );
    ok('formulation_approved', JSON.stringify(approve).slice(0, 120));
  } else if (formData.approvedFormulation || formData.formulation?.status === 'approved') {
    ok('formulation_already_approved');
  }

  // Gate check: generate Week 1 (or supersede legacy approved plans lacking Spec H fields)
  let gen = await fetchLong(`${API}/api/provider/generate-plan`, {
    method: 'POST',
    headers: counselor.headers,
    body: JSON.stringify({ userId: clientId }),
  });
  let genBody = await gen.json().catch(() => ({}));
  console.log('generate-plan:', gen.status, JSON.stringify(genBody).slice(0, 400));

  // Client view prefers approved plans — if legacy approved lacks formulationSummary,
  // regenerate from approved formulation and re-approve.
  let plans = await parseJson(await fetch(`${API}/api/plans`, { headers: client.headers }));
  let contentRaw = plans.plan?.generatedContent;
  let content = null;
  try {
    content = typeof contentRaw === 'string' ? JSON.parse(contentRaw) : contentRaw;
  } catch {
    content = null;
  }
  const needsPainPlan =
    !content?.formulationSummary ||
    !(content?.weeks?.[0]?.personalizationBasis || content?.weeks?.find?.((w) => w.weekNumber === 1)?.personalizationBasis);

  if (needsPainPlan && plans.plan?.id) {
    console.log('legacy/missing Spec H fields — regenerating plan from formulation…');
    const regen = await fetchLong(`${API}/api/plans`, {
      method: 'POST',
      headers: counselor.headers,
      body: JSON.stringify({ planId: plans.plan.id, action: 'regenerate' }),
    });
    const regenBody = await regen.json().catch(() => ({}));
    console.log('plans regenerate:', regen.status, JSON.stringify(regenBody).slice(0, 300));
    if (!regen.ok || !regenBody.planId) {
      fail('week1_generate', `regenerate failed: ${regen.status} ${JSON.stringify(regenBody)}`);
    } else {
      await parseJson(
        await fetch(`${API}/api/plans`, {
          method: 'POST',
          headers: counselor.headers,
          body: JSON.stringify({ planId: regenBody.planId, action: 'approve' }),
        }),
      );
      ok('week1_generate_or_exists', 'regenerated+approved');
      genBody = { ok: true, planId: regenBody.planId };
      plans = await parseJson(await fetch(`${API}/api/plans`, { headers: client.headers }));
      contentRaw = plans.plan?.generatedContent;
      try {
        content = typeof contentRaw === 'string' ? JSON.parse(contentRaw) : contentRaw;
      } catch {
        content = null;
      }
    }
  } else if (gen.ok || genBody.reason === 'plan_exists') {
    ok('week1_generate_or_exists', genBody.reason ?? 'ok');
  } else {
    fail('week1_generate', `${gen.status} ${JSON.stringify(genBody)}`);
  }

  const summary = content?.formulationSummary ?? plans.plan?.formulationSummary;
  const w1 = content?.weeks?.[0] ?? content?.weeks?.find?.((w) => w.weekNumber === 1);
  const basis = w1?.personalizationBasis;

  if (summary && String(summary).trim().length > 0) {
    ok('client_formulationSummary', String(summary).slice(0, 100));
  } else {
    fail('client_formulationSummary', 'missing on client plan payload');
  }

  if (basis && String(basis).trim().length > 0) {
    ok('client_personalizationBasis', String(basis).slice(0, 100));
  } else {
    fail('client_personalizationBasis', `missing on week 1; keys=${w1 ? Object.keys(w1).join(',') : 'no-week'}`);
  }

  // Ensure counselor-only tags not leaked
  const leaked =
    JSON.stringify(content ?? {}).includes('"targets"') &&
    JSON.stringify(content?.weeks?.[0]?.dailyPractice ?? {}).includes('"mechanism"');
  if (!leaked) {
    ok('client_strips_clinical_tags', 'no obvious mechanism leak in first practice');
  } else {
    fail('client_strips_clinical_tags', 'targets/mechanism may still be present');
  }

  console.log('\n=== SUMMARY ===');
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`${passed} passed, ${failed} failed`);
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}\t${r.name}\t${r.detail}`);
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
