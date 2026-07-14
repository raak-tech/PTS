---
name: capture-learning
description: >-
  Capture a durable PTS learning into docs/kb and CAPTURE_LOG after bugs,
  crashes, deploy pitfalls, or user-reported UX failures. Use when the user
  says capture learning, remember this, postmortem, or after fixing a Sev-1
  incident. Also use when a fix required correcting a wrong root cause.
---

# Capture learning

## Steps

1. Classify: `INCIDENTS` (crash/outage) | `MOBILE` | `INTAKE` | `OPS` | other → update matching file under `docs/kb/`.
2. Use the file’s template. Include: date, symptoms, root cause, fix (commit if known), prevention.
3. Append one row to `docs/kb/CAPTURE_LOG.md` (newest first).
4. If the lesson is a hard forever-rule for agents, update or add a concise `.cursor/rules/*.mdc` entry (keep under ~50 lines).
5. Do **not** put secrets in the KB.
6. Tell the user which files changed in one short sentence.

## Incident status

Use `open` / `mitigated` / `closed`. Prefer closing only when prevention is in place (test, script, or rule).
