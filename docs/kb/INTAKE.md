# Intake & LLM extraction knowledge

**Web:** `apps/web` — `OneBoxIntake`, `/intake/confirm`, `POST /api/intake/extract`  
**Mobile:** `apps/mobile/app/(client)/intake/*`  
**Shared server helpers:** `apps/web/src/lib/intake-quality.ts`, `intake-extractor.ts`

---

## Product invariants

1. Never show counselor-facing phrasing (“the client…”) to the end user — use `clientSummary` / `toClientSummary` / `toClientFacingText` on **summary and narrative fields** (`painDescription`, etc.). Fix “You is” agreement after swaps.
2. Never render raw `null`, `"null"`, `[]`, or `"{}"` in confirm UI — use format helpers (`formatIntakeFieldValue` / web `formatFieldValue`).
3. Do not show extract **confidence %** or clinical checkmarks on the **client** confirm screen — those are counselor QA signals.
4. Do not call the expensive extract LLM on obvious garbage — `assessIntakeTextQuality` → HTTP 422 before OpenRouter.
5. If the model returns nothing usable (`extractionUsable === false`), require rewrite; do not “Start program” on empty intake.
6. Round ≥ 3 escape hatch must not bypass **usable** extraction (counselor surrender ≠ blank confirm).

---

## API contract notes

`POST /api/intake/extract` success body includes (among others):

- `summary` — may be counselor-ish; keep for counselor/tools if needed
- `clientSummary` — safe for mobile/web confirm UI
- `extractionUsable` — boolean gate for client confirmation

Health: `GET /api/health/llm` — OpenRouter key present/usable on the deployment.

---

## Deferred (do not invent ad hoc)

Rate limits, text-hash cache, paywall after Week 1, segment-specific required fields — tracked in `PILOT_TODO.md` § Deferred — Intake quality. Prefer implementing from that list rather than one-off gates.
