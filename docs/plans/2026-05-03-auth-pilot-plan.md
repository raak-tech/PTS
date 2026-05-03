# Auth Pilot Implementation Plan

> **For Hermes:** use `subagent-driven-development` to execute this plan task-by-task with TDD.

**Goal:** ship a pilot-ready email/password login flow so clients and providers can sign in quickly, then extend to password reset and session management.

**Architecture:** The app already has SQLite + Drizzle schema scaffolding for `users`, `sessions`, and `password_reset_tokens`. Implement a small shared auth layer in `apps/web/src/lib/` that handles password hashing, session creation/lookup, and reset-token hashing. Expose auth via app-router pages and route handlers under `apps/web/src/app/` with secure HTTP-only cookies. Keep the first pilot slice simple: login, logout, register, and password reset request/reset.

**Tech Stack:** Next.js app router, React, TypeScript, SQLite (`better-sqlite3`), Drizzle ORM, `argon2`, `nodemailer`, Playwright, ESLint.

---

### Task 1: Add shared auth primitives and cookie/session helpers

**Objective:** Create one source of truth for password hashing, session token hashing, reset token hashing, and secure cookie serialization.

**Files:**
- Create: `apps/web/src/lib/auth.ts`
- Create: `apps/web/src/lib/cookies.ts`
- Modify: `apps/web/src/db/schema.ts` only if a column name mismatch is discovered
- Test: `apps/web/tests/auth-helpers.spec.ts`

**Step 1: Write failing test**
- Test that passwords are hashed and verified via argon2.
- Test that session/reset tokens are hashed before storage and can be compared safely.
- Test that cookie helpers mark auth cookies `httpOnly`, `sameSite=lax`, `secure` in production, and set a reasonable max-age.

**Step 2: Run test to verify failure**
- Run: `cd apps/web && npx playwright test tests/auth-helpers.spec.ts` or `npm test` if the test runner is shared.
- Expected: FAIL because helpers do not exist yet.

**Step 3: Write minimal implementation**
- Implement helper functions:
  - `hashPassword(password)`
  - `verifyPassword(hash, password)`
  - `hashToken(token)`
  - `createSessionCookie(value)`
  - `clearSessionCookie()`
- Keep the helpers framework-agnostic so route handlers can reuse them.

**Step 4: Run test to verify pass**
- Run the helper test again.
- Expected: PASS.

**Step 5: Commit**
- `git add apps/web/src/lib/auth.ts apps/web/src/lib/cookies.ts apps/web/tests/auth-helpers.spec.ts`
- `git commit -m "feat(auth): add shared auth primitives"`

---

### Task 2: Add register/login/logout routes and pages

**Objective:** Let a user create an account, sign in, and sign out with a secure cookie-backed session.

**Files:**
- Create: `apps/web/src/app/register/page.tsx`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/logout/route.ts`
- Create: `apps/web/src/app/api/auth/register/route.ts`
- Create: `apps/web/src/app/api/auth/login/route.ts`
- Create: `apps/web/src/app/api/auth/logout/route.ts`
- Modify: `apps/web/src/app/layout.tsx` (optional auth nav)
- Test: `apps/web/tests/auth-flow.spec.ts`

**Step 1: Write failing test**
- Register page renders email/password fields and submit button.
- Login page renders the same.
- Successful register creates a session and redirects or returns success.
- Successful login creates a session cookie.
- Logout clears the cookie.

**Step 2: Run test to verify failure**
- Run the new Playwright test.
- Expected: FAIL because routes do not exist yet.

**Step 3: Write minimal implementation**
- Add route handlers that validate input with `zod`.
- Insert users into SQLite with unique email.
- Set the session cookie on success.
- Return helpful validation errors for duplicates and bad credentials.

**Step 4: Run test to verify pass**
- Expected: PASS.

**Step 5: Commit**
- `git add -A`
- `git commit -m "feat(auth): add register login logout flow"`

---

### Task 3: Add password reset request + reset flow

**Objective:** Let users request a reset email and set a new password with a single-use token.

**Files:**
- Create: `apps/web/src/app/forgot-password/page.tsx`
- Create: `apps/web/src/app/reset-password/page.tsx`
- Create: `apps/web/src/app/api/auth/request-reset/route.ts`
- Create: `apps/web/src/app/api/auth/reset/route.ts`
- Create: `apps/web/src/lib/mailer.ts` or `apps/web/src/lib/email.ts`
- Test: `apps/web/tests/password-reset.spec.ts`

**Step 1: Write failing test**
- Request reset creates a hashed token with expiry.
- Reset accepts token + new password once.
- Reuse of a token fails.
- Expired token fails.

**Step 2: Run test to verify failure**
- Expected: FAIL.

**Step 3: Write minimal implementation**
- Store hashed reset tokens in `password_reset_tokens`.
- Use `nodemailer` or a dev outbox abstraction so the pilot can be tested without real email delivery.
- Allow reset page to accept token from query string or form.

**Step 4: Run test to verify pass**
- Expected: PASS.

**Step 5: Commit**
- `git add -A`
- `git commit -m "feat(auth): add password reset flow"`

---

### Task 4: Add basic route protection and pilot sanity checks

**Objective:** Make sure authenticated pages can detect sessions and the pilot doesn’t feel half-finished.

**Files:**
- Create: `apps/web/src/lib/current-user.ts`
- Create: `apps/web/middleware.ts` only if route protection is needed now
- Modify: `apps/web/src/app/page.tsx` or the post-login landing page
- Test: `apps/web/tests/auth-gate.spec.ts`

**Step 1: Write failing test**
- Unauthenticated users see the login/register path.
- Authenticated users can reach the program pages.
- Logged-out users are redirected or shown a clear prompt.

**Step 2: Run test to verify failure**
- Expected: FAIL.

**Step 3: Write minimal implementation**
- Add a helper that reads the session cookie and resolves the current user.
- Use it to conditionally render or redirect where needed.

**Step 4: Run test to verify pass**
- Expected: PASS.

**Step 5: Commit**
- `git add -A`
- `git commit -m "feat(auth): add session-aware route gating"`

---

### Task 5: Pilot readiness pass

**Objective:** Make the auth flow shippable for an early client pilot.

**Files:**
- Modify: `docs/PROJECT_BRIEF.md` if the pilot login assumption needs to be captured
- Modify: `docs/ARCHITECTURE.md` if the auth architecture is now concrete
- Modify: `docs/DECISIONS.md` to record the auth decision
- Add/update Playwright coverage as needed

**Step 1: Run the relevant test suite**
- `cd apps/web && npm test`

**Step 2: Review UX copy**
- Make sure pilot-facing auth copy is clear and conservative.

**Step 3: Commit docs/tests**
- Commit only after the pilot path is green.

---

## Pilot-first notes
- The fastest path to clients logging in is to finish **Task 2** first, then **Task 4**.
- If Task 3 is too large for the pilot window, ship login/register/logout first and add reset immediately after.
- Keep the auth surface small and boring.
