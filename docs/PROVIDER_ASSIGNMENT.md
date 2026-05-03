# Provider assignment

## Goal

Link a client to a provider using a simple invite-code flow.

## Current pilot model

- Providers generate an invite code.
- Clients enter that code on a join page.
- A successful match links the client to the provider in the local demo state.
- The provider console shows the linked clients and the audit trail.

## Defaults

- Auto-assignment is off by default.
- Invite-code linking is the only enabled path in this slice.
- The demo keeps data in browser storage only. No server persistence.

## Edge cases

- Wrong code: reject with a clear message.
- Empty code or name: reject.
- Rotating the invite code starts a fresh assignment cohort.
- Unlinking removes the client from the current cohort and records the action.

## Future extension

If we later enable parameter-based auto-assignment, it should stay behind a config flag and use explicit rules. No silent assignment.