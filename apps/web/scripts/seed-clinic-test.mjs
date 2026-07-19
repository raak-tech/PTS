/**
 * Seed the admin + Sagar's Rehab clinic_admin + a sample enrollment code so the
 * full B2B2C flow is testable. Idempotent: skips rows that already exist.
 *
 *   DATABASE_URL=... node scripts/seed-clinic-test.mjs
 *
 * Optional passwords (defaults printed at the end):
 *   PILOT_ADMIN_PASSWORD, PILOT_CLINIC_ADMIN_PASSWORD
 */
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import * as argon2 from 'argon2';
import postgres from 'postgres';

const CLINIC_ID = 'clinic-sagars-rehab';
const ENROLLMENT_CODE = 'SAGAR7';

const ADMIN = { email: 'admin@pts.local', displayName: 'PTS Admin' };
const CLINIC_ADMIN = { email: 'clinicadmin@sagars.pts.local', displayName: "Sagar's Clinic Admin" };
const ADMIN_PASSWORD = process.env.PILOT_ADMIN_PASSWORD || 'PtsAdmin#2026';
const CLINIC_ADMIN_PASSWORD = process.env.PILOT_CLINIC_ADMIN_PASSWORD || 'PtsClinic#2026';

function createSql() {
  if (process.env.DATABASE_URL) return postgres(process.env.DATABASE_URL, { max: 1 });
  return postgres({ database: 'pts', user: os.userInfo().username, host: '/var/run/postgresql', max: 1 });
}

const sql = createSql();

async function upsertUser({ email, displayName, role, password }) {
  const [existing] = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing) {
    console.log(`  user ${email} already exists (${existing.id})`);
    return existing.id;
  }
  const id = randomUUID();
  const hash = await argon2.hash(password);
  await sql`
    INSERT INTO users (id, email, phone, password_hash, role, display_name, created_at)
    VALUES (${id}, ${email}, NULL, ${hash}, ${role}, ${displayName}, ${new Date()})
  `;
  console.log(`  created ${role} ${email} (${id})`);
  return id;
}

try {
  const [clinic] = await sql`SELECT id, name, status FROM clinics WHERE id = ${CLINIC_ID} LIMIT 1`;
  if (!clinic) throw new Error(`Clinic ${CLINIC_ID} not found — run migrations first.`);
  console.log(`Clinic: ${clinic.name} (${clinic.status})`);

  console.log('Users:');
  await upsertUser({ ...ADMIN, role: 'admin', password: ADMIN_PASSWORD });
  const clinicAdminId = await upsertUser({ ...CLINIC_ADMIN, role: 'referrer', password: CLINIC_ADMIN_PASSWORD });

  // Membership: clinic_admin for Sagar's Rehab.
  const [membership] = await sql`
    SELECT id FROM clinic_memberships WHERE clinic_id = ${CLINIC_ID} AND user_id = ${clinicAdminId} LIMIT 1
  `;
  if (membership) {
    await sql`UPDATE clinic_memberships SET role = 'clinic_admin' WHERE id = ${membership.id}`;
    console.log('  membership already existed — ensured role clinic_admin');
  } else {
    await sql`
      INSERT INTO clinic_memberships (id, clinic_id, user_id, role, created_at)
      VALUES (${randomUUID()}, ${CLINIC_ID}, ${clinicAdminId}, 'clinic_admin', ${new Date()})
    `;
    console.log('  created clinic_admin membership');
  }

  // Sample enrollment code (unlimited, no expiry).
  const [code] = await sql`SELECT id FROM clinic_enrollment_codes WHERE code = ${ENROLLMENT_CODE} LIMIT 1`;
  if (code) {
    console.log(`  enrollment code ${ENROLLMENT_CODE} already exists`);
  } else {
    await sql`
      INSERT INTO clinic_enrollment_codes
        (id, clinic_id, code, created_by_user_id, cohort_label, max_uses, uses, expires_at, created_at)
      VALUES
        (${randomUUID()}, ${CLINIC_ID}, ${ENROLLMENT_CODE}, ${clinicAdminId}, 'Pilot test', NULL, 0, NULL, ${new Date()})
    `;
    console.log(`  created enrollment code ${ENROLLMENT_CODE}`);
  }

  console.log('\n✓ Clinic test setup complete.');
  console.log(`  Admin (web /admin):        ${ADMIN.email} / ${ADMIN_PASSWORD}`);
  console.log(`  Clinic admin (web /clinic): ${CLINIC_ADMIN.email} / ${CLINIC_ADMIN_PASSWORD}`);
  console.log(`  Enrollment code (mobile):  ${ENROLLMENT_CODE}`);
} finally {
  await sql.end({ timeout: 5 });
}
