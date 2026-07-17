---
name: kb-review
description: >-
  Review and prune the PTS docs/kb knowledge base for contradictions, stale
  entries, and missing CAPTURE_LOG links. Use when the user asks for a KB
  review, weekly review, knowledge base audit, or before a major release.
---

# KB review

## Steps

1. Open `docs/kb/REVIEW_CHECKLIST.md` and work through Pass 1–3.
2. Run `cd apps/mobile && npm run check:routes` for mobile integrity.
3. Spot-check that cited paths/env notes still match the repo (`rg` / read files).
4. Scan `docs/kb` for accidental secrets.
5. Update entry `Reviewed:` dates; prune or mark `Superseded:`.
6. Append a review summary line to `docs/kb/CAPTURE_LOG.md`.
7. Add a row to the REVIEW_CHECKLIST sign-off table with date + brief notes.
8. Report to the user: what was stale, what changed, any open incidents left.
