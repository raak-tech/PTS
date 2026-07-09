# Onboarding Revamp — Option A + B Layered

**Status:** Spec (pending build)  
**Rollback:** `git checkout pre-onboarding-revamp`  
**Branch:** `feat/onboarding-onebox-segments`

---

## Flow (with data-quality gates)

```
Landing → Segment cards → One-box → AI extraction → [Gate: enough?]
  (5s)        (3s)          (30-90s)    (2-4s)
                                                     ↓ NO
                                              Follow-up prompts (1-2 Qs)
                                              → User answers → Re-extract
                                                     ↓ YES
                                              Confirmation card
                                              → Counselor sees data bar
                                              → Plan generation
```

The loop exists because **plan generation is blocked** until the counselor has enough to validate Week 1. The system actively pulls for more data rather than proceeding with low confidence.

---

## What "enough data" means — the hard gate

Before the "Start my program" button enables, these fields **must** have confidence ≥ 0.85:

| Required field | Why the counselor needs it |
|---------------|---------------------------|
| `painSource` (or segment equivalent) | Root cause context — can't draft Week 1 without knowing what happened |
| `painDescription` | Clinical picture — severity, pattern, timeline |
| `activitiesAffected` | What the client has lost — shapes daily practice relevance |
| `biggestChange` | Emotional anchor — what matters most to this person |
| `recoveryGoal` | Direction — what the program is working toward |
| `hasRedFlags` + `isSafe` | Safety — **non-negotiable**. If red flags are unclear, plan is held for counselor manual review |

**Soft requirements** (shown as "Add more context" but don't block plan):
`ageRange`, `occupation`, `priorTherapy`, `socialSupport`, `structurePreference`, `ayurvedaPreferences`, `engagementTime`

The gate is not binary pass/fail — it's **"how many rounds of follow-up before we hand to the counselor?"** Max 2 extraction rounds. After that, any missing required fields are highlighted for the counselor with a note: *"Client provided limited detail on [field]. Review manually before approving Week 1."*

### The counselor data bar

Before plan generation triggers, the counselor sees a compact summary of what's available and what confidence level:

```
┌─────────────────────────────────────────────┐
│ Client intake summary                        │
│                                              │
│ ✅ Pain source: workplace injury (0.96)      │
│ ✅ Situation: Lower back, 8 months (0.91)    │
│ ✅ Goal: Work full day + play with kids(0.88)│
│ ⚠️  Activities affected: 2 mentioned (0.72)  │
│ ❌ Age range: not provided                   │
│ ❌ Prior therapy: not provided               │
│ ⚠️  Red flags: none detected (0.78)          │
│                                              │
│ Data confidence: 71% — OK to generate        │
│ 2 fields flagged for manual review           │
└─────────────────────────────────────────────┘
```

This gives the counselor **agency**: they see exactly what's solid vs. what's inferred, and can decide whether to generate or ask the client for more detail.

---

## Step-by-step UX

### Step 1: Segment selector

Screen: *"I'm here for help with..."*

Tappable cards (3-column on desktop, 1-column on mobile):

| Card | `segmentType` | Hint text |
|------|--------------|-----------|
| 🩹 **Pain** | `pain` | *What hurts, how long, what's changed?* |
| 😴 **Sleep** | `sleep` | *Trouble falling asleep, staying asleep, or waking up tired?* |
| 😰 **Anxiety / Stress** | `anxiety` | *Racing thoughts, worry, tension, what's weighing on you?* |
| 🏃 **Recovery after injury** | `injury_recovery` | *What happened, what you're working to get back to?* |
| 🔄 **Something else** | `other` | *Tell us in your own words — no wrong answer* |

- Cards are warm, no clinical jargon. Clicks feel like choosing a path, not filling a form
- Selected card highlights with a subtle border + checkmark
- "Continue" only after selection
- Skip link at bottom: *"Skip — just let me type"* → `segmentType: null`, generic hint

### Step 2: One-box free text

Single large textarea (mobile-optimized, min 4 lines visible). This is the core input — the design should feel like writing an email, not filling a field.

```
┌─────────────────────────────────────┐
│                                     │
│  [Segment hint from cards above]    │
│                                     │
│  _________________________________  │
│ |                                 | │
│ |  Write freely — don't worry     | │
│ |  about structure. Just tell us  | │
│ |  what's going on.               | │
│ |                                 | │
│ |_________________________________| │
│                                     │
│  🎤 Voice   ✨ Continue (30+ chars) │
└─────────────────────────────────────┘
```

**Encouragement mechanisms to get enough data:**

1. **Pre-fill prompt** — the textarea has a ghosted example that fades when user types:
   > *"For example: I've had lower back pain for about 8 months. It started gradually and now I can't sit through a full meeting. I used to play with my kids every evening but now I can't. I just want to get back to being able to work a full day without standing every 20 minutes..."*

2. **Length nudge** — counter starts visible at 0 chars. At 100 chars it says "Good start". At 250 it says "This helps — keep going if you can". At 400, the counter turns subtle grey. This is positive reinforcement, not a limit.

3. **Voice fallback** — microphone button triggers device-native dictation. Some people talk more freely than they type. Transcript fills the same textarea.

4. **Minimum gate** — "Continue" is greyed until ≥ 30 characters. But the design doesn't say "minimum 30 chars" — it just stays grey with a barely-visible counter until the user has typed enough.

### Step 3: AI extraction + the follow-up loop

`POST /api/intake/extract`

**Input:**
```json
{
  "segmentType": "pain",
  "freeText": "I've had lower back pain for about 8 months...",
  "round": 1
}
```

Response includes `requiredFieldsMet: boolean` and `followUpQuestions: string[]`.

If `requiredFieldsMet: false` and `round < 3`:

The screen transitions to a **follow-up card** instead of skipping straight to confirmation:

```
┌─────────────────────────────────────┐
│  Thanks — that's really helpful.     │
│                                      │
│  Just a couple more things so your   │
│  counselor can create the right      │
│  program for you:                    │
│                                      │
│  💬 What daily activities has this   │
│     affected most?                   │
│     ________________________________│
│     |                               │
│     |                               │
│     |_______________________________|│
│                                      │
│  💬 What would "better" look like    │
│     for you?                         │
│     ________________________________│
│     |                               │
│     |                               │
│     |_______________________________|│
│                                      │
│  Skip for now — let counselor ask    │
│  ✨ Submit                            │
└─────────────────────────────────────┘
```

- Maximum **2 questions** per follow-up round (the AI generates them based on which required fields are missing)
- Questions are conversational, not field labels. Never "Enter pain duration" — always "How long has this been going on?"
- "Skip for now" always available — escorts the user to confirmation with flags for the counselor
- After max 2 rounds (3 including initial), flow proceeds to confirmation regardless

### Step 4: Confirmation card

What the AI extracted, presented as a **readable summary**, not a form:

```
📋 Here's what we understood:

Your situation: Lower back pain ~8 months,
started gradually after desk work

How it affects you: Can't sit through meetings,
can't play with kids, sleep disrupted

What changed most: You stand every 20 mins in
meetings now — wasn't like this before

Your goal: Work a full day and play with kids
again without pain

❓ We're still not sure about:
  → Your age range — [tap to add]
  → Whether you've tried therapy before — [tap to add]

✨ This looks right — start my program
✏️ Let me edit something
```

- High-confidence (≥0.85): ✅ green. No individual field editing — the summary is the unit of trust
- Low-confidence (<0.85) on required fields: ⚠️ amber with a gentle prompt to add more
- "We're still not sure" section: missing data that doesn't block plan generation but hurts personalisation
- "Start my program" is enabled ONLY when all required fields are ≥0.85. Otherwise shows "Add a bit more detail first" with an arrow pointing to the amber sections
- Edit mode: tapping "Let me edit something" expands the summary into editable fields. Each field has the extracted value pre-filled. User changes what's wrong, AI-edited fields are flagged differently from user-edited fields

---

## Data flow into plan generation

### What the counselor sees (before generating Week 1)

The intake summary appears in the counselor workspace as a **data bar** at the top of the Plan tab:

```
Client intake — AI extracted (round 2 of 3)
Overall confidence: 71%

✅ Solid (4 fields)      ⚠️ Review (2)      ❌ Missing (2)
painSource (0.96)       activities (0.72)   ageRange
painDescription (0.91)  redFlags (0.78)     priorTherapy
biggestChange (0.90)
recoveryGoal (0.88)

Raw text: "I've had lower back pain for about 8 months..."
[View full transcript]

[Generate Week 1 plan] [Request more intake details from client]
```

- Counselor can generate with the data as-is (flagged fields are in the LLM context with low-confidence markers)
- Or they can message the client: *"Thanks for sharing — before I create your program, could you tell me a bit more about..."*
- The data bar is collapsible — experienced counselors can skip straight to plan review

---

## Encouragement summary

| Mechanism | Where | Effect |
|-----------|-------|--------|
| Ghosted example text | One-box textarea | Sets expectations — users mirror the structure and detail level |
| Positive length nudges | Char counter | "Good start" → "This helps" — feels like progress, not a requirement |
| AI follow-up questions | Extraction loop | Only asks about what's missing, in conversational language. Max 2 rounds |
| "We're still not sure" | Confirmation card | Gentle framing — not "you failed to provide" but "we couldn't figure out" |
| Counselor data bar | Counselor workspace | Gives the counselor the power to decide: generate now or ask for more |
| Skip always available | Follow-up + confirmation | User can always say "enough — let the counselor handle it" |

---

## Implementation plan

### Phase 1: API + extraction (1 dev run)

| File | What |
|------|------|
| `apps/web/src/app/api/intake/extract/route.ts` | New endpoint — takes free text + segment, returns structured extraction |
| `apps/web/src/lib/intake-extractor.ts` | AI prompt for free-text extraction (new file) |
| `apps/web/src/lib/intake-mappers.ts` | Maps extracted fields → `intakeResponses` insert shape |

### Phase 2: Web UI (1 dev run)

| File | What |
|------|------|
| `apps/web/src/components/intake/SegmentSelector.tsx` | Landing cards component |
| `apps/web/src/components/intake/OneBoxIntake.tsx` | Free text + confirmation card |
| `apps/web/src/app/intake/page.tsx` | New intake route wrapping the flow |
| `apps/web/src/app/intake/confirm/page.tsx` | Confirmation + edit page |

### Phase 3: Mobile (1 dev run)

| File | What |
|------|------|
| `apps/mobile/app/intake/segment.tsx` | Segment selector screen |
| `apps/mobile/app/intake/onebox.tsx` | Free text screen |
| `apps/mobile/app/intake/confirm.tsx` | Confirmation + edit screen |
| Navigation wiring | Replace existing 7-step with new flow |

### Phase 4: Rollback safety

- Old intake route preserved at `/api/intake/legacy`
- Old intake UI preserved under feature flag `USE_LEGACY_INTAKE`
- Database: `intakeResponses` schema unchanged — extraction maps to existing columns
- No migration needed

---

## Fallback to current intake

Feature flag: `NEXT_PUBLIC_USE_LEGACY_INTAKE=true`

If set, the app skips segment selector + one-box and shows the existing 7-step form. This lets us:
- Roll out to a subset of users
- A/B test completion rates
- Hot-revert if extraction quality is poor

Rollback command: set the env var and redeploy. Or `git checkout pre-onboarding-revamp`.

---

## Success metrics

| Metric | Current (7-step) | Target (one-box) |
|--------|-----------------|-----------------|
| Intake completion rate | ~?% | >75% |
| Time to first submission | ~5-8 min | <2 min (round 1) |
| Time to plan-ready intake | N/A (always complete) | <4 min (includes follow-up rounds) |
| Required field confidence (≥0.85) | 100% (manual entry) | >80% after max 2 rounds |
| Follow-up round usage | N/A | <40% of users need round 2; <15% need round 3 |
| Counselor manual data requests | N/A | <20% of intakes (counselor asks for more) |
| Red flag detection recall | 100% | 100% (hard gate — must not miss flags) |
| User drop-off before plan generation | ~?% | <25% |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| AI hallucinates intake fields | Confirmation card as readable summary + editable fields. User must approve before save |
| Red flags missed in free text | AI prompt explicitly prioritizes safety. Red flag extraction is a hard gate — if uncertain (<0.85), flags as needs-review and plan is held |
| Users type too little | Ghosted example + length nudges + minimum 30 chars + 2 rounds of conversational follow-ups. Skip is always available but flags the counselor |
| Users frustrated by follow-up loop | "Skip for now" always visible. Max 2 rounds. Loop is framed as "helping your counselor" — never as "you didn't provide enough" |
| Segment mismatch (user picks pain, describes anxiety) | AI prompt detects mismatch. Follow-up round suggests: "It sounds like you might be describing anxiety more than pain — would you like to switch?" |
| Counselor receives low-confidence intake | Data bar shows confidence per field. Counselor can request more before generating. Plan context includes confidence markers so the LLM knows what's inferred vs. confirmed |
| Extraction API cost (LLM call per round) | ~$0.03/call. Worst case 3 calls per intake = ~$0.09. Acceptable for pilot. Monitor per-user cost; add caching if >$0.15 avg |