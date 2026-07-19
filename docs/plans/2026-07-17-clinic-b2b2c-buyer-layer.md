# Spec: Clinic B2B2C Buyer-Side Layer (Sagar's Rehab pilot)

**Status:** Runs 1–6 built (2026-07-18) — schema, enrollment/consent, referrer+admin web, instruments, dashboard, billing. Decisions locked below. Pending: prod deploy + Pixel APK QA + clinical/DPDP sign-off.  
**Date:** 2026-07-17  
**Branch:** feature branch off `master` (`feat/clinic-b2b2c`); `master` is the sole Pain Script product line  
**Process:** `DEV_WORKFLOW.md`  
**Goal:** Add the thin **buyer-side** layer that turns PTS from an end-user product into a clinic-sellable B2B2C product, for a per-active-patient pilot with **Sagar's Rehab** (sports + ortho physio, Adyar, Chennai).

## Guiding constraints (from `DECISIONS.md`)
- **B2B2C only, no D2C.** The clinic is buyer + distribution; the patient is the user.
- **No marketplace.** The **PTS counselor** keeps clinical ownership (formulation, Week 1, safety, sessions). The **physio-referrer is a distributor**, not a counselor — a *thin* role.
- **Client = mobile (OTP) only; counselor + admin + referrer = web.**
- **Data boundary:** the referrer sees engagement + high-level progress **only** — never messages, counseling notes, reflection content, or clinical plan detail.
- **Pricing unit:** per **active patient** per month.

## Honesty constraint
PTS's daily practices are **psychological** (check-in, grounding, reflection, read-out). Completion of those is **PTS program engagement**, NOT the physiotherapist's home-exercise adherence. **Do not label or report PTS engagement as "rehab adherence."** For a rehab-relevant adherence signal, capture a **separate, patient self-reported** item (see Run 4). Full ingestion of the physio's exercise plan is a **post-pilot** wedge, not in scope here.

## Role impact

| Role | Surface | Before | After |
|---|---|---|---|
| Patient | Mobile OTP/intake | Self-enrols with no clinic attribution | May enter clinic enrollment code and independently consent to limited sharing (Run 2) |
| PTS counselor | Web Chart | Owns formulation, plan, messages, safety | Unchanged ownership; can later see per-patient outcome deltas, not clinic billing |
| Physio referrer | Web | No PTS account/surface | Thin clinic-scoped patient projection; never counselor content (Run 3) |
| Clinic admin | Web | No buyer view | Aggregate outcomes and billing meter only after role decision (Runs 5–6) |
| PTS admin | Web | Manages users/counselors | Can seed clinic memberships and attach existing clients |

## Non-goals
- No clinic self-serve billing/payment collection (invoice manually for pilot).
- No ingestion of the physio's exercise prescription (post-pilot).
- No counselor browse/matching UI.
- No new in-app video.
- No rebuild of client app, Pain Script, or counselor Chart.

---

## Run 1 — Data model and role foundation

New tables:

**`clinics`** — buyer org:  
`id, name, slug, city, contactName, contactEmail, contactPhone, status (active/paused), createdAt`.

**`clinic_memberships`** — referrer/clinic-admin membership:  
`id, clinicId, userId, role ('referrer'|'clinic_admin'), createdAt`.

**`clinic_enrollments`** — clinic attribution, consent, billing anchor:  
`id, clinicId, clientUserId, referrerUserId nullable, enrollmentCode nullable, consentSharedWithClinic, consentSharedAt nullable, consentWithdrawnAt nullable, cohortLabel, status ('invited'|'enrolled'|'active'|'graduated'|'withdrawn'), enrolledAt, firstActiveAt`.

**`clinic_enrollment_codes`** — enrollment links/codes:  
`id, clinicId, code unique, createdByUserId, cohortLabel, maxUses nullable, uses, expiresAt nullable, createdAt`.

**Role extension:** allow `users.role='referrer'`; membership role remains authoritative for clinic scope. Do not create a clinic UI or redirect until Run 3.

**Migration:** `0035_clinic_b2b2c.sql` + Drizzle schema. Seed Sagar's Rehab as an active clinic without personal contact details.

**Acceptance:**
- [x] Tables and indexes exist after migration.
- [x] Sagar's Rehab seed is idempotent.
- [x] A referrer user can be attached through `clinic_memberships`.
- [x] Existing users, counselor assignment, and client intake are unchanged (production build/typecheck pass; no existing route behavior changed).

---

## Run 2 — Clinician-initiated enrollment

1. **Enrollment code/link (primary):** referrer generates a code per cohort; patient enters it during OTP onboarding. Create `clinic_enrollments`, then show separate clinic-sharing consent.
2. **Admin attach (fallback):** `POST /api/admin/clients/[id]/clinic` attaches an existing client.

Mobile adds code entry + consent to onboarding, then proceeds into existing intake.

**Acceptance:** a valid code produces clinic attribution with separately recorded sharing consent; invalid/expired/exhausted codes fail safely; unattributed signup is unaffected.

**Built (2026-07-18):** `POST/GET /api/enroll/clinic-code` (idempotent redeem + code use increment), `POST /api/enroll/consent` (separate grant/withdraw), `POST /api/admin/clients/[id]/clinic` (admin attach, consent stays patient-only). Mobile: `(client)/clinic-enroll.tsx` code+consent screen shown before intake (skippable, AsyncStorage-dismissed), wired from `index.tsx`.

---

## Run 3 — Referrer role, authorization boundary, and web view

Add `/clinic`, separate from `/provider` and `/admin`.

Referrer patient projection may include only:
- initials or first name + cohort
- enrollment status, first/last active
- **PTS program engagement** (clearly labeled)
- **self-reported** physio exercise completion
- current/released week
- coarse engagement state

Build clinic-scoped APIs; do not reuse counselor endpoints. Referrers must never receive messages, notes, reflections, read-out content, safety detail, or `plan_weeks.content`. Sensitive reads are audited.

**Acceptance:** referrer sees only consented patients from their clinic; cross-clinic and counseling-content requests are denied in server-side authorization tests.

**Built (2026-07-18):** `/clinic` web area (`layout.tsx` + `ClinicShell`) gated by `getClinicActor`. `GET /api/clinic/patients` returns the whitelisted projection from `clinic-projection.ts` (label, cohort, status, week, PTS engagement, self-reported physio only). Referrer sees only their own enrollments; clinic_admin sees the whole clinic. `GET/POST /api/clinic/codes` for code generation. All reads audited via `recordAudit`. Login redirects `referrer` → `/clinic`.

---

## Run 4 — Instruments and two honest engagement signals

Two distinct metrics:

1. **PTS program engagement** — derived from PTS check-ins/practices/read-outs; never called adherence.
2. **Self-reported physio-exercise completion** — daily Yes / Partly / No; always labeled patient self-report, not device verified.

Outcome measures at baseline and Week 6:
- TSK-11
- return-to-sport readiness
- PSEQ
- PHQ-2 / GAD-2
- PCS only after length decision

`outcome_measures`: `id, userId, phase, instrument, score, rawJson, capturedAt`.

Baseline goes at intake tail; Week 6 at graduation.

**Acceptance:** both metric types remain separate in storage and UI; baseline and Week-6 scores persist; counselor sees individual deltas, clinic receives aggregates only.

**Built (2026-07-18):** `outcome_measures` + `physio_self_reports` tables (migration `0036`). Instrument definitions + authoritative scoring in `outcome-instruments.ts` (TSK-11 with reverse items 4/8, RTS, PSEQ, PCS, PHQ-2, GAD-2). `GET /api/outcome-measures/instruments` is the single source mobile fetches; `POST /api/outcome-measures` recomputes the score server-side (clients never submit a trusted score). `GET/POST /api/physio-self-report` (daily Yes/Partly/No). Mobile: `instruments.tsx` runner (baseline at intake tail, Week 6 at graduation), `PhysioSelfReportCard` on Today for consented clinic patients. PTS engagement is derived in `clinic-engagement.ts` from check-ins/read-outs/holistic — never labelled adherence.

---

## Run 5 — Clinic outcomes dashboard

At `/clinic/dashboard`, aggregate and de-identified:
- enrolled / active / graduated / withdrawn
- PTS program engagement and self-reported exercise completion as separate metrics
- retention at Day 7 / Day 14 / Week 6
- mean TSK-11, return-to-sport, and PSEQ deltas with `n`
- dropout stage

Suppress cells with `n<5`. See [dashboard mockup](./assets/clinic-outcomes-dashboard-mockup.svg).

**Acceptance:** only real clinic-scoped aggregates render; every rate shows `n`; no individual or counseling content is exposed.

**Built (2026-07-18):** `GET /api/clinic/dashboard` (clinic_admin only) via `buildClinicDashboard` — counts, PTS engagement + self-reported physio as separate cards, Day 7/14/Week 6 retention, TSK-11/RTS/PSEQ mean deltas, dropout stage; cells with `n<5` suppressed (`MIN_CELL_N`). Web `clinic/dashboard` renders every rate with its `n` and the honesty separation.

---

## Run 6 — Active-patient billing meter

Proposed (not yet approved): enrollment status active/graduated plus at least one PTS engagement in the calendar month.

Build `GET /api/clinic/billing?month=YYYY-MM` for admin/clinic-admin with de-identified CSV export. Pilot invoices remain manual.

**Built (2026-07-18):** `GET /api/clinic/billing?month=YYYY-MM[&format=csv]` (clinic_admin only) via `buildClinicBilling` — active = in-program (`enrolled`/`active`/`graduated`) AND ≥1 PTS engagement in the calendar month; de-identified pseudo-IDs; CSV export. Web `clinic/billing` shows the meter + month picker + CSV download.

---

## Management gaps closed (2026-07-18)

Follow-up after Runs 1–6 to make the layer operable without hand-editing the DB:

1. **Clinic staff onboarding (admin).** `GET /api/admin/clinics` lists clinics + members; `POST /api/admin/clinics/[clinicId]/members` creates a new web-login `referrer` (email + temp password) or attaches an existing referrer/admin, and sets the membership role (`referrer` | `clinic_admin`); `DELETE …/members/[membershipId]` removes a membership (user account untouched). Clients are never converted to staff. New admin page `/admin/clinics` (linked from AdminNav).
2. **Enrollment lifecycle.** `PATCH /api/clinic/enrollments/[id]` sets status (`enrolled`/`active`/`graduated`/`withdrawn`; auto-stamps `firstActiveAt` on first →active) and (clinic_admin only) reassigns the referrer to another clinic member. Referrers may only act on their own attributed patients. Wired into `clinic/patients` as per-row status + referrer selects.
3. **Code revocation.** `DELETE /api/clinic/codes/[id]` revokes by pushing `expiresAt` into the past (row preserved for audit; existing enrollments unaffected). Referrers revoke only their own codes. Revoke button on `clinic/codes`.
4. **Patient-side consent withdrawal.** Mobile Privacy & data screen shows a "Sharing with your clinic" card for enrolled patients with a Stop/Resume toggle via `POST /api/enroll/consent` (sets/clears `consentWithdrawnAt`). Stopping does not end the PTS program.

All actions audited. No schema change (reuses existing columns). Web + mobile typecheck clean; production build passes.

## Build order

1. Run 1 data foundation.
2. Run 2 enrollment + Run 3 authorization/projection.
3. Run 4 baseline first (cannot be reconstructed later).
4. Run 5 dashboard + Run 6 meter before pilot read-out.

## Decisions locked (2026-07-18)
1. **Active-patient definition** — status `active`/`graduated` AND ≥1 PTS engagement (check-in / practice / read-out) in the calendar month.
2. **Consent placement/granularity** — separate clinic-sharing consent on a dedicated screen, shown right after the patient enters an enrollment code during onboarding; not bundled into intake program consent.
3. **Referrer vs clinic-admin split** — build both roles for Sagar's: `referrer` sees only their own attributed patients; `clinic_admin` sees clinic aggregate + billing.
4. **Instrument length** — full set: TSK-11 + return-to-sport readiness + PSEQ + PHQ-2/GAD-2 + PCS, at baseline and Week 6.
5. **Self-reported physio-exercise item** — daily Yes / Partly / No; always labeled patient self-report, never device-verified.
6. **Verified adherence** — deferred; does not block pilot self-report.
7. **DPDP/legal posture and named grievance officer** — blocks recruitment/contract, not the build.

## Test plan
- Apply migration twice; second pass must be harmless.
- Create a test referrer user and attach membership; verify unique constraints.
- Regression: existing client OTP, counselor login/Caseload, admin login.
- Run 2+: invalid/expired/exhausted code cases and consent withdrawal.
- Run 3+: explicit cross-clinic and counseling-endpoint denial tests.
- Run 5+: `n<5` suppression and sample-data label removal.

## Dependencies
- Ready-pool completed-intake gate — extend, do not replace.
- Counselor assignment remains orthogonal to clinic attribution.
- Reuse `/admin/explorer` masking patterns.
- Hook Week-6 instruments to graduation.
- Existing daily activity is **PTS program engagement**, not adherence.
