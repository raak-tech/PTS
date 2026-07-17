# Intake exit, ready-pool, Your counselor — ship note (2026-07-16)

**Status:** Shipped to production (web/API); mobile **APK v33 built 2026-07-17** after explicit request.
**Prod:** https://pts-web-pied.vercel.app
**Branch:** `PainModelLearned` (uncommitted working tree at handoff)
**Durable KB:** [`../kb/MOBILE.md`](../kb/MOBILE.md), [`../kb/INTAKE.md`](../kb/INTAKE.md), [`../kb/COUNSELOR_WEB.md`](../kb/COUNSELOR_WEB.md), [`../PROVIDER_ASSIGNMENT.md`](../PROVIDER_ASSIGNMENT.md)
**Decisions:** [`../DECISIONS.md`](../DECISIONS.md) (2026-07-16 entries)

---

## Why this ship exists

Clients locked in incomplete intake had no honest way out; counselors saw OTP-only accounts on Caseload and could Generate Week 1 before intake finished; program notifications fired during intake; product direction clarified **no counselor marketplace** — human time is scarce, scale via program + RAG.

---

## 1. Incomplete intake — Account exit (mobile)

| Action | Behaviour |
|--------|-----------|
| **Sign out** | Clears session; local draft cleared; **server draft kept** for same phone |
| **Delete account** | Double confirm → `POST /api/support/delete` hard-wipes client + intake drafts/sessions |

- **UI:** quiet **Account** on every intake step + waiting-plan (`Screen` `showAccountExit` → `AccountExitMenu`).
- **Routing:** still no Today/Program tabs until `intakeComplete` (then waiting-plan until plan approved).
- **Post-intake edits:** Profile → About you — not full intake restart.

**Code:** `apps/mobile/src/components/AccountExitMenu.tsx`, `Screen.tsx`, `AuthContext.deleteAccount`, `apps/web/src/lib/delete-client-account.ts`

---

## 2. Hybrid ready-pool (counselor Caseload)

| Client state | On Caseload? |
|--------------|--------------|
| Incomplete intake | **Hidden** |
| Intake complete, unassigned | **Ready pool** (tag + Generate Week 1 claims) |
| Assigned | Assigned counselor only |

- **Generate Week 1:** UI + API require `intake_responses.completedAt` → else `intake_incomplete`.
- **Admin:** dossier → **Allocate counselor** (`GET|POST /api/admin/clients/[id]/assign`).

**Code:** `apps/web/src/lib/client-access.ts`, `provider/clients/page.tsx`, `api/provider/generate-plan/route.ts`, `ProviderClientsListClient.tsx`

---

## 3. Client notifications (mobile)

`syncClientNotifications({ intakeComplete, planApproved })`:

| Stage | Local reminders |
|-------|-----------------|
| `!intakeComplete` | Gentle intake nudges (~1d / 3d / 7d) only |
| Intake done, waiting on plan | None scheduled |
| Plan approved | Today / read-out / evening program reminders |

**Code:** `apps/mobile/src/lib/localNotifications.ts`, `AuthContext` (login, refresh, completeIntake)

---

## 4. Your counselor (assigned only — not a marketplace)

Clients see **only their assigned** counselor’s public profile:

- Name, title, credentials, bio, years, specialisations, languages
- **Book a session** (Calendly)
- **Join session** (optional ephemeral `sessionJoinUrl` — Whereby/Meet guest link)
- **Message** (in-app)
- **Never:** counselor personal email/phone

| Surface | Mobile |
|---------|--------|
| Profile tab | `YourCounselorCard` (compact) |
| Waiting-plan | card + placeholder before assign |
| Full detail | Profile → Your counselor (`profile/counselor`) |

Counselor edits at **`/provider/profile`**: years of experience, Calendly, next session join link (clear after session).

**API:** `GET /api/me/contacts` (client branch)
**Migration:** `0034_counselor_session_join_url.sql`

**Code:** `YourCounselorCard.tsx`, `api/me/contacts/route.ts`, `ProfileEditorClient.tsx`

---

## 5. Product decisions locked (2026-07-16)

1. **No counselor marketplace** — claim / admin allocate / clinical fit only.
2. **Human counselor time = scarce** — gates where it matters; RAG/program AI for scale.
3. **Live video external** — Calendly book + ephemeral join link; PTS does not host Meet/Zoom.
4. **APK builds on request only** — finish a coherent mobile batch first; web deploy OK when API must be live.

---

## Migrations applied (prod)

| File | Purpose |
|------|---------|
| `0033_note_resolution_response.sql` | Mandatory counselor response on addressed admin notes |
| `0034_counselor_session_join_url.sql` | `counselor_profiles.session_join_url` |

---

## Morning smoke (quick)

**Client (APK v33):**

1. Incomplete intake → Account → Sign out / Delete behave as above.
2. Complete intake → waiting-plan → counselor card when assigned.
3. Profile → Your counselor → Message / Book / Join when links set.

**Counselor web:**

1. Caseload — no OTP-only clients; ready-pool after intake submit.
2. Generate Week 1 blocked until intake complete.
3. `/provider/profile` — save years + session join link; client sees on contacts API.

**Admin:**

1. Client dossier → Allocate counselor → assign / return to ready pool.

---

## Not done / tomorrow

- [ ] Git commit + push working tree when ready.
- [x] APK v33 built 2026-07-17 (arm64 pain-pilot) — Account exit, Your counselor, notification gating, production YouTube resolver path.
- [ ] RAG / retrieval path (strategic — no code this session).
- [ ] Counselor marketplace explicitly **out of scope** — do not add browse UI.

---

## Key files (quick index)

| Area | Path |
|------|------|
| Account exit UI | `apps/mobile/src/components/AccountExitMenu.tsx` |
| Delete account wipe | `apps/web/src/lib/delete-client-account.ts` |
| Ready-pool visibility | `apps/web/src/lib/client-access.ts` |
| Admin assign | `apps/web/src/app/api/admin/clients/[id]/assign/route.ts` |
| Public counselor API | `apps/web/src/app/api/me/contacts/route.ts` |
| Your counselor UI | `apps/mobile/src/components/YourCounselorCard.tsx` |
| Counselor profile editor | `apps/web/src/app/provider/profile/` |
