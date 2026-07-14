# Incidents & postmortems

Append new incidents at the **top** (newest first). Status: `open` | `mitigated` | `closed`.

---

## Template

```markdown
### YYYY-MM-DD — Short title
- **Status:** closed
- **Surfaces:** mobile Android / iOS / web
- **Symptoms:**
- **Root cause:**
- **Fix:** (commit / PR)
- **Prevention:**
- **Reviewed:**
```

---

### 2026-07-14 — Mobile launch crash: duplicate Expo Router screen `intake`
- **Status:** closed
- **Surfaces:** mobile Android (Pixel), iOS (same JS bundle / Expo Router)
- **Symptoms:** App opens then immediately force-closes. Logcat: `A navigator cannot contain multiple 'Screen' components with the same name (found duplicate screen named 'intake')` in `ClientLayout`.
- **Root cause:** Both `app/(client)/intake.tsx` **and** `app/(client)/intake/` (with `_layout.tsx`) registered as screen name `intake`. Adding a nested layout without removing the sibling file caused the crash. Earlier “delete `_layout` only” was a temporary mitigation that left the latent conflict.
- **Fix:** Removed sibling `intake.tsx`; nested flow under `intake/` with `_layout.tsx`, `index.tsx` → redirect to `segment`, legacy at `intake/legacy.tsx`. Commits `c9a48fd`, `f5e2435` on `PainModelLearned`.
- **Prevention:**
  - Never create `path.tsx` beside `path/` in Expo Router.
  - Run `npm run check:routes` in `apps/mobile` (wired into pain-pilot APK script).
  - See [`MOBILE.md`](MOBILE.md) § Expo Router.
- **Reviewed:** 2026-07-14

---

### 2026-07-13 — Intake confirm showed `null` / `[]` and counselor-facing copy
- **Status:** closed
- **Surfaces:** mobile confirm + web confirm; API extract
- **Symptoms:** Raw JSON nulls; “The client’s message…” shown to end users; garbled text still paid for LLM; misleading “Almost there”.
- **Root cause:** Mobile `JSON.stringify(null)`; no field formatter; counselor summary reused for clients; round≥3 allow-submit with empty extraction; no pre-LLM text quality gate.
- **Fix:** `intake-quality.ts`, `clientSummary` / `extractionUsable`, mobile `intake-display.ts`, sticky keyboard footers. Production + preview deployed; APK builds 19–22.
- **Prevention:** See [`INTAKE.md`](INTAKE.md). Never display raw extraction values; always client-facing summary helpers.
- **Reviewed:** 2026-07-14
