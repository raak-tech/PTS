# PTS Pilot — Consolidated Todo (single source of truth)

**Last updated:** 2026-07-14 (Spec H QA pass; Phase E onsetType; client intake copy fix; APK B v25)

**Session snapshot (2026-07-14 evening):**
- **Branch:** `PainModelLearned` (ahead of master; not merged).
- **Web:** production https://pts-web-pied.vercel.app — Spec H path + Phase E extract + client `toClientFacingText` live.
- **Mobile:** pain-pilot APK **versionCode 25** — `apps/mobile/dist/pts-mobile-pain-pilot.apk` → prod API, `com.pts.mobile.painscript`.
- **QA account:** client `9988776655` (OTP `123456`); counselor `+919900000002`.
- **Spec H:** formulation → approve → Week 1 with `formulationSummary` + `personalizationBasis` — API script **9/9**.
- **Do not commit:** WhatsApp screenshots / secrets.

**Process:** [`DEV_WORKFLOW.md`](DEV_WORKFLOW.md) · KB [`kb/README.md`](kb/README.md)

---

## Tomorrow (2026-07-15) — kickoff list

| # | Item | Why |
|---|------|-----|
| 1 | Install/verify APK B **v25** on Pixel — re-run intake confirm; no “The client…”, no confidence %, soft pain-source labels | Close tonight’s client-copy bug on device |
| 2 | Spec H **device** smoke — waiting-plan `formulationSummary`, week `personalizationBasis`, flare ≠ crisis | API 9/9; device not fully signed off |
| 3 | Spec Phase E **depth** — coverage follow-ups on thin cells with real multi-round intake; verify `onsetType` lands in DB → formulation/plan modalities | Partial ship; needs end-to-end proof |
| 4 | Close **§16** decisions with Ramya (music M1/M2, Ayurveda sign-off, SD_BEHAVIOUR, modality set, EAET) | Unblocks post-pilot library work |
| 5 | Optional: copy MacBook Pain Script **spec** into `docs/specs/` for line-by-line checklist | Tailscale/Mac source often unreachable |
| 6 | Pilot ops hygiene — MSG91 / `CRON_SECRET` / Sentry only if go-live week | Deferred unless recruitment starts |

**Leave deferred:** curated `holistic_items`, owned-IP music M2, `MOD_EAET`/`MOD_PEER`.

---

## Kickoff bar (legacy pilot UX)

Pain Script path is primary on `PainModelLearned`. Control APK §5 device QA still open if cohort A is in the pilot.

| # | Must-have | Status |
|---|---|---|
| 1 | Profile reachable + sign out + build info on **waiting-plan** | ✅ |
| 2 | Client **share with counselor** on Profile (§2) | ✅ |
| 3 | Initial LLM → **Week 1 only** + counselor comment gate before Week 2+ (§3) | ✅ |
| 4 | At least one read-out voice item | ✅ |
| 5 | `/api/me/contacts` 500 fixed | ✅ |
| **Parked** | §5 device QA on control APK (5a/5b/5g/5h) | 📋 if cohort A runs |

---

## 1. 🔴 Client UX — blocking / user-reported

- [x] **Profile not reachable before plan approval** — `waiting-plan` → Profile & settings; sign out, build number, safety/privacy, share with counselor.
- [x] **Client replay own read-out voice** after submit on Today tab (text + voice via `todayResponse` in reinforcements API).
- [x] **Counselor workspace: view + play** client read-out responses (text + voice) — §9.4 web `CounselorReadOutEditor`.
- [x] **API: return today's response** (`bodyText`, `audioUrl`, `responseType`) in `GET /api/reinforcements`.

---

## 2. 🔴 Client → counselor data (beyond messages)

- [x] **Profile: “Share with counselor”** — categories (What's changed / Questions / Wins) on Profile + waiting-plan entry.
- [x] **Persist + surface on counselor side** — `counselor-share` artifacts; web workspace **Client updates** panel.
- [x] **Distinct from Today’s notes** — separate `counselor-share` kind (not daily journal).
- [x] **Include in Week N+1 LLM context** (§3) — `buildWeeklySummary().clientShares`.
- [x] **Optional:** notify counselor on new client share (push) — `counselor-share` POST notifies assigned counselor.

*Partial before build 11:* artifacts API existed; Profile UX and counselor panel not wired.

---

## 3. 🔴 LLM plan model — Week 1 first, then gated weekly generation

**Product rule:**

1. **After intake** — LLM generates **Week 1 only** (overview + `clientSummary` + `watchPoints` OK; **no Weeks 2–6** in first draft).
2. **Counselor reviews Week 1** — inline edit, optional private notes, approve → client goes live on Week 1.
3. **Before Week 2+** — counselor **must add a comment** before “Generate Week N” is enabled.
4. **Week N+1 LLM call** — prompt includes **all updated performance data**.

### 3a. Implementation todos

- [x] **Change initial generation** — `generatePlan()` Week 1 only; `seedDraftPlanWeeks()` on regenerate.
- [x] **Counselor comment gate** — `plan_weeks.counselor_week_comment` + API check on `regenerate-week`; web workspace comment UI.
- [x] **Enrich `buildWeeklySummary()`** — check-ins, holistic, read-outs, reflections, client shares, prior week comment/content.
- [x] **Update `week-plan-generator.ts` prompt** — enriched summary fields.
- [x] **Program tab** — locked weeks show teaser copy until counselor releases (Run C1, APK 13).
- [x] **Docs:** update `PROVIDER_WORKFLOW.md` + `PROJECT_STATUS_REVIEW.md` for Week-1-first model (§9.8).

---

## 4. 🟠 Bugs & data integrity

- [x] **Fix `/api/me/contacts` HTTP 500** — defensive profile/unread queries; provider client list uses `inArray` (verified `9988776655`).
- [x] **Align counselor assignment** — first-action claim on generate Week 1 / week edit / week approve; queues scoped to unclaimed-or-mine (Run D).
- [x] **Fix stuck Week 1 initiation** — self-healing `generate-plan` + workspace Generate Week 1 control.
- [x] **Hide "Message counselor" for unmapped clients** — mobile Today, waiting-plan, StrugglingFab (Run D).
- [x] **Pending intake → generate plan** — inline waiting UX (elapsed timer, keep-tab-open hint), graceful `plan_exists`/timeout/error handling with retry; admin push on new draft; `generate-plan` given `maxDuration: 300` in `vercel.json`.

---

## 5. 🟠 Mobile UX (review backlog)

**Run C plan:** [`docs/plans/2026-07-03-section-5-mobile-ux-run-c.md`](plans/2026-07-03-section-5-mobile-ux-run-c.md)

| Item | Status | Run |
|------|--------|-----|
| Crisis notes gate before plan approve (SCOPE-I) | ✅ built (web + mobile) — **QA on device** | QA |
| C7 safety flow — verify 2-screen copy on device | 📋 **QA only** | QA |
| Counselor “open web workspace” link | ✅ Run B | — |
| Provider mobile parity | ✅ Run B / APK 12 | — |
| 6 weeks visible in counselor mobile plan review (SCOPE-D) | ✅ locked 2–6 cards (APK 13) | **C2 ✅** |
| Locked week teaser cards on Program tab (client) | ✅ `releasedWeeks` fixed + week detail guard (APK 13) | **C1 ✅** |
| Weekly check-in one-question-at-a-time | ✅ built — **QA on device** | QA |
| 6-box OTP — verify Android autofill | 📋 **QA** (+ optional `sms-otp` attrs) | QA |

- [x] Crisis notes acknowledgment gate before plan approve — implemented web + mobile; device QA pending.
- [ ] C7 safety flow — verify 2-screen copy on device (`MOBILE_APP_UX.md` C7 / C7a).
- [x] Counselor “open web workspace” link from mobile client detail.
- [x] **Provider mobile parity** — §9.6, APK 12.
- [x] All **6 weeks visible** in mobile plan review — Week 1 + Weeks 2–6 **locked cards** (Run C2, APK 13).
- [x] Locked week teaser cards on Program tab — Run C1: `releasedWeeks` fallback → `[1]`, test-clock respects releasedWeeks, week detail locked guard (APK 13).
- [x] Weekly check-in one-question-at-a-time flow (`program/check-in.tsx`); device QA pending.
- [ ] 6-box OTP — verify Android autofill / paste on Pixel.

---

## 6. 🟠 Counselor web

- [x] **Plan review queue** — Week-1-first UI; locked weeks 2–6; no bulk approve (§9.1).
- [x] **Read-out playback** — view/play client text + voice on web workspace (§9.4).
- [x] **Weekly data panel** — enriched summary on client workspace (§9.3).
- [x] **Full inline plan editing** — counselorNote, ayurveda practices/disclaimer, music playlist/tracks, daily practice add/remove (Run E).
- [x] **Pain trend sparkline** — client workspace + engagement dashboard (Run E).
- [x] **Counselor profile / Calendly edit** — `/provider/profile` + clear URL + audit (Run E).
- [x] **SLA escalation (12h) to admin** — `/api/admin/sla` + dashboard panel (Run F).
- [x] **Notify counselor on new client share** — push on `counselor-share` (Run D).
- [x] **Workspace Plan tab → week sub-tabs (Week 1–6)** — `?tab=plan&week=N`; shared `WeekEditor` mounted per week; inline edit + approve every round (Run I).
- [x] **Edit propagation fix** — approving a week merges `plan_weeks.content` into `plans.generatedContent`, flips plan to `approved` on first release, and seeds the daily layer, so counselor edits actually reach the client (Run I). `apply-week` now also creates the draft `plan_weeks` row for weeks 2–6.
- [x] **Per-week activity panel** — `GET /api/provider/clients/[id]/week/[n]/activity` + `WeekActivityPanel` (read-outs, blocks, check-ins, pain, reflections, holistic) (Run I).
- [x] **Cross-week patterns** — `client-week-metrics.ts` + `GET /api/provider/clients/[id]/program-metrics` + `ProgramPatternsPanel` (adherence/read-out/pain trends table) (Run I).
- [x] **Plan review queue slimmed** — cards link into the workspace Plan tab ("Open in workspace") (Run I).

---

## 10. 🟠 Super Admin Panel

**Status:** ✅ Shipped (2026-07-02)

- [x] **LLM cost tracking** — `llm_usage` table; OpenRouter `usage.include` actual $; plan + week generation instrumented.
- [x] **Cost dashboard** — `/admin/costs` — spend by day/operation/model, top clients, recent calls.
- [x] **Analytics dashboard** — `/admin/analytics` — signups, DAU/WAU, funnel, retention by week.
- [x] **Data explorer** — `/admin/explorer` — whitelisted read-only tables with PII masking + pagination.
- [x] **Audit log** — `/admin/audit` — plan approve, regenerate, week apply, user create, admin notes.
- [x] **Dashboard cards** — LLM spend (30d) + active users (7d) on main `/admin`.

**Routes:** `/admin`, `/admin/analytics`, `/admin/costs`, `/admin/explorer`, `/admin/audit`

**Follow-ups (optional):**
- [x] **Pain trend sparkline on counselor engagement** — Run E.
- [x] **SLA escalation (12h) to admin** — Run F.
- [x] **Broader audit coverage** — week edit/approve, generate-plan, schedule, profile, messages, note-resolve (Run E).

---

## 7. 🟠 Post–Week 6

- [x] **Graduation screen + maintenance mode** — graduation redirect in tabs + maintenance Program tab (Run G, APK 14).
- [x] **Monthly check-in cadence post-program** — `monthly_check_ins` schema + migration; calendar `completedAt` fix (Run G).

---

## 8. 🟡 Go-live & infra

- [ ] **Real MSG91 OTP** — code aligned to proven integration; set `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` on Vercel and remove `OTP_TEST_MODE` (keys not in sibling `.env` — set manually).
- [x] **Production admin via `ADMIN_EMAILS`** — admin panel + observability shipped.
- [x] **90-day intake cleanup job** — Vercel cron `/api/cron/intake-cleanup` + optional `CRON_SECRET` env (Run H). Without `CRON_SECRET`, cron returns 401 and does nothing (safe default).
- [ ] **Sentry + staging environment** — deferred (needs account/DSN).
- [ ] **Vercel `sin1` region** — optional / regulatory (skipped).
- [x] **Doc hygiene** — PILOT_TODO updated (Run H).

---

## 9. 🟠 Counselor web & mobile alignment

**Spec:** [`docs/plans/2026-07-02-section-9-counselor-alignment.md`](plans/2026-07-02-section-9-counselor-alignment.md)  
**Process:** [`DEV_WORKFLOW.md`](DEV_WORKFLOW.md)  
**Status:** ✅ Run A + Run B shipped — **9.5 optional**

### Context

Build 11 shipped client + API. **Run A + Run B (2026-07-02)** aligned counselor web and mobile with Week-1-first model.

### Alignment summary (post Run B)

| Feature | API | C-web | C-mobile | Client mobile |
|---------|-----|-------|----------|---------------|
| Week-1-only generate | ✅ | ✅ plan queue | ✅ labels | — |
| Week comment gate | ✅ | ✅ workspace | ✅ | — |
| Enriched weekly summary | ✅ | ✅ panel | ✅ summary card | — |
| Client share | ✅ | ✅ updates panel | ✅ | ✅ |
| Client read-out replay | ✅ | ✅ playback | ✅ playback | ✅ |
| Locked weeks 2–6 UI | — | ✅ plan queue + workspace | ✅ locked cards (APK 13) | ✅ teaser cards (APK 13) |
| Workflow docs | — | ✅ | — | — |

*C-web / C-mobile = counselor web / counselor mobile*

### Work packages (track in spec)

| ID | Package | Priority | Spec § | PILOT_TODO |
|----|---------|----------|--------|------------|
| 9.1 | Plan review queue Week-1-first | P0 | 9.1 | §6 plan queue |
| 9.2 | Generation / push copy | P0 | 9.2 | §6 (copy) |
| 9.3 | Enriched weekly data panel | P1 | 9.3 | §6 weekly panel |
| 9.4 | Counselor read-out playback (web) | P0 | 9.4 | §1 counselor playback |
| 9.5 | Engagement dashboard | P2 | 9.5 | §6 optional |
| 9.6 | Provider mobile parity | P1 | 9.6 | §5 provider mobile |
| 9.7 | Week approvals `totalWeeks` | P1 | 9.7 | §9 |
| 9.8 | `PROVIDER_WORKFLOW` + `DECISIONS` | P0 | 9.8 | §3 docs |

### Suggested dev runs (after approval)

- **Run A (web):** 9.8 + 9.1 + 9.2 + 9.4  
- **Run B (web + APK 12):** 9.3 + 9.7 + 9.6  
- **Run C (web + APK 13):** 5.C1 + 5.C2 + 9.5  

### Package checklist

- [x] **9.1** Plan review queue — Run A 2026-07-02
- [x] **9.2** Plan generation UX copy — Run A 2026-07-02
- [x] **9.3** Weekly data panel — Run B 2026-07-02
- [x] **9.4** Read-out playback (web) — Run A 2026-07-02
- [x] **9.5** Engagement dashboard — Run C 2026-07-02: "💬 Client update" badge (counselor-share in last 7 days) on engagement cards.
- [x] **9.6** Provider mobile parity — Run B 2026-07-02 (APK 12)
- [x] **9.7** Week approvals UI — Run B 2026-07-02
- [x] **9.8** Documentation — Run A 2026-07-02

---

## ✅ Done (through build 14)

- [x] Intake selection highlight fix
- [x] Intake resume modal loop fix
- [x] Stale session: phone switch sign-out, clear intake draft, session refresh on launch
- [x] Tabs guard → `waiting-plan` when `!planApproved`
- [x] Waiting-plan honest copy when no plan row
- [x] Profile on waiting-plan + shared `ClientProfileContent`
- [x] Share with counselor (mobile + web Client updates)
- [x] Week-1-only LLM + plan_weeks seed + counselor comment gate
- [x] Enriched weekly summary for Week N+1 generation
- [x] Client read-out replay (text + voice) on Today
- [x] `/api/me/contacts` 500 fixed (production verified)
- [x] **Runs D–H (build 14):** counselor claim-on-first-action, scoped queues, Message-counselor gating, inline plan editing, pain sparklines, admin SLA panel, monthly check-ins + graduation, intake cleanup cron, pending-intake waiting UX
- [x] APK build 14 at `apps/mobile/dist/pts-mobile-release.apk` — installed on Pixel 7 2026-07-03

---

## Deferred — Intake quality, LLM cost, and payment gates

**Context (2026-07-13):** Avoid burning OpenRouter on nonsense intake; align client payment with deliverable value (Week 1), not raw LLM calls. **No code yet** — pick up when pilot traffic justifies it.

**Policy (target):** Cheap automation for intake structure; expensive AI only when intake is complete and counselor is ready to deliver Week 1; **payment only after Week 1 approval** (or explicit enrollment post–counselor review).

### Tier 0 — Free gates (before any LLM)
- [ ] Max length cap on intake free-text (anti-spam)
- [ ] Heuristic nonsense detection (keyboard mash, repeated chars, too few distinct words)
- [ ] Per-user / per-phone rate limits on `POST /api/intake/extract`
- [ ] Idempotency / cache: same text hash → return cached extraction (avoid double-billing on retries)

### Tier 1 — Cheap on-topic check
- [ ] Lightweight classifier or small model: “personal health/sleep/stress concern?” → block extraction LLM if off-topic
- [ ] Friendly UX copy when blocked (not a raw error)

### Tier 2 — Tighten existing extraction gate
- [ ] Review round-3 escape hatch (`canSubmit` when `round >= 3` even if required fields weak) — require minimum bar, not blind submit
- [ ] Segment-specific required fields (e.g. sleep pattern for sleep segment, not only pain-shaped fields)
- [ ] Counselor queue flag: “low-quality intake” when confidence low

### Tier 3 — Expensive LLM (formulation / Week 1)
- [ ] Ensure formulation + Week 1 generation never run without complete intake + counselor action (audit current pain-script path)
- [ ] Admin dashboard: LLM spend per client / per intake session (extend `llm_usage`)

### Payment & commercial
- [ ] Define paywall placement: **after Week 1 approved & released** (not on intake submit or background formulation)
- [ ] Copy: clients pay for counselor-reviewed program, not “AI processing”
- [ ] Refund / decline path if intake unusable or counselor declines case
- [ ] OpenRouter hard spend cap + alerts for pilot

---

## Test accounts

| Phone | Role | Expected home |
|-------|------|----------------|
| `9998887776` | Client (new) | `waiting-plan` — Profile & settings; Message counselor hidden until mapped |
| `9988776655` | Client (approved) | Today tabs; contacts → counselor |
| `9900000002` | Counselor | Provider queue / web workspace |

OTP (pilot): `123456` for test numbers.

---

## Document map (todo cleanup)

| Document | Role now |
|----------|----------|
| **`PILOT_TODO.md`** | **← Active execution queue (this file)** |
| **`docs/kb/`** | **← Incidents, mobile/intake/ops learnings; continuous capture + review** |
| **`DEV_WORKFLOW.md`** | **← Analyze → Document → Review → Build (required before §9 code)** |
| `docs/plans/2026-07-02-section-9-counselor-alignment.md` | **§9 feature spec (shipped Run A–C)** |
| `BACKLOG.md` | Long-term product backlog by track |
| `DEV_RUN_TODO.md` | Redirect → this file |
| `PROJECT_STATUS_REVIEW.md` | Gap analysis / recommendations (reference) |
| `BUILDOUT_PLAN.md` | Product vision / phases (reference) |
| `BUILD_SEQUENCE.md` | Historical build steps (reference) |
| `PHASE0_CHECKLIST.md` | Manual QA runbook (not a dev queue) |
| `PRODUCTION_READY_CHECKLIST.md` | Launch gates (reference) |
