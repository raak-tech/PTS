# Knowledge base review checklist

Run this **weekly during pilot**, and after any Sev-1 mobile/web outage.  
Agent assist: skill **kb-review**.

## Pass 1 — Integrity (15 min)

- [ ] `CAPTURE_LOG.md` entries since last review match new INCIDENTS / MOBILE / INTAKE / COUNSELOR_WEB / OPS changes
- [ ] Every `open` incident has an owner or next action
- [ ] No secrets accidentally pasted into KB files (`rg -i 'sk-|api[_-]?key|password=' docs/kb`)
- [ ] Links to commits/paths still resolve on current branch

## Pass 2 — Contradictions (15 min)

- [ ] MOBILE Expo Router rules still match `apps/mobile/app` layout (`npm run check:routes` green)
- [ ] INTAKE API fields (`clientSummary`, `extractionUsable`) still present in extract route
- [ ] COUNSELOR_WEB matches live routes: Caseload home, `/provider/plans` redirect, POST logout, Chart rail
- [ ] OPS production URL and env guidance match `apps/mobile/eas.json` / `BEFORE_PRODUCTION.md`
- [ ] `PILOT_TODO.md` deferred items not silently duplicated or contradicted in KB
## Pass 3 — Prune (10 min)

- [ ] Mark outdated items with `Superseded: YYYY-MM-DD → <link>` or delete obsolete bullets
- [ ] Add `Reviewed: YYYY-MM-DD` to touched entries
- [ ] Append a summary line to `CAPTURE_LOG.md`: `YYYY-MM-DD review: …`

## Sign-off

| Date | Reviewer | Notes |
|------|----------|-------|
| 2026-07-14 | setup | KB created; seed incidents from Jul 13–14 |
|  |  |  |
