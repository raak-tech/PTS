/**
 * Seed local dev users for mobile OTP testing.
 * Run: node scripts/seed-dev-users.mjs
 */
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import postgres from 'postgres';

const sql = postgres({
  database: 'pts',
  user: os.userInfo().username,
  host: '/var/run/postgresql',
  max: 1,
});

const users = [
  { phone: '+919900000001', role: 'client', displayName: 'Test Client' },
  { phone: '+919900000002', role: 'provider', displayName: 'Test Counselor' },
];

try {
  for (const u of users) {
    const digits = u.phone.replace(/\D/g, '');
    const email = `${digits}@phone.pts.local`;
    const [existing] = await sql`SELECT id FROM users WHERE phone = ${u.phone} OR email = ${email} LIMIT 1`;
    if (existing) {
      console.log(`skip ${u.displayName} (${u.phone}) — already exists`);
      continue;
    }
    const id = randomUUID();
    const now = new Date();
    await sql`
      INSERT INTO users (id, email, phone, password_hash, role, display_name, created_at)
      VALUES (${id}, ${email}, ${u.phone}, NULL, ${u.role}, ${u.displayName}, ${now})
    `;
    if (u.role === 'provider') {
      await sql`
        INSERT INTO counselor_profiles (
          user_id, full_name, title, credentials, specialisations, languages,
          years_experience, bio, calendly_url, verified_at, created_at
        ) VALUES (
          ${id}, ${u.displayName}, 'Counselor', NULL, ${JSON.stringify(['general'])},
          ${JSON.stringify(['English'])}, NULL, 'Dev test counselor profile.', NULL, ${now}, ${now}
        )
      `;
    }
    console.log(`created ${u.displayName} (${u.phone}) — OTP 123456`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
