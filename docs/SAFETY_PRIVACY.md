# Safety & Privacy (Draft)

This is a *therapy-adjacent* product exploration. We will default to conservative safety boundaries.

## Scope boundaries (draft)
- Not a replacement for medical advice.
- No emergency use: crisis content should route to local emergency resources.
- Avoid diagnosing or prescribing.

## Data minimization (default)
- Collect the minimum data required for the product to function.
- Prefer on-device / ephemeral processing where possible.
- Explicit user consent for any sensitive data collection.

## Sensitive content handling
- Clearly label what the system can/cant do.
- Provide escalation paths: call therapist, seek care, emergency.

## Security baseline (eventual)
- Encryption in transit (TLS) and at rest.
- Access controls + audit logs.
- Secrets management (no secrets in git).

## Open questions
- Do we store session transcripts at all?
- If we store, what retention period?
- Do we need consent flows for clinical notes vs wellness coaching?
