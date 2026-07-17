# Intake & LLM extraction knowledge

**Web:** `apps/web` — `OneBoxIntake`, `/intake/confirm`, `POST /api/intake/extract`
**Mobile:** `apps/mobile/app/(client)/intake/*`
**Shared server helpers:** `apps/web/src/lib/intake-quality.ts`, `intake-extractor.ts`

---

## Product invariants

1. Never show counselor-facing phrasing (“the client…”) to the end user — use `clientSummary` / `toClientSummary` / `toClientFacingText` on **summary and narrative fields** (`painDescription`, etc.). Fix “You is” agreement after swaps.
2. Never render raw `null`, `"null"`, `[]`, or `"{}"` in confirm UI — use format helpers (`formatIntakeFieldValue` / web `formatFieldValue`).
3. Do not show extract **confidence %** or clinical checkmarks on the **client** confirm screen — those are counselor QA signals.
4. Follow-ups: after round 1 confirm, **one** structured pack (`follow-up` stepper) with per-question answers + curated fills for thin slots (max ~5). Do not dump users back into a blank onebox for gap-fill.
5. Key details on confirm are **editable**. `biggestChange` = life impact since this started; `recoveryGoal` = what they want next (label: “What's changed most for you”).
6. Do not call the expensive extract LLM on obvious garbage — `assessIntakeTextQuality` → HTTP 422 before OpenRouter (max 4000 chars; mash / low-diversity / low-vowel checks).
7. If the model returns nothing usable (`extractionUsable === false`), require rewrite; do not “Start program” on empty intake.
8. After follow-up rounds, allow start only when core story fields exist (`painDescription`, `biggestChange`, `recoveryGoal`). Round ≥ 3 is **not** a blind force-through on empty intake.
9. **Draft resume:** incomplete one-box intake persists locally (AsyncStorage) and on server (`GET/PUT/DELETE /api/intake/draft`). On reopen, offer Continue / Start over. Clear draft on **Start my program** and **Start over**; sign-out clears local only (server draft kept for same account).
10. **Account exit (incomplete intake):** every intake step and waiting-plan shows a quiet **Account** control — **Sign out** (pause; resume draft after OTP) and **Delete account** (hard wipe via `POST /api/support/delete`, double confirm). Do **not** unlock Today/Program tabs before intake is complete. Post-intake edits live under **Profile → About you**, not a full intake restart.
11. **Notifications:** while `!intakeComplete`, schedule gentle intake-completion nudges only (`syncClientNotifications`). Do **not** schedule Today/read-out/evening program reminders until intake is complete **and** the plan is approved.
12. **Extract rate limit + cache:** max ~20 `/api/intake/extract` LLM calls per user per hour (`429 rate_limited`); identical free-text retries may return a cached extraction (`cached: true`) without a new OpenRouter call.

---

## API contract notes

`POST /api/intake/extract` success body includes (among others):

- `summary` — may be counselor-ish; keep for counselor/tools if needed
- `clientSummary` — safe for mobile/web confirm UI
- `extractionUsable` — boolean gate for client confirmation
- `cached` — optional; true when served from identical-text cache

Errors: `422 text_quality`, `429 rate_limited`, `401 unauthorized`, `500 extraction_failed`.

`GET|PUT|DELETE /api/intake/draft` — mid-flow one-box resume payload (`intake_flow_drafts`). One row per user.

`POST /api/support/delete` — hard-delete signed-in **client** account + related rows (intake drafts, sessions, program data). Clears session cookie. Used by mobile Delete account.

Health: `GET /api/health/llm` — OpenRouter key present/usable on the deployment.
Health: `GET /api/health/youtube` — YouTube Data API key present + sample search (filters Hz/healing titles).

**Ship / smoke:** [`../plans/2026-07-16-intake-counselor-client-bridge-ship.md`](../plans/2026-07-16-intake-counselor-client-bridge-ship.md)
**Pickup queue:** [`../plans/2026-07-17-action-queue-corrected.md`](../plans/2026-07-17-action-queue-corrected.md)

---

## Deferred (do not invent ad hoc)

Tier 1 on-topic classifier, segment-specific required fields, paywall after Week 1 — tracked in `PILOT_TODO.md`. Prefer implementing from that list rather than one-off gates.
