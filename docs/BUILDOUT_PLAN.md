# PTS — Unified Buildout Plan

**Status:** Draft for review  
**Last updated:** 2026-06-29  
**Audience:** Satheesh (product), Ramya (clinical), Engineering  
**Purpose:** One document tying together web, mobile, admin, API, pilot, and the new holistic recovery features (Ayurveda, music psychology, daily reinforcement, scheduling).

> **Execution todos:** [`PILOT_TODO.md`](./PILOT_TODO.md). Mobile APK is shipping (Expo); some sections below are dated.

---

## 1. Executive summary

PTS is a counseling-led pain recovery platform moving toward:

- **One Android app** (Expo) — clients + counselors, phone OTP login  
- **One admin web** — create users, metrics, escalations  
- **Shared API + PostgreSQL** — `apps/web` today on Vercel  

**New product direction (this plan):** Weekly plans and daily routines should integrate:

1. **Ayurveda-informed inputs** — dosha tendencies, daily rhythm (dinacharya), non-movement practices (breath, stillness, grounding) — *adjunct to counseling, not medical Ayurvedic treatment*  
2. **Music psychology** — curated listening for pain regulation, mood, pacing — grounded in evidence on music and pain/distress (arousal regulation, attention diversion, emotional processing)  
3. **Counselor daily read-out reinforcements** — counselor assigns short learnings; client records back (voice or text) daily  
4. **Daily calendar + stickiness** — client builds their day plan; confirms what they followed; free-text on what scheduling worked / didn’t  
5. **Weekly feedback loop** — all daily submissions feed the **next week’s plan** generation and counselor review  
6. **In-app Spotify playback** — from counselor-curated sets (requires Spotify integration; see §6)

**Visual direction:** Run a **theme comparison** across built screens before locking brand colors (see §8).

---

## 2. What exists today

| Area | Status |
|------|--------|
| Web core (intake → LLM plan → approve → messages) | Live at pts-web-pied.vercel.app |
| Phase 1 web quick wins (FAQ, PWA, admin, badges, crisis banner) | Built locally, uncommitted |
| Mobile clickable prototype (`apps/mobile`) | ~31 screens, mock auth, running on web preview |
| OTP / Bearer / phone auth | Planned, not built |
| Admin create-user | Planned, not built |
| Phase 0 manual E2E | Not completed |
| `MOBILE_APP_UX.md` formal approval | Open checklist |
| Unified plan (this doc) | **New** |

**Key existing docs (still valid, referenced here):**

- `docs/PROJECT_BRIEF.md` — vision  
- `docs/MOBILE_APP_UX.md` — screen inventory  
- `docs/MOBILE_UX_REVIEW.md` — UX critique (merge before final mobile build)  
- `CURSOR_BACKLOG_SPEC.md` — 98 web backlog items  
- `docs/PTS_ONE_PAGER.md` — quick reference  

---

## 3. Product architecture (target)

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  PTS Mobile (Expo)      │     │  Admin Web              │
│  · Client + Counselor   │     │  · Create users (phone) │
│  · OTP login            │     │  · Metrics / flags      │
│  · Today / Program /    │     │  · Curate music sets    │
│    Calendar / Messages  │     │  · Plan oversight       │
│  · Spotify in-app       │     └───────────┬─────────────┘
└───────────┬─────────────┘                 │
            │                               │
            └───────────────┬───────────────┘
                            ▼
              PTS API (Next.js) + PostgreSQL
              · Plans (6-week, holistic)
              · Daily reinforcements
              · Calendar + stickiness logs
              · Music prescriptions
              · LLM plan generator (enriched prompts)
```

**Web (`apps/web`) during transition:** Marketing + pilot fallback until mobile ships.

---

## 4. New feature specifications

### 4.1 Ayurveda-informed weekly plan inputs

**Intent:** Enrich weekly plans with Ayurveda *concepts* relevant to pain experience — especially **non-movement** practices (pranayama, stillness, dinacharya, mental grounding) — without claiming to diagnose dosha or prescribe Ayurvedic medicine.

**Client-facing (intake + profile):**

| Input | Purpose |
|-------|---------|
| Daily energy pattern | Morning/evening person, fatigue cycles |
| Sleep & digestion (self-report) | Context for pacing (not diagnosis) |
| Preference: movement vs stillness | Weight plan toward yoga-asana vs breath/stillness |
| Heat/cold sensitivity (optional) | Inform language of practices (“warming” vs “cooling” rest) |
| Cultural comfort with Ayurveda/yoga language | Toggle plain vs traditional terms |

**Plan generator (LLM + counselor):**

- Each week includes an **Ayurveda lens** block: 1–2 non-movement practices (e.g. alternate nostril breathing, seated grounding, oil-free self-massage guidance as *optional* copy — counselor approves)  
- Separate from **physio/movement** track — clearly labeled  
- Disclaimer on every Ayurveda block: *“Supportive wellness practices — not medical Ayurvedic treatment. Stop if pain increases.”*

**Counselor review:** Ramya (or assigned counselor) can edit/remove Ayurveda blocks before approve.

**Data model (new / extended):**

- `intake_responses.ayurveda_preferences` (JSON)  
- `plans.weeks[].ayurvedaBlock` (JSON: title, practices[], disclaimers)  

---

### 4.2 Music psychology in weekly plans

**Intent:** Use curated music as a **regulated intervention** — not random playlists. Grounded in music psychology / music therapy principles for pain and distress:

| Use case | Mechanism (plain language) |
|----------|---------------------------|
| Morning activation | Low-arousal → moderate arousal; predictable tempo |
| Pain flare | Attention diversion, slow tempo, familiar timbre |
| Evening wind-down | Parasympathetic-friendly; reduced harmonic tension |
| Reflection / journaling | Instrumental, non-lyrical to avoid cognitive load |

**Weekly plan structure:**

Each week/day can include a **Music moment** card:

- Purpose tag: `grounding` | `activation` | `flare` | `reflection`  
- Curated **Spotify playlist or track set** (see §4.6)  
- 1–2 sentences: *why this music, how to listen* (counselor or LLM draft, counselor approves)  
- Optional: listen duration (e.g. 10–15 min)

**Clinical guardrails:**

- No claims that music “heals” pain  
- User can skip; never mandatory  
- Crisis screen always overrides — music is not for emergencies  

**Data model:**

- `music_sets` — admin/counselor curated (Spotify URI, purpose, week/day scope)  
- `plans.weeks[].days[].musicPrescriptionId`  

---

### 4.3 Counselor daily read-out reinforcements

**Intent:** Counselor assigns short **learning reinforcements** (read-out prompts) the client practices and **records back** daily — like homework with accountability.

**Counselor flow:**

1. From client detail or plan review → **Add daily reinforcement**  
2. Fields: title, read-out text (what to internalize), optional audio URL (counselor recording), active date range  
3. Can be tied to a plan week/theme  

**Client flow (Today tab):**

1. **Reinforcement card** — shows today’s read-out  
2. Client taps **Record response** — voice memo (preferred) or text  
3. Submission stored with timestamp  
4. Streak / completion indicator (gentle, no gamification shame)  

**Counselor visibility:**

- Work queue: “Reinforcement not recorded today” for inactive clients  
- Thread or client detail: playback of voice memos + transcripts (Phase 2: auto-transcribe)  

**Data model:**

- `daily_reinforcements` — counselor_id, client_id, text, audio_url, start_date, end_date  
- `reinforcement_responses` — reinforcement_id, client_id, response_type (voice|text), media_url, text, submitted_at  

---

### 4.4 Daily calendar + stickiness + scheduling feedback

**Intent:** Client **co-creates their day** — when they’ll do practices, reinforcements, rest, appointments — then reflects on what actually happened. This feeds the next week’s plan.

**Client flow (new Today sub-flow or Calendar tab):**

| Step | Screen | Action |
|------|--------|--------|
| Morning | **Plan my day** | Add blocks: practice, reinforcement, rest, work break, music moment, custom |
| During day | Notifications (Phase 1b) | Optional reminders |
| Evening | **Stickiness check** | For each block: Done / Partial / Skipped |
| Evening | **Scheduling feedback** | Free text: *“What part of today’s schedule worked? What didn’t?”* |

**UX principles:**

- Blocks are **suggestions**, not rigid calendar sync (no Google Calendar required for MVP)  
- Default templates from approved weekly plan (“Week 2, Day 3”)  
- Low friction — 3 taps to confirm stickiness for pre-filled blocks  

**Counselor + LLM use:**

- Aggregated stickiness + feedback visible in client detail  
- Included in **weekly plan regeneration** prompt: *“Client reported evening practices slip when scheduled after 8pm…”*  

**Data model:**

- `daily_calendar_entries` — client_id, date, blocks[] (type, label, planned_time, status, completed_at)  
- `daily_schedule_feedback` — client_id, date, worked_text, didnt_work_text  

---

### 4.5 Weekly feedback loop (plans learn from dailies)

**Intent:** Close the loop — daily data informs **Week N+1** plan adjustments.

**Inputs aggregated for next week:**

| Source | Signal |
|--------|--------|
| Reinforcement responses | Engagement, tone (future: sentiment) |
| Calendar stickiness | Which block types succeed |
| Schedule feedback text | Qualitative barriers |
| Check-ins (pain, sleep) | Trends |
| Music completion | Which purpose tags help |
| Messages | Counselor manual notes |

**Process:**

1. End of week → client **weekly check-in** (existing spec) + auto-summary of stickiness  
2. LLM drafts **Week N+1** adjustments (movement, Ayurveda, music, reinforcements)  
3. Counselor reviews in plan review screen — edits, approves  
4. New daily reinforcements + calendar templates generated from approved plan  

**API:**

- `GET /api/clients/[id]/weekly-summary?week=N`  
- `POST /api/plans/[id]/regenerate-week` (counselor only)  

---

### 4.6 Spotify in-app playback

**Intent:** Play counselor-curated music **inside the app** during music moments.

**Technical approach:**

| Layer | Choice |
|-------|--------|
| Catalog | Spotify — curated playlists/tracks per `music_sets` |
| Auth | Spotify OAuth (user connects Spotify account) |
| Playback | Spotify Web Playback SDK (web preview) / Spotify Android SDK (production app) |
| Requirement | **Spotify Premium** for in-app streaming (Spotify platform rule) |
| Fallback | Open in Spotify app via deep link if no Premium / auth fails |

**Admin / counselor curation:**

- Admin or counselor UI: paste Spotify playlist URL → validate → tag purpose → assign to week/day  
- Pre-approved **pilot catalog** (~10–15 playlists) before open curation  

**Mobile UX:**

- **Music player bar** — mini player persistent on Today/Program when active  
- Play/pause, skip (if playlist), purpose label, “Why this music” expandable  
- Does not autoplay on app open (user gesture required)  

**Legal / product:**

- Spotify Developer Terms compliance  
- Attribution per Spotify brand guidelines  
- Clear “Connect Spotify” onboarding step  

**Data model:**

- `music_sets` — spotify_playlist_uri, purpose, title, description, curated_by  
- `user_spotify_tokens` — user_id, access_token, refresh_token, expires_at  
- `music_listen_logs` — user_id, set_id, listened_seconds, completed, date  

---

## 5. Updated mobile screen map (additions)

New or materially changed screens on top of `MOBILE_APP_UX.md`:

| ID | Screen | Tab | Notes |
|----|--------|-----|-------|
| C10a | Morning: Plan my day | Today | Calendar block builder |
| C10b | Evening: Stickiness check | Today | Done/Partial/Skipped per block |
| C10c | Scheduling feedback | Today | Free text |
| C10d | Reinforcement record | Today | Voice/text response |
| C12a | Music moment player | Today / Program | In-app Spotify |
| C14a | Connect Spotify | Profile | OAuth |
| C17a | Weekly summary (auto) | Program | Before check-in |
| P4a | Assign reinforcement | Counselor | From client/plan |
| P5a | Daily engagement view | Counselor | Stickiness + recordings |
| A-ADMIN | Music set curator | Admin web | Spotify URLs |

**Today tab (revised hierarchy):**

1. Greeting + week/day  
2. **Reinforcement card** (if assigned)  
3. **Music moment** (if assigned)  
4. Morning check-in  
5. Today’s practice (movement + Ayurveda stillness)  
6. **Plan my day** / evening stickiness (time-aware)  

---

## 6. Build phases (unified sequence)

### Phase 0 — Validate foundation (1–2 weeks) ⬜

**Goal:** Confirm existing web flows work before building new features.

| # | Task | Owner |
|---|------|-------|
| 0.1 | Manual E2E per `PHASE0_CHECKLIST.md` | Satheesh + Ramya |
| 0.2 | Document bugs in `PHASE0_RESULTS.md` | Satheesh |
| 0.3 | Fix critical bugs | Engineering |
| 0.4 | Go/no-go for Phase 1 | Satheesh + Ramya |
| 0.5 | Commit Phase 1 web quick wins | Engineering |

**Gate:** Happy path works; no critical bugs; Ramya confident.

---

### Phase A — Approve UX + visual direction (1 week) ⬜

| # | Task | Output |
|---|------|--------|
| A.1 | Sign off `MOBILE_APP_UX.md` §13 checklist | Ramya approval |
| A.2 | Merge `MOBILE_UX_REVIEW.md` recommendations into UX spec | Updated MOBILE_APP_UX |
| A.3 | **Theme comparison** — apply 4 themes to 6 key screens (§8) | Screenshots + pick |
| A.4 | Lock palette + typography tokens | `src/theme.ts` + web CSS vars |
| A.5 | Write `docs/MOBILE_AUTH.md` | API contract for OTP |

**Gate:** One approved theme; mobile UX signed off.

---

### Phase B — Auth + admin (2 weeks) ⬜

| # | Task |
|---|------|
| B.1 | Port MSG91 OTP from trainer app → PTS API |
| B.2 | `users.phone`, `otp_codes` migration |
| B.3 | Bearer token auth on existing APIs |
| B.4 | Admin: create user (phone + role) |
| B.5 | Wire mobile login/OTP to live API |
| B.6 | Remove mock auth from mobile |

---

### Phase C — Core mobile wired (3 weeks) ✅ **shipped (pilot APK 14, Jul 2026)**

| # | Task |
|---|------|
| C.1 | Intake → API (7 steps) ✅ |
| C.2 | Plan view (approved) + waiting state ✅ |
| C.3 | Counselor work queue + plan approve ✅ |
| C.4 | Messages (live API, unread badges) ✅ |
| C.5 | Profile + crisis + safety ✅ |
| C.6 | Android APK — local Gradle build (`apps/mobile/dist/pts-mobile-release.apk`) ✅ |

---

### Phase D — Holistic daily layer (3–4 weeks) ⬜ **NEW**

| # | Task |
|---|------|
| D.1 | Schema: reinforcements, responses, calendar, feedback, music_sets |
| D.2 | Intake: Ayurveda preference fields |
| D.3 | LLM prompt: Ayurveda block + music moment in plan JSON |
| D.4 | Counselor: assign daily reinforcement UI |
| D.5 | Client: reinforcement record (voice + text) |
| D.6 | Client: daily calendar builder |
| D.7 | Client: evening stickiness + scheduling feedback | ✅ |
| D.8 | Weekly summary API (aggregate dailies) | ✅ |
| D.9 | Plan regenerate week N+1 using summary | ✅ |
| D.9b | **Counselor full plan regenerate** — `POST /api/plans` `action: regenerate` from plan review; new draft from intake; client stays on approved plan until re-approve ✅ (API + web/mobile button) |
| D.9c | Counselor edit/remove holistic blocks (Ayurveda, yoga trial, playlist) before approve | ✅ |
| D.10 | Counselor: daily engagement dashboard | ✅ |

---

### Phase E — Spotify + music psychology (2–3 weeks) ⬜ **NEW**

| # | Task |
|---|------|
| E.1 | Spotify Developer app + OAuth |
| E.2 | Admin: music set curator | ✅ (admin `/admin/music`) |
| E.3 | Assign music to plan week/day | ✅ (via plan JSON + catalog purpose tags) |
| E.4 | In-app player (Web Playback SDK / Android SDK) | ⬜ deferred |
| E.5 | Listen logging → weekly summary | ⬜ deferred |
| E.6 | Fallback: open Spotify app | ✅ |
| E.7 | Pilot playlist catalog (10–15 sets, Ramya-approved) | 🟡 seeded placeholders — replace URIs |

---

### Phase F — Pilot launch (2–4 weeks) ⬜

| # | Task |
|---|------|
| F.1 | Track 0 decisions finalized (`TRACK0_DECISIONS.md`) |
| F.2 | Admin creates 10–20 clients + 2–3 counselors |
| F.3 | Play Store internal → closed testing |
| F.4 | Closed recruitment (`PILOT_RECRUITMENT.md`) |
| F.5 | Monitor metrics + weekly clinical review |
| F.6 | `PHASE1_RESULTS.md` |

---

### Phase G — Scale & polish (post-pilot) ⬜

- FCM push notifications  
- Voice memo transcription  
- Plan versioning  
- Offline practice cache  
- WebSocket messages  
- Remaining `CURSOR_BACKLOG_SPEC` items (Sentry, Resend, staging env)  

---

## 7. Data model additions (summary)

```sql
-- Ayurveda preferences (extend intake)
intake_responses.ayurveda_preferences JSONB

-- Plan structure (extend plans.content JSON)
plans.content.weeks[].ayurvedaBlock
plans.content.weeks[].days[].musicPrescriptionId
plans.content.weeks[].days[].reinforcementTemplate

-- Daily reinforcement
daily_reinforcements (id, counselor_id, client_id, title, body_text, counselor_audio_url, start_date, end_date, plan_week)
reinforcement_responses (id, reinforcement_id, client_id, response_type, text, audio_url, submitted_at)

-- Calendar & stickiness
daily_calendar_entries (id, client_id, date, blocks JSONB, updated_at)
daily_schedule_feedback (id, client_id, date, worked_text, didnt_work_text, submitted_at)

-- Music / Spotify
music_sets (id, title, spotify_uri, purpose, description, curated_by, active)
user_spotify_tokens (user_id, access_token, refresh_token, expires_at)
music_listen_logs (id, user_id, music_set_id, date, seconds, completed)

-- Weekly aggregation (materialized view or API-computed)
-- Uses above tables + existing check-ins, messages, plans
```

---

## 8. Color themes & comparison plan

### 8.1 Why theme comparison now

The current prototype uses **Warm Ember** (`#111` + `#fbbf24`) — energetic but may feel more “startup” than “recovery sanctuary.” Before wiring APIs, we should **compare themes on real built screens** so Satheesh and Ramya can judge feel, not swatches alone.

### 8.2 Recommended theme candidates

Five directions, each with a distinct personality for pain recovery:

#### Theme 1 — **Warm Ember** (current)

| Token | Value |
|-------|-------|
| Background | `#FAFAFA` |
| Surface | `#FFFFFF` |
| Text | `#111111` |
| Accent | `#FBBF24` |
| Accent dark | `#F97316` |
| Crisis bar | `#1A1A2E` |

**Feel:** Direct, modern, energetic. Good for engagement; may feel less “restful.”

---

#### Theme 2 — **Sanctuary** (Ayurveda-aligned) ⭐ Recommended for holistic direction

| Token | Value |
|-------|-------|
| Background | `#F5F0E8` (warm cream) |
| Surface | `#FFFCF7` |
| Text | `#2C2416` |
| Muted | `#6B5E4F` |
| Accent | `#5C7A6B` (sage) |
| Accent warm | `#C4725A` (terracotta) |
| Crisis bar | `#3D4F44` |

**Feel:** Earth, warmth, grounding. Supports Ayurveda/yoga language without feeling clinical. Strong for evening reflection and music moments.

---

#### Theme 3 — **Dawn Calm** (clinical trust)

| Token | Value |
|-------|-------|
| Background | `#EEF2F5` |
| Surface | `#FFFFFF` |
| Text | `#1E3A4F` |
| Muted | `#5A6B7A` |
| Accent | `#4A90A4` (soft teal) |
| Accent soft | `#7BA7BC` |
| Crisis bar | `#1E3A4F` |

**Feel:** Calm, trustworthy, counselor-credible. Less “wellness spa,” more “professional care.”

---

#### Theme 4 — **Twilight Listen** (music & evening)

| Token | Value |
|-------|-------|
| Background | `#1A1F2E` |
| Surface | `#252B3D` |
| Text | `#E8E4DC` |
| Muted | `#9BA3B5` |
| Accent | `#9B8BB4` (soft violet) |
| Accent warm | `#D4A574` |
| Crisis bar | `#0F1219` |

**Feel:** Rest, listening, night routines. Excellent for music player and evening stickiness — use as **dark mode** or evening auto-switch.

---

#### Theme 5 — **River Stone** (minimal neutral)

| Token | Value |
|-------|-------|
| Background | `#F7F5F2` |
| Surface | `#FFFFFF` |
| Text | `#4A4543` |
| Muted | `#7A7570` |
| Accent | `#8B9E8F` (moss) |
| Border | `#E5E0DA` |
| Crisis bar | `#4A4543` |

**Feel:** Quiet, non-alarming, low cognitive load. Safe default if bold accents distract from pain content.

---

### 8.3 Theme comparison methodology

**Screens to screenshot (each theme):**

1. Login (auth first impression)  
2. Client Today (daily hub — will include reinforcement + music)  
3. Client Program week view  
4. Intake safety step (high-stakes clinical tone)  
5. Counselor work queue  
6. Music moment player (mock)  

**Implementation:**

| Step | Action |
|------|--------|
| 1 | Add `ThemeProvider` + `themes.ts` with all 5 token sets |
| 2 | Dev menu: **Theme switcher** (instant apply) |
| 3 | Generate screenshot grid or side-by-side review doc |
| 4 | Review session: Satheesh + Ramya — score 1–5 on: calm, trust, energy, readability, “would use daily” |
| 5 | Pick **primary** + optional **dark/evening** variant (e.g. Sanctuary + Twilight Listen) |
| 6 | Lock tokens in `apps/mobile/src/theme.ts` + web CSS variables |

**Recommendation:** Start pilot with **Sanctuary** (light) + **Twilight Listen** (auto after 7pm or user toggle) — supports holistic features and music without losing crisis visibility.

---

## 9. LLM plan generator changes

Extend `lib/plan-generator.ts` prompt to output:

```json
{
  "weeks": [{
    "theme": "...",
    "movementPractices": [...],
    "ayurvedaBlock": {
      "title": "...",
      "practices": [{ "name": "...", "type": "breath|stillness|dinacharya", "duration": "5 min", "instructions": "..." }],
      "disclaimer": "Supportive wellness only — not medical treatment."
    },
    "days": [{
      "musicMoment": { "purpose": "grounding", "musicSetId": "...", "guidance": "..." },
      "reinforcementPrompt": "..."
    }]
  }]
}
```

**Counselor always approves** before client sees. Ramya reviews Ayurveda + music copy guidelines in `docs/CLINICAL_CONTENT_GUIDE.md` (to be written in Phase A).

---

## 10. Open decisions for review

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Ayurveda language level | Plain English default; Sanskrit terms optional with glossary |
| 2 | Voice memo max length | 2 minutes for reinforcement responses |
| 3 | Spotify Premium required? | Yes for in-app; deep link fallback for free tier |
| 4 | Calendar: own tab vs Today sub-flow | **Today sub-flow** for MVP; Calendar tab in Phase 1b if crowded |
| 5 | Who curates music? | Ramya seeds pilot catalog; counselors assign from catalog only (MVP) |
| 6 | Theme for pilot | Sanctuary (day) + Twilight (evening) after comparison session |
| 7 | Auto-transcribe voice memos? | Phase G (post-pilot) |

---

## 11. Approval checklist

- [ ] Overall build phases (0 → G) approved  
- [ ] Ayurveda scope (adjunct, non-medical) approved by Ramya  
- [ ] Music psychology scope approved by Ramya  
- [ ] Daily reinforcement + calendar + stickiness flow approved  
- [ ] Spotify Premium requirement acceptable for pilot  
- [ ] Theme comparison plan approved — schedule review session  
- [ ] Phase 0 go/no-go completed  
- [ ] Ready to execute Phase A  

---

## 12. Immediate next steps

1. **You + Ramya:** Review this document (§4 new features, §8 themes, §10 decisions)  
2. **Engineering:** Implement theme switcher in mobile dev menu (Phase A.3)  
3. **Engineering:** Complete Phase 0 web E2E  
4. **Clinical:** Draft 10–15 pilot Spotify playlists by purpose tag  
5. **Product:** Sign off theme after comparison → lock tokens → continue Phase B  

---

## 13. Document map (after this plan)

| Doc | Role |
|-----|------|
| **`BUILDOUT_PLAN.md`** (this) | Master sequence + new features |
| `MOBILE_APP_UX.md` | Screen-level UX (update with §5 additions) |
| `MOBILE_AUTH.md` | OTP API contract (Phase A) |
| `CLINICAL_CONTENT_GUIDE.md` | Ayurveda + music copy rules (Phase A) |
| `CURSOR_BACKLOG_SPEC.md` | Web backlog detail |
| `PTS_ONE_PAGER.md` | Executive summary (update after approval) |

---

*This plan subsumes the scattered “next steps” from PTS_ONE_PAGER, MOBILE_APP_UX §11, and session architecture decisions. Once approved, it becomes the single execution reference.*
