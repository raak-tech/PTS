# Counselor Workflow — Pain to Strength

**Version:** 1.2 (supersedes v1.1)  
**Last updated:** 2026-07-03  
**Status:** Agreed — see `DECISIONS.md` entries dated 2026-06-30 (SCOPE-G), 2026-07-02 (Week-1-first), and 2026-07-03 (counselor claim)

---

## Core model (agreed, canonical)

**AI is the first draft. The counselor is the author.**

After intake, the LLM generates **Week 1 only**. The counselor reviews Week 1, edits any content inline, and approves it — releasing Week 1 to the client. Weeks 2–6 are generated **one at a time** after the counselor reviews that week's engagement data, saves a **week comment**, and clicks Generate Week N+1. Each week is approved individually before the client sees it. There is no bulk "approve all weeks" step.

The program is a 6-week arc, but content is released week by week. This is what makes Pain to Strength scalable: AI handles drafting so counselors can hold more clients; counselors apply clinical judgment so every client gets a personalised, human-reviewed program.

---

## Counselor surfaces

| Surface | Purpose |
|---------|---------|
| **Mobile app** (Expo) | Action queue — review pending plans, reply to messages, check daily engagement. Fast, in-between-sessions work. |
| **Web workspace** (`/provider`) | Deep work — inline plan editing, audio read-out recording, AI week regeneration, full engagement data. |

Counselors use both. Mobile for quick actions; web for clinical authoring.

**Counselor–client assignment:** The first counselor to generate Week 1, edit a week, or approve a week **claims** the client (`client_counselor` table). Queues show unclaimed clients plus the counselor's own clients only. See `PROVIDER_ASSIGNMENT.md`.

---

## Workflow 1 — New client plan review (Week 1)

Triggered when a client completes intake and the AI generates a **Week 1 draft** (~2–4 minutes).

### Step 1: Counselor receives alert
Push notification (mobile) or work queue item (web): *"New plan ready for review — [Client name]"*

### Step 2: Review client context
Before reading the plan, the counselor reviews:
- Intake summary (pain source, situation, goal)
- AI-generated client summary (`clientSummary` field)
- Key themes and watch points
- Red-flag status — if flagged, read the safety notes first

### Step 3: Edit Week 1 inline
On the web workspace, every field in Week 1 is editable:
- Week theme and focus text
- Each daily practice (title, description, duration)
- Weekly reflection prompt
- Daily read-out title and body text
- Holistic block text (Ayurveda, yoga, music) — or toggle off entirely

The counselor changes what needs changing. AI-generated content they're happy with stays as-is. Changes are saved automatically. Status moves from `draft` → `edited`.

### Step 4: Approve Week 1
Counselor clicks "Approve Week 1". Client immediately sees Week 1 in their app.

- If the plan has crisis notes: acknowledgment step required before approve is enabled.
- On approval: Week 1 daily read-out and calendar template are seeded automatically.
- Counselor is assigned to the client on **first action** (generate Week 1, week edit, or week approve) — not only on approve. First claim wins.

### Step 5: Record a daily read-out (optional but recommended)
From the web workspace, the counselor can record a short voice message that the client hears as part of their morning routine. Even 30 seconds in the counselor's own voice significantly increases client engagement.

### Step 6: Message the client
A quick message — *"Your Week 1 program is ready. I've reviewed your assessment personally and shaped this plan for your situation. Let me know how Day 1 goes."* — sets the relationship tone.

---

## Workflow 2 — Weekly review and Week N+1 approval

Triggered at the end of each week, when the client submits their weekly check-in.

### Step 1: Review the week's data
On the web workspace, the counselor reviews:
- Weekly check-in answers (what worked, what didn't, pain trend)
- Daily engagement: calendar blocks done/skipped, read-out responses, holistic completions
- Morning check-in pain trend (sparkline over the week)
- Scheduling insights (patterns in when the client engages or misses)

### Step 2: Save week comment, then generate Week N+1 draft
Before generating the next week, the counselor **must save a week comment** on the approved week (clinical notes for the AI — what to emphasise, adjust, or watch for). The API blocks generation without this comment.

Click "Generate Week N+1" — the AI uses the week comment, this week's engagement data (pain check-ins, read-out responses, client shares, calendar adherence), and the original intake to produce a tailored next-week draft, including any Ayurveda, yoga, and music blocks.

This takes 1–2 minutes. The counselor does not need to wait — they can read the current week data while it generates.

### Step 3: Edit Week N+1 inline
Same as Step 3 in Workflow 1. Edit what needs adjusting based on what the client actually did this week. Common adjustments:
- Reduce intensity if adherence was low
- Advance the focus if the client is doing well
- Add a specific practice the client mentioned in their check-in
- Rewrite a reflection prompt that didn't land

### Step 4: Approve Week N+1
Client sees the new week immediately.

### Step 5: Update the daily read-out
Record a new voice read-out or update the text read-out for the new week. Ideally references something specific from the client's check-in: *"You mentioned this week that walking felt easier — let's build on that."*

---

## Workflow 3 — Responding to flags and messages

### Red-flag alert
If a client's morning check-in, weekly check-in, or message contains a red flag:
- Counselor receives an immediate push notification
- Work queue shows the client with a red alert
- **SLA: counselor must respond within 12 hours**
- If no response within 12 hours: admin portal is automatically alerted

The counselor's response options:
- Message the client directly
- Adjust the current week's plan (reduce intensity, add a grounding practice)
- Mark for escalation in the admin portal

Pain to Strength is not responsible for crisis intervention. The platform surfaces crisis resources and routes to helplines. The counselor is responsible for safety assessment and response within their professional scope.

### Message response
**SLA: 12 hours maximum response time.**

Messages from clients appear in both the mobile work queue and the web console. Reply from whichever surface is convenient. The full message history is visible on both.

### "I'm struggling" trigger
When a client taps "I'm struggling", their counselor receives a push notification flagged as high priority. Treat as a 12-hour SLA item.

---

## Triage framework (per client per week)

After reviewing the weekly data, the counselor decides one of three paths:

| Path | When to use | Action |
|------|-------------|--------|
| **Continue** | Client on track, adherence good, no flags | Generate next week, light editing, approve |
| **Adjust** | Low adherence, explicit struggle, or counselor assessment of pace mismatch | Generate next week, significant editing (reduce intensity, change focus), add a check-in message |
| **Pause and support** | Red flags, safety concern, or client explicitly requests a break | Do not advance the program week. Focus on messaging support, crisis resources if needed. Notify admin if unresolved after 24 hours. |

---

## Per-week content reference

Each week the counselor reviews and potentially edits:

| Field | Source | Counselor action |
|-------|--------|-----------------|
| Week theme | LLM-generated | Edit if it doesn't fit the client's language or progress |
| Week focus | LLM-generated | Edit for clarity or clinical appropriateness |
| Daily practices (×3 typical) | LLM-generated | Edit title/description/duration; add or remove practices |
| Weekly reflection prompt | LLM-generated | Edit if it's too generic or doesn't match week focus |
| Daily read-out | LLM template + counselor voice | Always personalise — record audio when possible |
| Ayurveda block | LLM-generated | Toggle off if not appropriate; edit text if kept |
| Yoga trial | LLM-generated | Toggle off if not appropriate; edit if kept |
| Music moment | LLM-generated + curated Spotify | Edit suggestion text; curated playlists are admin-managed |

---

## Edge cases

### Client misses a check-in
- Do not assume improvement or deterioration
- Generate next week conservatively
- Add a check-in message: *"I noticed you didn't get to the weekly reflection — that's fine. What's one thing from this week worth carrying forward?"*

### Low adherence (fewer than half the practices completed)
- Reduce the number of daily practices next week
- Shorten practice durations
- Add an explicit "rest day" to the calendar template
- Consider messaging to understand the barrier before generating the next week

### No weekly check-in data at all
- Hold the Week N+1 approval until the client responds, or
- Generate a conservative "continuity" week that repeats the safest elements of Week N

### Client completes Week 6
- The program tab shifts to maintenance mode
- A graduation message is sent automatically
- Counselor should schedule a monthly check-in session (Calendly)
- Monthly check-in replaces weekly check-in in maintenance mode

---

## What does NOT change

- No outcome promises — process language only ("practices", "reflection", "support")
- Not medical advice — counselors do not diagnose or prescribe
- Crisis helpline always visible — surfaced via crisis strip in app
- Consent gates — data retention and artifact storage remain consent-gated
- Clinical responsibility — the counselor, not the platform, is responsible for the quality of guidance
