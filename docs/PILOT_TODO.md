# PTS Pilot — Consolidated Todo (single source of truth)

**Last updated:** 2026-07-02 (§9 Run B / APK 12)  
**Purpose:** One execution queue for dev runs, APK drops, and counselor pilot.  
**Rule:** Add new work here. Other docs keep product context only — link here instead of duplicating todos.

**Process (required before multi-surface code):** [`DEV_WORKFLOW.md`](DEV_WORKFLOW.md) — Analyze → Document → Review → Build  
**Related (not execution queues):** `PROJECT_BRIEF.md`, `PROVIDER_WORKFLOW.md`, `MOBILE_APP_UX.md`, `DECISIONS.md`  
**Long-term backlog (strategic):** `BACKLOG.md` — tracks 10+ product areas; **pilot work is pulled from this file**

---

## Kickoff bar for next dev run

**Build 11 (client) shipped.** **§9 Run A + Run B shipped** (counselor web + mobile APK 12). **§5 Run C shipped** (C1 client Program + C2 plan-review locked weeks + 9.5 engagement badge, APK 13) — device QA pending. **Super Admin Panel shipped** — LLM cost tracking, analytics, data explorer, audit log.

| # | Must-have | Status |
|---|---|---|
| 1 | Profile reachable + sign out + build info on **waiting-plan** | ✅ build 11 |
| 2 | Client **share with counselor** on Profile (§2) | ✅ build 11 |
| 3 | Initial LLM → **Week 1 only** + counselor comment gate before Week 2+ (§3) | ✅ API + workspace Plan tab |
| 4 | At least one read-out voice item (client replay **or** counselor playback) | ✅ client + counselor web + mobile |
| 5 | `/api/me/contacts` 500 fixed | ✅ deployed |
| **Next** | **§5 Run C shipped** (APK 13) → **device QA pass** (5a/5b/5g/5h); admin panel live at `/admin` | ✅ code shipped |

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
- [ ] **Optional:** notify counselor on new submission (push / unread badge).

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
- [ ] **Align counselor assignment with plan approval** — `planApproved` vs `client_counselor` row; enforce on approve.
- [ ] **Pending intake → generate plan** — waiting UX + notification when draft exists.

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
- [ ] Full inline plan editing (all week fields) before approve.
- [ ] Pain trend sparkline on engagement dashboard (check-in data exists).
- [ ] Counselor profile / Calendly edit on web.
- [ ] SLA escalation (12h) to admin per `DECISIONS.md`.
- [ ] Notify counselor on new client share (optional).

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
- [ ] Pain trend sparkline on counselor engagement (data exists in `daily_check_ins`).
- [ ] SLA escalation (12h) to admin per `DECISIONS.md`.
- [ ] Broader audit coverage on all mutation routes.

---

## 7. 🟠 Post–Week 6

- [ ] Graduation screen + maintenance mode (SCOPE-E).
- [ ] Monthly check-in cadence post-program.

---

## 8. 🟡 Go-live & infra

- [ ] Real MSG91 OTP (`BEFORE_PRODUCTION.md`).
- [x] **Production admin via `ADMIN_EMAILS`** — admin panel + observability shipped; set `ADMIN_EMAILS` on Vercel for prod access.
- [ ] Sentry + staging environment.
- [ ] Vercel `sin1` region (blocked on regulatory decision #20).
- [ ] 90-day intake cleanup job (`DECISIONS.md`).
- [ ] Doc hygiene: mark `BUILDOUT_PLAN.md` mobile section as shipped where applicable.

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
| Locked weeks 2–6 UI | — | ✅ plan queue + workspace | ⚠️ | ❌ |
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

## ✅ Done (through build 11)

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
- [x] APK build 11 at `apps/mobile/dist/pts-mobile-release.apk` (install when device connected)

---

## Test accounts

| Phone | Role | Expected home |
|-------|------|----------------|
| `9998887776` | Client (new) | `waiting-plan` — Profile & settings available |
| `9988776655` | Client (approved) | Today tabs; contacts → counselor |
| `9900000002` | Counselor | Provider queue / web workspace |

OTP (pilot): `123456` for test numbers.

---

## Document map (todo cleanup)

| Document | Role now |
|----------|----------|
| **`PILOT_TODO.md`** | **← Active execution queue (this file)** |
| **`DEV_WORKFLOW.md`** | **← Analyze → Document → Review → Build (required before §9 code)** |
| `docs/plans/2026-07-02-section-9-counselor-alignment.md` | **§9 feature spec (review gate pending)** |
| `BACKLOG.md` | Long-term product backlog by track |
| `DEV_RUN_TODO.md` | Redirect → this file |
| `PROJECT_STATUS_REVIEW.md` | Gap analysis / recommendations (reference) |
| `BUILDOUT_PLAN.md` | Product vision / phases (reference) |
| `BUILD_SEQUENCE.md` | Historical build steps (reference) |
| `PHASE0_CHECKLIST.md` | Manual QA runbook (not a dev queue) |
| `PRODUCTION_READY_CHECKLIST.md` | Launch gates (reference) |
