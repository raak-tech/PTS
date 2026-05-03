# Cursor SDK agent flow for PTS

PTS now has a repo-local Cursor SDK runner under `apps/cursor-runner/`.

## What it does
- Loads `CURSOR_API_KEY` from `.env.local` at the repo root, if present
- Calls `Cursor.me()` to verify auth
- Calls `Cursor.models.list()` to discover available models
- Uses `model: { id: "default" }` when available for router-style local behavior
- Supports a durable dev-agent run against this repository

## Commands

```bash
cd apps/cursor-runner
npm install
npm run dev
npm run list-models
npm run prompt -- "Reply with exactly: OK"
npm run dev-agent -- "Inspect the repo and summarize the current auth pilot state"
```

## Notes
- `CURSOR_CWD` overrides the repo target directory.
- `CURSOR_MODEL` overrides model selection.
- `CURSOR_TASK` can be used instead of CLI args for `dev-agent`.
- `CURSOR_SANDBOX=1` opts into local sandboxing, but sandboxing may not be supported in every environment.
- Runner logs are written to `apps/cursor-runner/data/` and are ignored by git.

## Verification status in this environment
- The runner is wired into the repo.
- `command -v cursor` is still empty on this host, so there is no standalone Cursor CLI binary.
- `CURSOR_API_KEY` is not currently set in the local environment, so the live SDK smoke run is still blocked until credentials are provided.
