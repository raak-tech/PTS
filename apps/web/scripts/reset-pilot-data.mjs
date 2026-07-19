/**
 * DANGER — destructive. Wipes ALL data except the `clinics` seed and the
 * `_pts_migrations` ledger, then creates a fresh counselor + client test pair.
 *
 * Preserves: clinics (e.g. Sagar's Rehab), _pts_migrations.
 * Clears: users and every other table (intakes, plans, messages, outcomes,
 *   clinic memberships / codes / enrollments, sessions, otp_codes, audit, …).
 *
 * Requires an explicit confirmation flag so it can never run by accident:
 *   CONFIRM_WIPE=yes DATABASE_URL=... node scripts/reset-pilot-data.mjs
 *
 * Optional:
 *   PILOT_COUNSELOR_PASSWORD  (default: printed below) — web login for counselor
 */
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import * as argon2 from 'argon2';
import postgres from 'postgres';

const KEEP_TABLES = new Set(['clinics', '_pts_migrations']);

const COUNSELOR = {
  phone: '+919900000001',
  email: 'counselor@pts.local',
  displayName: 'Test Counselor',
};
const CLIENT = {
  phone: '+919999999001',
  displayName: 'Test Client',
};
const COUNSELOR_PASSWORD = process.env.PILOT_COUNSELOR_PASSWORD || 'PtsPilot#2026';

if (process.env.CONFIRM_WIPE !== 'yes') {
  console.error('Refusing to run: set CONFIRM_WIPE=yes to confirm the destructive wipe.');
  process.exit(1);
}

function createSql() {
  if (process.env.DATABASE_URL) return postgres(process.env.DATABASE_URL, { max: 1 });
  return postgres({ database: 'pts', user: os.userInfo().username, host: '/var/run/postgresql', max: 1 });
}

const sql = createSql();
const label = process.env.DATABASE_URL ? 'DATABASE_URL (remote)' : 'local unix socket';

try {
  console.log(`Target: ${label}`);

  const before = await sql`SELECT count(*)::int AS n FROM users`;
  console.log(`Users before wipe: ${before[0].n}`);

  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const toTruncate = tables.map((t) => t.tablename).filter((t) => !KEEP_TABLES.has(t));

  if (toTruncate.length === 0) {
    console.log('No tables to truncate.');
  } else {
    const list = toTruncate.map((t) => `"${t}"`).join(', ');
    console.log(`Truncating ${toTruncate.length} tables (keeping: ${[...KEEP_TABLES].join(', ')})…`);
    await sql.unsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  }

  const now = new Date();

  // Counselor — provider role, with web email+password AND phone OTP.
  const counselorId = randomUUID();
  const passwordHash = await argon2.hash(COUNSELOR_PASSWORD);
  await sql`
    INSERT INTO users (id, email, phone, password_hash, role, display_name, created_at)
    VALUES (${counselorId}, ${COUNSELOR.email}, ${COUNSELOR.phone}, ${passwordHash}, 'provider', ${COUNSELOR.displayName}, ${now})
  `;
  await sql`
    INSERT INTO counselor_profiles (
      user_id, full_name, title, credentials, specialisations, languages,
      years_experience, bio, calendly_url, verified_at, created_at
    ) VALUES (
      ${counselorId}, ${COUNSELOR.displayName}, 'Counselor', NULL,
      ${JSON.stringify(['general'])}, ${JSON.stringify(['English'])}, NULL,
      'Pilot test counselor profile.', NULL, ${now}, ${now}
    )
  `;

  // Client — OTP-only.
  const clientId = randomUUID();
  const clientEmail = `${CLIENT.phone.replace(/\D/g, '')}@phone.pts.local`;
  await sql`
    INSERT INTO users (id, email, phone, password_hash, role, display_name, created_at)
    VALUES (${clientId}, ${clientEmail}, ${CLIENT.phone}, NULL, 'client', ${CLIENT.displayName}, ${now})
  `;

  const clinics = await sql`SELECT id, name FROM clinics ORDER BY name`;

  console.log('\n✓ Reset complete.');
  console.log(`  Counselor: ${COUNSELOR.phone} / ${COUNSELOR.email}  (web password: ${COUNSELOR_PASSWORD}) — OTP 123456 on mobile`);
  console.log(`  Client:    ${CLIENT.phone}  — OTP 123456 on mobile`);
  console.log(`  Clinics preserved: ${clinics.map((c) => c.name).join(', ') || '(none)'}`);
} finally {
  await sql.end({ timeout: 5 });
}
