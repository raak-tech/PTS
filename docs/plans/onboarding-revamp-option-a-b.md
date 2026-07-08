# Onboarding Revamp — Option A + B Layered

**Status:** Spec (pending build)  
**Rollback:** `git checkout pre-onboarding-revamp`  
**Branch:** `feat/onboarding-onebox-segments`

---

## Flow

```
Landing → Segment cards → One-box free text → AI extraction → Confirm/edit → Plan generation
  (5s)        (3s)            (30-90s)            (2-4s)          (15-30s)       (existing)
```

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

- Cards are info-light, warm, no clinical jargon
- Selected card has a subtle highlight/checkmark
- "Continue" button only enabled after selection
- Skip option at bottom: *"Skip — just let me type"* → `segmentType: null`, generic hint

### Step 2: One-box free text

Single large textarea (mobile-optimized, ~4 lines visible):

> *[Segment-specific hint from table above]*
> *Write freely — don't worry about structure. Just tell us what's going on.*

- 500 char soft limit (counter appears at 400)
- Voice input button (microphone icon) — Android speech-to-text, iOS dictation. Falls back to keyboard
- "Continue" button
- Progress indicator: Step 2 of 3

### Step 3: AI extraction (background)

`POST /api/intake/extract`

**Input:**
```json
{
  "segmentType": "pain",
  "freeText": "I've had lower back pain for about 8 months now...",
  "voiceTranscript": null
}
```

**AI prompt extracts:**
- `painSource` / `painSourceOther`
- `painDescription`
- `painDuration`
- `activitiesAffected` (as JSON array)
- `biggestChange`
- `recoveryGoal`
- `recoveryTimeline`
- `ageRange`, `occupation` (if mentioned)
- `currentTreatment` (if mentioned)
- `socialSupport` (if mentioned)
- `structurePreference`
- `engagementTime`
- `ayurvedaPreferences` (pain segment only)
- `hasRedFlags` → boolean + flag notes
- `isSafe` → boolean
- `confidence` → 0-1 score per extracted field (how sure the AI is)

**Response:**
```json
{
  "extracted": {
    "painSource": "general",
    "painDescription": "Lower back pain for ~8 months, started gradually",
    "painDuration": "6to12m",
    "activitiesAffected": ["sitting at desk", "playing with kids", "sleeping"],
    "biggestChange": "Can't sit through meetings without standing every 20 minutes",
    "recoveryGoal": "Be able to work a full day and play with my kids without pain",
    "recoveryTimeline": "3-6 months",
    "hasRedFlags": false,
    "isSafe": true,
    ...
  },
  "confidence": {
    "painSource": 0.95,
    "recoveryGoal": 0.92,
    "ageRange": 0.3,
    ...
  },
  "missing": ["ageRange", "occupation", "priorTherapy"],
  "summary": "Lower back pain (~8 months) affecting desk work and family time. Goal: full workday + play with kids. No red flags detected."
}
```

### Step 4: Confirmation card

Shows what the AI understood in a clean card:

```
📋 Here's what we understood:

Pain situation: Lower back pain ~8 months, gradual onset ✓
What's affected: Desk work, family time, sleep ✓
What changed most: Can't sit through meetings ✓
Goal: Work a full day + play with kids ✓

✨ Looks good — start my program
✏️ Let me fix something
```

- High-confidence fields (>0.85): shown with green checkmark
- Low-confidence fields (<0.85): shown with amber "⚠️ need your input" → expandable to edit
- Missing fields: shown in a "Add more context (optional)" section at bottom
- User can tap any field to edit inline (inline text input replaces the value)
- "Start my program" → saves intake + triggers Week 1 generation

### Step 5: Missing data collection (optional, deferred)

Fields not provided in free text (age range, occupation, prior therapy, etc.) are collected later via a gentle prompt after Week 1 is live:
> *"Your program is ready! One quick thing — adding a few details helps your counselor personalise it further. 2 minutes?"*

This keeps onboarding fast but still captures the data over time.

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
| Time to completion | ~5-8 min | <2 min |
| Field accuracy (vs manual) | 100% | >90% high-confidence fields |
| Red flag detection recall | 100% | 100% (must not miss flags) |

---

## Risks

| Risk | Mitigation |
|------|-----------|
| AI hallucinates intake fields | Confirmation card + low-confidence flags. User must approve before save |
| Red flags missed in free text | AI prompt explicitly prioritizes safety. Red flag extraction is a hard gate — if uncertain, flags as needs-review |
| Users type too little | Minimum 30 chars before "Continue" enables. Hint text prompts for detail |
| Segment mismatch (user picks pain, describes anxiety) | AI prompt detects mismatch and suggests switching segment in confirmation step |