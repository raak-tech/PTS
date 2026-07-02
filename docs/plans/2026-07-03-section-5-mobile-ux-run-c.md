# Section 5 — Mobile UX backlog (Run C)

**Status:** Run C shipped — code complete, APK 13 (2026-07-02); QA pass pending  
**PILOT_TODO:** §5 Mobile UX  
**Created:** 2026-07-03  
**Depends on:** §9 Run A + Run B (shipped)

**Process:** [`DEV_WORKFLOW.md`](../DEV_WORKFLOW.md)

---

## Summary

Most §5 items are **partially done**, **QA-only**, or **blocked on one API bug** (`releasedWeeks` legacy fallback). Run C groups the real code work into two drops: **client Program correctness** (P0) and **counselor plan-review parity** (P1). Several checklist lines can be **closed as shipped** after device verification.

---

## Item-by-item inventory

| # | PILOT_TODO §5 item | Today | Gap | Type |
|---|-------------------|-------|-----|------|
| 5a | Crisis notes gate before plan approve (SCOPE-I) | ✅ Web `PlanReviewClient` + mobile `plan-review/[id]` | None — verify on device with crisis intake | **QA** |
| 5b | C7 safety flow — 2-screen copy on device | ✅ Intake C7 + crisis card in `IntakeStepContent`; C7a ack before submit | Confirm copy matches `MOBILE_APP_UX.md` on Pixel | **QA** |
| 5c | Counselor “open web workspace” link | ✅ Mobile client detail → “Open full web workspace” (Run B) | None | **Done** |
| 5d | Provider mobile parity | ✅ Run B / APK 12 | None | **Done** |
| 5e | 6 weeks visible in counselor mobile plan review (SCOPE-D) | ⚠️ Week 1 only when JSON has 1 week | Weeks 2–6 **locked cards** missing (web has them since Run A) | **Code** |
| 5f | Locked week teasers on **client** Program tab | ⚠️ Lock copy + 🔒 on unreleased weeks in calendar mode | Legacy `releasedWeeks` fallback may unlock all 6; test-time mode ignores `releasedWeeks`; week detail shows **placeholder practices** if week not in plan JSON | **Code + API** |
| 5g | Weekly check-in one-question-at-a-time | ✅ `program/check-in.tsx` — stepper with progress bar | Verify on device | **QA** |
| 5h | 6-box OTP — Android autofill | ✅ 6 boxes + paste split in `otp.tsx` | SMS User Consent / `autoComplete="sms-otp"` not verified on Pixel | **QA / small code** |

**Related (not §5 but same story):**

| Item | Where | Notes |
|------|-------|-------|
| §3 Program tab locked teasers | Same as 5f | One implementation |
| 9.5 Engagement “Client update” badge | Counselor web dashboard | Independent; can ship as Run C3 or later |
| §4 `releasedWeeks` legacy fallback | `apps/web/src/lib/mobile-user.ts` L65–67 | If `plan.status === 'approved'` and no `plan_weeks`, returns `[1..6]` — **breaks Week-1-first** for old bulk-approved plans |

---

## Root cause — client Program feels “broken”

```
Session (mobile-user.ts)          Program tab (useProgramTime)
        │                                    │
        ├─ releasedWeeks from plan_weeks     ├─ calendar mode: respects releasedWeeks ✅
        ├─ LEGACY: [1..6] if approved       ├─ test-time mode: ignores releasedWeeks ❌
        │   and no rows                      │
        └─ week detail route                 └─ locked card tap disabled ✅
           loads plan JSON                       but opening week 1 with empty
           → placeholder practices if            practices if JSON missing week
              week missing from JSON
```

**Product rule:** Client sees **only counselor-approved weeks** as open; Weeks 2–6 show **locked teaser** until approved.

---

## Proposed work packages

### 5.C1 — Client Program + session (P0) — APK 13

**Files:** `mobile-user.ts`, `appTime.ts`, `program.tsx`, `program/week/[id].tsx`

**Behaviour:**

1. **Remove** `releasedWeeks = [1,2,3,4,5,6]` fallback for new per-week model. Legacy bulk-approved plans: derive from `plan_weeks` approved rows only; if truly empty, default `[1]` not six.
2. **`computeProgramTime` (test clock):** respect `releasedWeeks` same as calendar mode (for dev/pilot test accounts using `programStartedAt`).
3. **Program tab locked copy** (refine):
   - Week N released → current/complete as today
   - Week N not released → locked card using **static `PROGRAM_WEEK_THEMES`** title/focus + *“Coming soon — your counselor will release this week.”*
   - Do not surface counselor draft content for unreleased weeks
4. **Week detail guard:** if week not in `releasedWeeks`, show locked screen (no placeholder practices).

**Acceptance criteria:**

- [x] Client with only Week 1 approved sees Week 1 open, Weeks 2–6 locked with teaser (not empty/broken). *(code)*
- [x] Tapping locked week does nothing or shows locked message (no fake practices). *(week detail guard added)*
- [x] Session `releasedWeeks` matches `plan_weeks` approved/released rows only. *(fallback → `[1]`)*
- [ ] Test account `9988776655` on APK 13 matches above. *(device QA)*

---

### 5.C2 — Counselor mobile plan review locked weeks (P1) — APK 13

**Files:** `apps/mobile/app/(provider)/plan-review/[id].tsx`

**Behaviour:**

- Mirror web Run A: after Week 1 editor, render **Weeks 2–6 locked cards** (not generated yet / approve Week 1 first).
- Remove or replace “Weeks 2–N — review on web” block that only appears when JSON contains weeks 2+.

**Acceptance criteria:**

- [x] New Week-1-only draft shows 1 editable week + 5 locked slots on mobile plan review. *(code)*
- [x] Locked copy points to web workspace for generate/approve Week 2+. *(code)*

---

### 5.C3 — Engagement “Client update” badge (P2) — web

**Spec:** §9.5 — `ProviderEngagementClient.tsx` + `hasRecentClientShare` on engagement API.

**Included in Run C** per product decision 2026-07-03. **Shipped:** `buildEngagementForClients` now
returns `recentClientShareCount` / `hasRecentClientShare` (counselor-share artifacts in last 7 days);
engagement dashboard shows a "💬 Client update" badge on each client card.

---

### 5.QA — Device verification pass (no code unless failures)

| Test | Account | Pass criteria |
|------|---------|---------------|
| Crisis gate | Intake with red flags → plan review | Cannot approve Week 1 until checkbox ack (web + mobile) |
| C7 safety | New intake on device | Step 7 crisis copy + ack matches UX doc |
| Weekly check-in | `9988776655` | One question per screen, progress bar, submit |
| OTP autofill | Any phone login | Paste 6-digit SMS works; note if carrier autofill needs `textContentType` |

---

## Recommended order

| Order | Package | Rationale |
|-------|---------|-----------|
| 1 | **5.C1** | Fixes client-facing Week-1-first confusion + API bug |
| 2 | **5.C2** | Counselor mobile matches web plan queue |
| 3 | **5.QA** | Close 5a, 5b, 5g, 5h without code if green |
| 4 | **5.C3** | Nice-to-have counselor nudge |

**Suggested run:** **Run C = 5.C1 + 5.C2 + 5.C3** → web deploy + **APK 13**

---

## PILOT_TODO updates (proposed)

| Item | New status |
|------|------------|
| Crisis gate (5a) | Done — pending QA sign-off |
| C7 safety (5b) | QA only |
| Web workspace link (5c) | Done |
| Provider parity (5d) | Done |
| Plan review 6 weeks (5e) | Run C2 |
| Program locked teasers (5f) | Run C1 (+ §3) |
| Weekly check-in stepper (5g) | Done — pending QA |
| OTP 6-box (5h) | QA (+ optional autofill attrs) |

---

## Open decisions (product)

**Resolved 2026-07-03:**

| # | Question | Decision |
|---|----------|----------|
| 1 | Locked week themes on client Program | **Static `PROGRAM_WEEK_THEMES`** on locked cards (not counselor draft JSON) |
| 2 | Run C scope | **C1 + C2 + 9.5** engagement badge |
| 3 | Remove `releasedWeeks = [1..6]` fallback? | **Yes** — only `plan_weeks` approved/released rows |

---

## Review gate

- [x] Product owner confirms locked-week copy (`PROGRAM_WEEK_THEMES`)
- [x] Theme source: static program themes
- [x] Run C scope: C1 + C2 + 9.5
- [x] Status → **Approved for build**
