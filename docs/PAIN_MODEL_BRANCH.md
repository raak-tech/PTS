# Pain Script model — parked branch (`PainModelLearned`)

**Status:** Parked — **not integrated into `master`**  
**Branch:** `PainModelLearned`  
**Commit:** `137fd03` (WIP, awaiting product approval)  
**Created:** 2026-07-11  
**Confidential:** RAak proprietary Pain Script System — not for client distribution or model training

---

## What this is

Exploratory integration of the **RAak Pain Script System** (Transactional Analysis formulation for chronic pain) into PTS:

1. Optional **pain-script / BASIC I.D. signals** extracted from one-box intake free text
2. **Confidential framework block** injected into Week 1 and Weeks 2–6 LLM plan prompts
3. Counselor-only **`protectedFormulation`** in generated plans (maintenance hypothesis, BASIC I.D. snapshot, Week 1 leverage)
4. **Protected formulation panel** in counselor plan review UI
5. **Client API stripping** so counselor-only fields never reach clients

Local confidential reference files (from MacBook) live in `confidential-review/` — **never commit**.

---

## How to resume this work

```bash
cd /home/satananth/work/PTS
git fetch origin                    # if branch was pushed
git checkout PainModelLearned       # switch to parked work
git log -1 --oneline                # should show 137fd03 or later on this branch
```

To compare against current production code:

```bash
git checkout master
git diff master..PainModelLearned --stat
git diff master..PainModelLearned -- apps/web/src/lib/plan-generator.ts
```

To integrate later (only after approval):

```bash
git checkout master
git merge PainModelLearned          # or cherry-pick specific commits
# run tsc + next build, counselor QA on protectedFormulation, then deploy
```

To abandon:

```bash
git branch -D PainModelLearned      # local only
```

---

## Files changed on `PainModelLearned` (12 files)

| Area | Path |
|------|------|
| Confidential framework | `apps/web/src/lib/confidential/pain-script-framework.ts` |
| Load intake signals | `apps/web/src/lib/confidential/load-pain-script-signals.ts` |
| Week 1 LLM | `apps/web/src/lib/plan-generator.ts` |
| Weeks 2–6 LLM | `apps/web/src/lib/week-plan-generator.ts` |
| Intake extraction | `apps/web/src/lib/intake-extractor.ts` |
| Plan regen / save | `apps/web/src/lib/regenerate-plan-for-user.ts`, `generate-and-save-plan.ts` |
| Week regen API | `apps/web/src/app/api/provider/clients/[id]/regenerate-week/route.ts` |
| Counselor UI | `apps/web/src/app/provider/plans/PlanReviewClient.tsx` |
| Client API strip | `apps/web/src/lib/plan-client-view.ts`, `apps/web/src/app/api/plans/route.ts` |
| Git safety | `.gitignore` (`confidential-review/`) |

---

## Gap analysis: onboarding vs Pain Script model

**Current onboarding** (one-box + extractor) is **situation/goal-oriented**: pain source, description, duration, activities, goal, demographics, treatment, social support, safety.

**Pain Script model** is **formulation-oriented** — three maintenance-cycle components:

| Component | Examples | Current intake |
|-----------|----------|----------------|
| Script beliefs/feelings | Self/others/life beliefs; needs; anger, fear, grief | Not structured |
| Script displays | Guarding, pacing, avoidance; fantasies; sensations | Partial (description, activities) |
| Reinforcing experiences | Flares, invalidation, memory loops | Not captured |
| BASIC I.D. lens | B/A/S/I/C/I/D domains | ~2/7 domains |

**Material impact:** High for counselor formulation and Week 1 practice targeting; low–medium for client-facing intake UX (signals can be inferred from free text without a TA questionnaire).

**Parked branch approach:** Optional `painScriptSignals` in extraction JSON (stored in `intake_sessions`, not required for intake completion) + LLM formulation in counselor-only plan fields.

---

## Expected plan output changes (when integrated)

| Field | Before | After (with model) |
|-------|--------|---------------------|
| `clientSummary` / `watchPoints` | Goal + situation focused | Maintenance-cycle + invalidation/catastrophizing aware |
| `protectedFormulation` | N/A | Counselor-only hypothesis + BASIC I.D. + Week 1 leverage |
| `dailyPractices` | Generic pacing/breath | 1–2 targeted leverage points in the cycle |
| Client `overview` | Unchanged tone | Still warm, non-clinical — no framework labels |

---

## Integration checklist (when approved)

- [ ] Product sign-off on counselor-only `protectedFormulation` UX
- [ ] Regenerate test plan — compare old vs new counselor fields
- [ ] Verify client API never exposes protected fields (mobile + web)
- [ ] Optional: add 1–2 conversational intake follow-ups when signals empty
- [ ] Optional: mirror protected formulation in provider client workspace
- [ ] Merge `PainModelLearned` → `master`, deploy Vercel, smoke-test counselor queue
- [ ] Push branch to `origin` if not already: `git push -u origin PainModelLearned`

---

## Rule for ongoing dev

**All new work stays on `master`** until explicit approval to merge `PainModelLearned`.  
This branch is reference-only — do not deploy from it to production without review.
