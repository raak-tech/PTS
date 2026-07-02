# Section 9 — Counselor Web & Mobile Alignment

**Status:** Run B shipped (2026-07-02) — §9 complete except 9.5 (P2)  
**PILOT_TODO:** §9 Counselor web & mobile alignment  
**Created:** 2026-07-02  
**Build target:** Web deploy first, then APK 12 (counselor mobile parity optional in same or follow-up drop)

**Process:** [`DEV_WORKFLOW.md`](../DEV_WORKFLOW.md) — **no coding until this spec is Approved for build.**

---

## Summary

Build 11 delivered Week-1-first LLM generation, counselor week-comment gate, client “share with counselor,” and client read-out replay on **API + partial counselor web**. Counselors still hit **6-week language** on the plan review queue, cannot **play client read-out recordings**, see only **partial weekly data**, and **provider mobile** lags web.

This spec defines eight work packages (9.1–9.8) with per-role acceptance criteria so all surfaces tell the same clinical story.

---

## Product rules (non-negotiable)

1. **Intake → LLM produces Week 1 only** in `generatedContent` and `plan_weeks` (week 1 = `draft`).
2. **Counselor approves Week 1** → client goes live on Week 1 only; Weeks 2–6 are **locked** until generated + approved.
3. **Before Week N+1 generation** → counselor must save `counselorWeekComment` on approved Week N (API already enforces).
4. **Client shares** (`counselor-share` artifacts) are visible to counselor and included in Week N+1 LLM context (API done).
5. **Client read-out responses** (text/voice) are visible to counselor on web (and mobile parity in 9.6).
6. **No “Approve all weeks”** anywhere in the product — only **per-week approve**. Remove UI on web and mobile; new plans must not use bulk approve API path.

**Decision note:** `DECISIONS.md` 2026-06-30 SCOPE-G said “AI generates full 6-week plan draft.” **Amended 2026-07-02** to Week-1-first initial generate + gated weekly generation (see § Doc updates).

**Review gate resolutions (2026-07-02):**
| # | Question | Decision |
|---|----------|----------|
| 1 | Approve all weeks? | **Never.** Remove from web + mobile; per-week only. |
| 2 | Engagement “new share” indicator? | **Yes, lightweight** — show when client submitted `counselor-share` since counselor last opened workspace (see §9.5). Data already feeds LLM separately (see § Client share → LLM). |
| 3 | Client Program locked teasers? | **Separate work package** after §9 Run A — see § Client Program locked weeks (below). |

---

## Feature inventory (current state — build 11)

| Capability | API / DB | Client mobile | Counselor web | Counselor mobile |
|------------|----------|---------------|---------------|------------------|
| Week-1-only `generatePlan()` | ✅ | — | — | — |
| `seedDraftPlanWeeks` on draft create | ✅ | — | — | — |
| Per-week approve (`plan_weeks`) | ✅ | Sees released weeks | Workspace Plan tab | Plan review screen |
| Week comment gate (`regenerate-week`) | ✅ | — | ✅ Workspace Plan tab | ❌ |
| `buildWeeklySummary` enriched | ✅ | — | ⚠️ Counts only in UI | ⚠️ Partial |
| `counselor-share` artifacts | ✅ | ✅ Profile + waiting-plan | ✅ Client updates panel | ❌ |
| Read-out submit + replay (client) | ✅ `todayResponse` | ✅ Today tab | — | — |
| Read-out responses for counselor | ✅ `latestResponse` | — | ❌ Editor | ❌ |
| Contacts / counselor assign | ✅ | ✅ Messages | ✅ | ✅ |
| Plan review queue copy | — | — | ❌ “6-week” | ❌ |
| Locked weeks 2–6 teaser | — | ❌ Program tab | ❌ Plan tab slots | ❌ |
| Generation progress copy | — | — | ❌ “6-week program” | — |
| Push: plan approved | ✅ | ✅ | — | — |

---

## Role impact matrix

### Client (mobile)

| Area | Before (build 11) | After (§9 complete) |
|------|-------------------|---------------------|
| Program tab | May show weeks not yet approved | Locked weeks 2–6 show teaser only (ties to §5 / 9.7 client slice) |
| Today read-out | Replay own voice ✅ | No change |
| Profile share | ✅ | No change |
| Waiting for plan | Profile ✅ | No change |

*Client-facing locked-week teasers may ship in same pass as counselor plan UI or immediately after — see 9.7.*

### Counselor (web)

| Area | Before | After |
|------|--------|-------|
| `/provider/plans` | 6-week copy, all weeks editable, “Approve all” | Week-1-first copy; 1 active week + locked 2–6; per-week approve primary |
| Client workspace Overview | Client updates ✅ | + enriched weekly panel (pain, read-outs, shares) |
| Client workspace Read-outs | Edit counselor read-outs only | + list client responses; play voice |
| Client workspace Plan | Comment + generate ✅ | `totalWeeks` from data not default 6 |
| Engagement dashboard | Basic checklist | Optional: new-share indicator, pain trend |
| Pending intakes | Generate plan | Copy: “Generates Week 1 draft” |

### Counselor (mobile)

| Area | Before | After |
|------|--------|-------|
| Client detail | Hardcoded “Generate Week 2” | Dynamic Week N+1; comment required |
| Client detail | No client updates | Feed matching web Client updates |
| Client detail | No playback | Play client read-out audio / show text |
| Plan review | Legacy 6-week assume | Week-1-first labels (if in scope this run) |

### Admin (web)

| Area | Before | After |
|------|--------|-------|
| Client dossier | Has artifacts | No change required §9 (optional: counselor-share filter) |

### API

| Area | Before | After |
|------|--------|-------|
| Core contracts | Build 11 complete | No breaking changes expected; UI consumes existing fields |

---

## Work packages

### 9.1 Plan review queue (`PlanReviewClient`) — Priority P0

**Files:** `apps/web/src/app/provider/plans/PlanReviewClient.tsx`, `apps/web/src/app/provider/plans/page.tsx`

**Behaviour:**
- Header/copy: “Week 1 draft” not “6-week plan.”
- Render `plan.weeks` from JSON (already 1 week for new drafts).
- Weeks 2–6: **locked cards** — “Not generated yet — approve Week 1, then generate Week 2 from client workspace after week comment.”
- **Remove** “Approve all weeks & send to client” button and `approveAll` flow entirely (product rule: per-week only).
- Per-week `WeekEditor` unchanged for week 1; locked weeks not editable.

**Acceptance criteria:**
- [ ] New draft plan shows exactly **1** editable week.
- [ ] Weeks 2–6 show locked state with clear next step (workspace link).
- [ ] No user-facing “6-week plan” on this screen.
- [ ] **No “Approve all weeks”** button or copy on this screen.
- [ ] Crisis ack gate still blocks approve when `hasCrisisNotes`.
- [ ] Approving Week 1 only releases Week 1 to client (`plan_weeks` + push).

---

### 9.2 Plan generation UX copy — Priority P0

**Files:** `apps/web/src/lib/plan-generation-progress.ts`, `apps/web/src/app/api/plans/route.ts` (push body), `PendingIntakesClient.tsx` alert copy

**Behaviour:**
- Progress steps: “Building Week 1 program…” not “6-week program.”
- Push on full plan approve (legacy): “Your Week 1 program is ready” if only week 1; avoid “6-week” for new model.
- Pending intake button helper text: “AI generates Week 1 draft (~2–4 min).”

**Acceptance criteria:**
- [ ] Generation overlay strings updated.
- [ ] No “6-week” in new-plan generation path.
- [ ] Pending intake generate success message mentions Week 1.

---

### 9.3 Client workspace — enriched weekly data panel — Priority P1

**Files:** `ProviderClientWorkspaceClient.tsx` — extend `WeeklySummary` type; render API fields

**Display (from existing `GET .../weekly-summary`):**
- `painTrend`
- `morningCheckIns` (last 7 lines or table)
- `readOutSummaries` (bullets)
- `eveningReflectionSamples` (optional, truncated)
- `clientShares` (or link to Client updates section)
- `latestWeeklyCheckIn`
- Existing counts (read-out responses, blocks done/skipped, schedule insights)

**Acceptance criteria:**
- [ ] Counselor sees pain trend text when check-ins exist.
- [ ] At least one read-out sample line when client submitted this week.
- [ ] Panel matches data returned by API (no new endpoint required).

---

### 9.4 Counselor read-out playback (web) — Priority P0

**Files:** `CounselorReadOutEditor.tsx` and/or Read-outs tab in workspace

**Behaviour:**
- Extend `ReadOutRow` type with `latestResponse?: { responseType, bodyText, audioUrl, submittedAt }`.
- For each read-out in list: show “Client response today” / “Latest response” with text or HTML5 audio for `data:` or HTTPS URLs.
- Empty state: “No client response yet.”

**Acceptance criteria:**
- [ ] Counselor can read text response from client.
- [ ] Counselor can play voice response (same as client replay pattern).
- [ ] Uses `latestResponse` from `GET /api/reinforcements?clientId=`.

---

### 9.5 Engagement dashboard — new client share indicator — Priority P2

**Files:** `ProviderEngagementClient.tsx`, optionally `GET /api/provider/engagement` (add `hasRecentClientShare: boolean` per client)

**What this is (not LLM):** A **UI nudge** so counselors see “this client shared something for you” on the daily engagement list — separate from the LLM pipeline below.

**Behaviour:**
- Per client row: if `counselor-share` artifact created in last 7 days (or since last counselor view — TBD), show badge **“Client update”** linking to workspace Overview / Client updates.
- Link to client workspace.

**Acceptance criteria:**
- [ ] Counselor on engagement dashboard can spot clients who used Profile “Share with counselor” recently.
- [ ] Click goes to Client updates panel.

---

## Client share → counselor → LLM (already built in API)

This is **not** the same as the engagement badge. It is the **data pipeline** for Week 2+ plan generation.

```
Client (Profile)                Counselor (web)                 Week N+1 LLM
     │                                │                                │
     │  "Share with counselor"        │                                │
     │  (What's changed / Q / Wins)   │                                │
     ▼                                ▼                                │
 POST counselor-share          "Client updates" panel                   │
 artifact in DB               (readable anytime)                        │
     │                                │                                │
     └────────────────────────────────┴──► buildWeeklySummary()         │
                                          includes clientShares[]       │
                                          in prompt when counselor      │
                                          clicks "Generate Week N+1"    │
```

**Today (build 11):**
- Client can share ✅
- Counselor sees shares in workspace ✅
- LLM Week N+1 call reads shares ✅ (`buildWeeklySummary().clientShares`)
- Engagement dashboard does **not** yet highlight new shares ⚠️ (9.5)

**Counselor does not** paste shares into the LLM manually — the system pulls them automatically when generating the next week, together with pain check-ins, read-outs, calendar data, and the counselor’s own week comment.

---

## Client Program locked weeks (separate from §9 — detail)

**What the client sees today on mobile → Program tab:**

After Week 1 is approved, the client may still see **placeholders or empty content for Weeks 2–6** because those weeks do not exist in `plan_weeks` yet. That can feel like a broken or confusing program.

**What “locked teaser” means:**

Instead of empty or stale content, Weeks 2–6 would show a **locked card**, for example:

> **Week 2 — Coming soon**  
> Your counselor will prepare this week after reviewing how Week 1 went. You’ll get a notification when it’s ready.

The client can open Week 1 normally; Weeks 2–6 are visible but **not actionable** until the counselor generates and approves each week.

**Why it was a separate question:**

- §9 focuses on **counselor** tools (plan queue, playback, weekly panel).
- Locked Program teasers are **client mobile** UX (`PILOT_TODO` §5).
- Same product story, but different screens and test paths — we can ship counselor fixes first (Run A), then client Program tab (Run C or bundled in Run B if you prefer).

**Your call:** Ship after §9 Run A, unless you want it in the same APK as Run B.

---

### 9.6 Provider mobile client detail parity — Priority P1

**Files:** `apps/mobile/app/(provider)/clients/[id].tsx`, `api.ts`

**Behaviour:**
- **Client updates** card — fetch artifacts or dedicated endpoint (reuse pattern from web: counselor-share only).
- **Week comment** field + save → `PATCH /api/provider/plans/{planId}/week/{n}` with `counselorWeekComment`.
- **Generate Week N+1** — `approvedCount` from plan/week statuses; `weekNumber: approvedCount`; show API error `counselor_comment_required` clearly.
- **Read-out playback** — use `latestResponse` from reinforcements list.

**Acceptance criteria:**
- [ ] Mobile counselor sees client shares.
- [ ] Cannot generate next week without comment (matches web).
- [ ] Label says “Generate Week {N+1}” not hardcoded Week 2.
- [ ] Voice read-out plays on device.

---

### 9.7 Week approvals UI — `totalWeeks` from data — Priority P1

**Files:** `apps/web/src/app/provider/clients/[id]/page.tsx`, `ProviderClientWorkspaceClient.tsx`

**Behaviour:**
- `totalWeeks` = `max(6, max(plan_weeks.weekNumber), plan.weeks.length)` or product rule: always show 6 slots but only week 1+ have content — **prefer:** show 6 rows, weeks without `plan_weeks` row = locked “Not started.”
- Progress bar denominator = 6 program weeks, numerator = approved count.

**Acceptance criteria:**
- [ ] New client with only Week 1 draft shows Week 1 draft + Weeks 2–6 locked (not “approved”).
- [ ] Approved count accurate vs `plan_weeks`.

---

### 9.8 Documentation — Priority P0 (parallel with 9.1–9.2)

**Files:** `PROVIDER_WORKFLOW.md`, `DECISIONS.md`, `PROJECT_STATUS_REVIEW.md` (banner)

**Updates:**
- Workflow 1 Step 1: AI generates **Week 1 only** on intake.
- Workflow 2 Step 2: **Counselor comment required** before Generate Week N+1.
- DECISIONS: amend SCOPE-G / add 2026-07-02 entry for Week-1-first initial generation.

**Acceptance criteria:**
- [ ] `PROVIDER_WORKFLOW.md` no longer says “full 6-week” on first generate.
- [ ] `DECISIONS.md` records amendment with consequences.

---

## Recommended implementation order

| Order | Package | Rationale |
|-------|---------|-----------|
| 1 | **9.8 Docs** (draft) | Align language before UI copy |
| 2 | **9.1 + 9.2** | Counselor’s first touch after intake |
| 3 | **9.4** | Closes kickoff item 4 (counselor playback) |
| 4 | **9.3 + 9.7** | Workspace clinical picture |
| 5 | **9.6** | Mobile parity |
| 6 | **9.5** | Nice-to-have dashboard |

**Suggested dev runs:**
- **Run A:** 9.8 + 9.1 + 9.2 + 9.4 (web deploy)
- **Run B:** 9.3 + 9.7 + 9.6 (web + APK 12)

---

## Out of scope (§9)

- Client Program tab locked teasers (remain `PILOT_TODO` §5 — coordinate but separate spec if large).
- Full inline edit all fields (§6 backlog).
- Push notification on new client share (§2 optional).
- Admin dossier redesign.
- Deprecating legacy `POST /api/plans` approve-all for old plans (remove UI; API may remain for historical data only — **no new bulk approve**).

---

## Test plan

| Account | Role | Scenarios |
|---------|------|-----------|
| `9998887776` | Client (waiting) | Profile share → visible on counselor workspace |
| `9988776655` | Client (active) | Submit read-out voice → counselor plays on web |
| `9900000002` | Counselor | Generate Week 1 from pending intake; edit; approve Week 1 only; comment; generate Week 2 |

**Regression:** Existing 6-week approved plans still display correctly (legacy JSON).

---

## Open questions

**All resolved 2026-07-02** — see Product rules / Review gate resolutions above.

---

## Review gate checklist

- [x] Product owner: **no Approve all weeks** — per-week only
- [x] Client share → LLM pipeline explained in spec
- [x] Client Program locked teasers scoped separately (after Run A unless bundled)
- [x] Role matrix reviewed for client + counselor web + counselor mobile
- [x] Implementation order agreed (Run A / Run B)
- [x] Status → **Approved for build** (2026-07-02)

---

## Completion tracking

When a package ships, mark here and in `PILOT_TODO.md` §9:

| Package | Status | Shipped |
|---------|--------|---------|
| 9.1 Plan review queue | ✅ | 2026-07-02 Run A |
| 9.2 Generation copy | ✅ | 2026-07-02 Run A |
| 9.3 Weekly data panel | ✅ | 2026-07-02 Run B |
| 9.4 Read-out playback web | ✅ | 2026-07-02 Run A |
| 9.5 Engagement dashboard | ⬜ | |
| 9.6 Provider mobile parity | ✅ | 2026-07-02 Run B (APK 12) |
| 9.7 Week approvals UI | ✅ | 2026-07-02 Run B |
| 9.8 Documentation | ✅ | 2026-07-02 Run A |
