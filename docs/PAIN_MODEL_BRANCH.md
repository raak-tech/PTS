# Pain Script A/B Pilot — `PainModelLearned` branch

**Status:** Active development on branch `PainModelLearned` — **not merged to `master`**  
**Scope:** MacBook spec Phases A–D + §1A/§7/§7A M1/§7B holistic & music + cohort A/B APK support  
**Tracker:** [`docs/PAIN_SCRIPT_IMPLEMENTATION_CHECKLIST.md`](./PAIN_SCRIPT_IMPLEMENTATION_CHECKLIST.md) — work through items in order; do not drop.  
**Clinical prompts:** Ramya-approved `PTS_PainScript_Prompts_DRAFT.md` (MacBook)

---

## Cohort model

| Cohort | APK | Package | User flag |
|--------|-----|---------|-----------|
| **A — Control** | `pts-mobile-release.apk` | `com.pts.mobile` | `users.pilot_cohort = legacy` |
| **B — Pain Script** | `pts-mobile-pain-pilot.apk` | `com.pts.mobile.painscript` | `users.pilot_cohort = pain_script` |

Assign cohort B via:
- Admin user create: `pilotCohort: "pain_script"`
- APK B first login: `POST /api/me/cohort` (build flag `EXPO_PUBLIC_PILOT_COHORT=pain_script`)

---

## Feature flags (preview / pilot deploy)

```bash
PAIN_SCRIPT_ENABLED=true          # server — enables pain path
NEXT_PUBLIC_PILOT_COHORT=         # optional web build hint
EXPO_PUBLIC_PILOT_COHORT=pain_script   # APK B only
```

**Legacy users unaffected** when flag off or `pilot_cohort=legacy`.

---

## Pain Script client flow (cohort B)

1. Intake confirm → `POST /api/intake/generate-plan` → **Stage 1 formulation** (async)
2. Counselor → **Formulation review** (`/provider/formulations/[userId]`) → Approve
3. Counselor → **Generate Week 1** (gated on approved formulation)
4. Client sees `formulationSummary` on waiting-plan / plan intro (plain language)

Control cohort (A): unchanged intake → counselor Generate Week 1 (no formulation gate).

---

## Preview deploy (2026-07-13)

**Preview URL:** `https://pts-kkiijcgf6-sat-ananths-projects.vercel.app`  
**Flags:** `PAIN_SCRIPT_ENABLED=true` (Preview), `DATABASE_URL` shared with Production  
**SSO:** Disabled on preview for APK/device testing  
**APK B:** `apps/mobile/dist/pts-mobile-pain-pilot.apk` (versionCode 17, API = preview URL above)

---

## Build APK B

```bash
cd apps/mobile
# Point at pain-model preview API when ready:
# export EXPO_PUBLIC_API_URL=https://your-preview.vercel.app
./scripts/build-apk-pain-pilot.sh
# Output: dist/pts-mobile-pain-pilot.apk
```

---

## DB migration

```bash
cd apps/web && node scripts/migrate.mjs
# Applies 0026_pain_script_engine.sql + 0027_music_tracks.sql + 0028_flare_events.sql + 0029_formulation_rescore_json.sql
```

---

## Manual performance review (pilot)

Compare cohorts manually on:
- Intake completion, time to approved Week 1
- Week 1 engagement (check-ins, practices, read-outs)
- Qualitative: “felt understood”, “plan fits me”

No automated analytics in this branch — per product decision.

---

## Open decisions (§16 defaults applied)

1. **Formulation gate** — separate gate for pilot (no auto-approve)
2. **Client target labels** — friendly labels in mobile `painScriptTags.ts`
3. **Prompts** — Ramya-approved MacBook draft
4. **Rescore** — deferred (Phase G, not in A–D)
5. **Intake** — 1 opener + ≤3 follow-ups (partial; `onsetType` added)
6. **Profile** — minimal `clientProfile` seed from intake
7. **Flare copy** — deferred (Phase G)

---

## Key paths

| Area | Path |
|------|------|
| Tags / types | `apps/web/src/lib/pain-script/` |
| Stage 1 LLM | `formulation-generator.ts` |
| Stage 2 LLM | `plan-from-formulation.ts` |
| Orchestration | `on-intake-confirmed.ts` |
| Counselor UI | `apps/web/src/app/provider/formulations/` |
| APK B build | `apps/mobile/scripts/build-apk-pain-pilot.sh` |

MacBook source docs:  
`/Users/satheeshananthasubramanian/Documents/Raak Consulting/PTS/PTS_PainScript_Implementation_Spec.md`  
`/Users/satheeshananthasubramanian/Documents/Raak Consulting/PTS/PTS_PainScript_Prompts_DRAFT.md`
