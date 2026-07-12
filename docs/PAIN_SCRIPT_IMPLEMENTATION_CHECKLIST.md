# Pain Script — Implementation checklist (MacBook spec Jul 12)

**Branch:** `PainModelLearned` only — do not merge to `master` without approval.  
**Source:** `PTS_PainScript_Implementation_Spec.md` + `PTS_PainScript_Prompts_DRAFT.md` (MacBook, saved 17:14 Jul 12).  
**How to use:** Work top-to-bottom. Mark `[x]` when done. Do not skip items — each ID maps to spec §.

**Last updated:** 2026-07-12 — Phase A–D holistic/music (§1A, §7, §7A M1, §7B pilot) implemented.

---

## Status legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done |
| `[—]` | Deferred (post-pilot) |

---

## Phase A — Foundation (§1A, types, prompts)

| ID | Spec | Task | Status |
|----|------|------|--------|
| A1 | §1A | `modalities.ts` — `ModalityCode`, evidence tiers, tag maps, `allowedModalities(onsetType)` | [x] |
| A2 | §1A | `holistic-plan-types.ts` — shared week/holistic types (§7B schema + §7A music intent) | [x] |
| A3 | `[PROMPTS §2]` | Sync `prompts.ts` — integrative toolkit, boundaries, acute/chronic rules | [x] |
| A4 | §7 | `dailyPractice.modality` + `targets[]` + `mechanism` on types | [x] |
| A5 | §7 | `week.targets`, `personalizationBasis` on types | [x] |

---

## Phase B — Holistic engine pilot (§7B)

| ID | Spec | Task | Status |
|----|------|------|--------|
| B1 | §7B.1 | Replace `yogaTrial` → `yogicPractice` (no `microMovement`) in prompts + types | [x] |
| B2 | §7B.1 | Reframe `ayurvedaBlock` → diet + rhythm schema | [x] |
| B3 | §7B.2 | `holistic-guardrails.ts` — breathing whitelist, trauma note, food screen | [x] |
| B4 | §7B.2 | Tag-link holistic blocks (`targets[]`, `mechanism`) in Stage 2 prompt | [x] |
| B5 | §7B.1 | `normalizeHolisticWeek()` — legacy `yogaTrial`/`practices[]` → new shape | [x] |
| B6 | §7B.4 | Full `holistic_items` curated library | [—] |

---

## Phase C — Music engine M1 (§7A)

| ID | Spec | Task | Status |
|----|------|------|--------|
| C1 | §7A.1 | LLM outputs intent-only (`purpose`, `mood`, `searchTerms`, `language`) | [x] |
| C2 | §7A.3 | Migration `0027_music_tracks.sql` + Drizzle schema | [x] |
| C3 | §7A.1 | `music-resolver.ts` — YouTube API → real track IDs; fallback `music_sets` | [x] |
| C4 | §7A.1 | Client sees resolved tracks only (no invented titles) | [x] |
| C5 | §7A.2 | Owned-IP library (Suno / Stable Audio Open) | [—] |

**Env for YouTube M1:** `YOUTUBE_API_KEY` (optional — falls back to `music_sets` Spotify URIs).

---

## Phase D — Stage 2 integration (§7)

| ID | Spec | Task | Status |
|----|------|------|--------|
| D1 | §7 | `plan-post-process.ts` — normalize + validate after LLM | [x] |
| D2 | §7 | Hook post-process in `plan-from-formulation.ts` + `regenerate-plan-for-user.ts` | [x] |
| D3 | §7 | Hook post-process in `plan-generator.ts` (legacy cohort) | [x] |
| D4 | §7 | `week-plan-generator.ts` — formulation-aware + new holistic/music schema | [x] |
| D5 | §15 | `validate-plan-tags.ts` — `week.targets ⊆ primaryTargets`, jargon lint | [x] |

---

## Phase E — UI & mobile

| ID | Spec | Task | Status |
|----|------|------|--------|
| E1 | §9.3 | `WeekEditor.tsx` — yogicPractice, new ayurveda, music intent/resolved | [x] |
| E2 | §10.3 | `HolisticCards.tsx` + `api.ts` types — new schema + legacy read | [x] |
| E3 | — | `seed-daily-from-plan.ts` — yogicPractice + new ayurveda labels | [x] |
| E4 | §9.3 | Counselor holistic target chips in plan review | [x] |
| E5 | §10.3 | Client API strips `targets`/`mechanism`/`modality`; keeps `personalizationBasis` | [x] |
| E6 | §10.3 | Mobile week detail shows `personalizationBasis` | [x] |

---

## Deferred (post-pilot)

| ID | Spec | Task | Status |
|----|------|------|--------|
| F1 | §8 | Stage 3 rescore + non-LLM gate | [~] gate + rescore LLM + draft formulation on material change |
| F2 | §12 | Flare classifier + intervention library | [~] classifier, copy lib, POST /api/flares, mobile flare-up |
| F3 | §6B | Full progressive profile UI | [ ] |
| F4 | §7A M2 | Owned-IP music library | [—] |
| F5 | §1A | `MOD_EAET`, `MOD_PEER` | [—] |
| F6 | §7B.4 | `holistic_items` curated library | [—] |

---

## Open decisions (§16 — Ramya / Satheesh)

- [ ] 8. Music M1 YouTube first; M2 generator choice
- [ ] 9. Ayurveda dietary sign-off authority
- [ ] 10. SD_BEHAVIOUR boundary confirmed
- [ ] 11. Pilot modality set + authors
- [ ] 12. EAET staging criteria

---

## Session log

| Date | Items completed | Notes |
|------|-----------------|-------|
| 2026-07-12 AM | Phases A–D (original) | Formulation gate, cohort A/B |
| 2026-07-12 PM | F1–F2 (partial) | Rescore gate, flare API, mobile flare-up flow |

---

## Key files added/updated

| Area | Path |
|------|------|
| Tracker | `docs/PAIN_SCRIPT_IMPLEMENTATION_CHECKLIST.md` |
| Modalities | `apps/web/src/lib/pain-script/modalities.ts` |
| Holistic types | `apps/web/src/lib/holistic-plan-types.ts` |
| Guardrails | `apps/web/src/lib/pain-script/holistic-guardrails.ts` |
| Music resolver | `apps/web/src/lib/pain-script/music-resolver.ts` |
| Post-process | `apps/web/src/lib/pain-script/plan-post-process.ts` |
| Migration | `apps/web/src/db/migrations/0027_music_tracks.sql` |
| Mobile display | `apps/mobile/src/lib/holisticDisplay.ts` |
