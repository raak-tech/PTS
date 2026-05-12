# Operational Learnings

## Hermes execution pattern
- Keep a live todo list, continue execution until a concrete checkpoint, and send periodic updates while work is in flight.
- Prefer visible state changes over narration. If the work moved, say what moved, what was verified, and what remains.
- Do not ask for repeated confirmation when the next step is clear and low-risk. Keep going until the next checkpoint or a genuine ambiguity.
- If the current model path stalls, switch to alternate agents or providers available through ai.unitehub.tech instead of waiting on one model.
