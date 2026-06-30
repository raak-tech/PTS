# PTS Mobile App — UX Review & Recommendations

**Reviewer role:** UI/UX Designer  
**Review date:** 2026-06-27  
**Source document:** `docs/MOBILE_APP_UX.md` (Draft, last updated 2026-05-29)  
**Codebase reference:** `apps/web/` — Next.js web app, auth model, DB schema  

---

## Executive summary

The MOBILE_APP_UX.md spec is structurally sound and clinically thoughtful. The routing logic, role separation, and crisis-first principles are well-considered. However, the document reads more like a screen inventory than a felt experience — it describes *what screens exist* but under-specifies *how they feel to someone in pain reaching for their phone*. The recommendations below address that gap: micro-interaction details, layout tension points, and specific calls for the Expo prototype phase.

**Overall verdict:** Approve structure. Revise 6 interaction areas before prototype build.

---

## 1. Auth flow (Screens A0–A3) — Review

### What works
- Phone-only OTP is the right call for an India pilot. Removes password friction.
- "Number not registered" (A1b) immediately redirecting to crisis resources is excellent clinical-first design.
- 15-second resend timer is standard and appropriate.

### Issues

**A1 — Missing context for first-time users**  
The spec says "Your number must be registered by your program administrator" but doesn't address the emotional state of the user arriving at this screen. Someone entering a pain recovery app for the first time may be anxious, skeptical, or unfamiliar with OTP. The copy should be more welcoming.

**A2 — OTP keyboard experience gap**  
The spec lists `inputMode=numeric` and `autoComplete=one-time-code` but doesn't specify whether this is a 6-box split input or a single field. On Android, split-box inputs have better UX for OTP (auto-advance, clearer progress) and directly affect drop-off at this step.

**A0 — Splash screen decision deferred**  
"Optional, 1s" is vague. A 1-second branded splash with no perceived function increases cold-start time perception. Recommend removing it or making it functional (session validation happens during splash, not after).

### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| A1-1 | Generic "registered" copy | Rewrite: *"Welcome to Pain to Strength. This app is invite-only — your counselor or program coordinator set up your account. Enter your mobile number to get started."* |
| A2-1 | Input style undefined | Use **6 individual OTP boxes** (not a single field). Auto-advance on digit entry. Android auto-fill from SMS works with `autoComplete=one-time-code` on each. |
| A0-1 | Splash adds latency | Make splash multi-task: show logo, simultaneously validate stored session token, advance to correct screen once validation resolves. Cap at 800ms total. |
| A3-1 | Session expired is a modal | Modals block content the user may want to read. Show as a **full-screen interstitial** instead (same pattern as initial login). |

---

## 2. Client experience — Review

### 2.1 Intake flow (C1–C8)

#### What works
- 7-step progressive disclosure is correct. Intake on one long scroll would be overwhelming.
- Local save-and-resume is essential for a health form — user may be interrupted by pain.
- Red flag checkpoint at Step 7 (C7) before submission is clinically appropriate.

#### Issues

**Step count mismatch**  
The spec says "Multi-step flow aligned with web IntakeClient (7 steps)" but the screen table lists C1–C7 = 7 steps, plus C7a (crisis) and C8 (complete) as additional states. The progress bar copy "Step X of 7" will confuse users who encounter C7a. The progress bar should only count the core 7 steps; C7a and C8 are outcome screens, not intake steps.

**Step 7 (C7) — Safety check emotional design**  
This is the highest-stakes screen. The spec describes it as a list of red flags with "do these apply?" and a safety question. On mobile, this must be handled with care:  
- A dense checkbox list of clinical symptoms scrolled past quickly is a patient-safety risk.  
- The word "safety" before the user has built any rapport with the app can feel clinical and alarming.

**Intake abandonment recovery**  
The spec mentions local storage save-and-resume but doesn't define what the re-entry experience looks like. Someone who abandons mid-intake and returns days later needs a clear "Resume from Step 4" entry point, not silent data restoration.

**C8 (Intake complete) — Counselor timeline gap**  
"Counselor reviews within ~24 hours" is honest but may feel like abandonment to someone who just disclosed pain and struggle. The spec's CTA of "Go to messages" is good but needs more immediate warmth.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| I-1 | Progress bar includes C7a | Progress bar counts C1–C7 only. C7a/C8 are outcome states shown without a step counter. |
| I-2 | C7 safety check UX | Break C7 into **two separate screens**: (a) "A few important things" — show red flag list one at a time, not all at once. (b) Consent + confirmation. Add warm body copy: *"We ask this so your counselor can make sure your program is right for you."* |
| I-3 | Re-entry after abandonment | On re-open, show a **"Resume your assessment" card** on a near-empty screen with: step they left on, days since they started, "Continue" and "Start over" options. Don't silently restore form state. |
| I-4 | C8 waitlist warmth | Add to C8: name of assigned counselor (if already assigned), a small animated checkmark, and copy like: *"[Ramya] will read your assessment personally before building your plan."* Make the wait feel intentional, not abandoned. |
| I-5 | Intake progress saving | Add a subtle "Draft saved" toast after each step completion (below the Continue button). Reduces anxiety that tapping Back = losing data. |

---

### 2.2 Today tab (C10–C13)

#### What works
- "What do I do right now?" framing is exactly right for someone managing daily pain.
- Evening reflection timing (after 6pm or when morning+practice done) is smart contextual logic.
- Morning check-in as a modal or inline expand keeps it low-friction.

#### Issues

**C10 — Cognitive load on Today**  
The spec lists 6 sections on Today: greeting, morning check-in, today's practice, mark complete, evening reflection, quick links. That's too much for a single screen aimed at 2–10 minute sessions. Users will scroll-blind past items below the fold.

**Pain slider (C11) — Clinical sensitivity**  
A 0–10 slider for pain has well-documented usability problems on mobile: thumb precision is poor, numbers are small, and users anchor to previous values. For a clinical context, this is more than a UX issue — it affects the quality of data reported to counselors.

**Mark complete flow**  
"Checkbox + optional 'How did it feel?' (short text or emoji scale)" — the word "checkbox" will render as a tiny 20×20 tap target unless specified otherwise. The completion of a practice should feel like a meaningful moment, not clicking a form element.

**Rest days**  
The spec has a "Rest & reflect" variant but provides no content for it. A user who opens the app on a rest day and sees an empty-state variant without clear guidance may feel the app has nothing to offer.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| T-1 | Too many sections | Prioritize: show **morning check-in card first** (above fold) until complete. **Today's practice** becomes the dominant element once check-in is done. Evening reflection appears in-place as a card swap after 6pm. Reduce simultaneous visible content. |
| T-2 | Pain slider | Replace 0–10 slider with a **visual face scale + number** (NRS). Each face maps to a number. Show previous day's level faintly as a reference point. Reduces anchoring bias and improves accuracy. |
| T-3 | Mark complete | Use a large **full-width "Mark done" button** (not a checkbox). After tap: small confetti or color shift on the practice card, then "How did that feel?" appears as a follow-up row. Treat completion as a milestone. |
| T-4 | Rest day content | Define rest day: show a quote relevant to recovery, a 2-minute breathing prompt, and a single reflection question. "Rest" doesn't mean "empty." |
| T-5 | Greeting | Add day-of-week awareness: if it's Day 1 of Week 1, copy should reflect the milestone. If it's Day 6 of Week 6, different tone. Avoid generic "Good morning" copy throughout the entire 6-week program. |

---

### 2.3 Program tab (C14–C18)

#### What works
- Week-card layout with status chips (locked/current/complete) is clear.
- Weekly check-in tied to the Program tab keeps the counselor feedback loop visible.

#### Issues

**C14 — Visual hierarchy of a locked program**  
Weeks 2–6 locked in MVP. The spec doesn't describe the visual treatment of locked weeks. Greyed-out content can feel punitive or confusing ("am I doing something wrong?"). The locked state needs intentional design that builds anticipation, not blocks it.

**C17 (Weekly check-in) — Wall of text inputs**  
Four open-text prompts on one screen is cognitively heavy, especially for someone after a full week of managing pain. The check-in should feel like a conversation, not a form.

**C18 (Book a session) — External browser break**  
The spec correctly chooses external browser for MVP over WebView. However, the transition back to app after booking is undefined. The user may feel they "left" the app and need to find their way back.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| P-1 | Locked weeks | Use **teaser cards** for locked weeks: show the week theme and a silhouette of practices with a subtle lock icon. Copy: *"Week 2 unlocks when your counselor marks Week 1 complete."* Builds anticipation. |
| P-2 | Weekly check-in | Present prompts **one at a time**, full-screen (similar to intake step pattern). 4 prompts = 4 mini-screens with a thin progress bar. Each screen: one question, one text area, Continue button. |
| P-3 | Calendly external break | Before launching external browser: show a bottom sheet explaining *"We're opening your counselor's booking page — you'll return to PTS when you're done."* Include the counselor's name and a photo thumbnail if available. After return, show a toast: *"Need to reschedule? You can always come back here."* |

---

### 2.4 Messages (C19–C20)

#### What works
- Polling at 8s for MVP is acceptable. WebSocket is the right phase 2 upgrade.
- Unread badge on tab is correct placement.

#### Issues

**C19 — Single thread, so why a list?**  
The spec acknowledges it's single-counselor pilot only, yet describes a "Conversation list" screen (C19). This adds an unnecessary navigation hop. For pilot, skip the list and go directly to the thread.

**C20 — Composer focus behavior on Android**  
On Android, when a keyboard opens over a chat thread, the composer can be hidden behind the keyboard without proper window resizing. The spec doesn't address this. This is a known Expo/React Native issue and needs explicit handling in the implementation brief.

**Message polling notification**  
No mention of how the user knows a new message arrived while the app is foregrounded. A silent poll with no visual indicator is a missed opportunity to drive engagement during the pilot.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| M-1 | Unnecessary list screen | **Remove C19** for pilot. Tap Messages tab → go directly to thread with assigned counselor. Add counselor's name and avatar (or initials) in the header. Reintroduce list view only when multi-counselor is needed. |
| M-2 | Keyboard handling | Add explicit note in implementation spec: use `KeyboardAvoidingView` with `behavior="padding"` on Android, test with both soft (virtual) and hardware keyboards. |
| M-3 | Foregrounded new message | When a new message arrives during polling, show an **animated "New message" pill** at the top of the thread that scrolls to the new message on tap. |

---

## 3. Counselor experience — Review

### 3.1 Work queue (P1)

#### What works
- "What needs me now?" framing is correct. Counselors shouldn't need to count or sort manually.
- Alert prominence (red if any) is appropriate for a clinical context.

#### Issues

**P1 — Queue density**  
The spec lists 5 sections on P1: Alerts, Pending plan reviews, Unread messages, Inactive clients, Today's snapshot. For a counselor managing 10–15 clients, this could render as a very long list with no clear top priority.

**P1 — No empty state design**  
For a new counselor with zero clients (or at the start of a day with no actions), the spec doesn't define what the screen shows. An empty queue with no guidance feels broken.

**P2 — Metrics on scroll**  
Burying KPIs below the work queue is correct — action first, data second. But "optional scroll" is too vague for implementation. Define the scroll contract.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| Q-1 | Queue prioritization | Render sections in strict priority order with **visual weight**. Alerts: red banner, always first. Then plan reviews. Then messages. Inactive/snapshot collapsed by default with expand toggle. No more than 3 plan review cards visible before "See all." |
| Q-2 | Empty queue state | Design an uplifting empty state: a checkmark icon, *"You're all caught up — no actions needed right now."* Show a summary: "3 clients active this week." Don't show an empty list. |
| Q-3 | P2 scroll contract | P2 KPI section: a fixed compact bar (2 numbers) pinned just above the tab bar — always visible, no scroll required. Full metrics link goes to web. |

---

### 3.2 Plan review (P4)

#### What works
- Client context card at top of plan review is clinically correct — counselor needs context before approving.
- Crisis banner auto-applied for flagged plans is a safety-critical feature that's well-placed.

#### Issues

**P4 — Length of plan review on mobile**  
A 6-week plan with 7 days each = up to 42 practice entries, plus themes, reflections, and counselor notes. Reviewing this in full on a 6-inch screen is impractical. The spec doesn't address how the counselor navigates a full plan on mobile.

**P4 — "Approve plan" CTA placement**  
If "Approve plan" is at the bottom of the screen, the counselor must scroll through the entire plan before approving. This creates accidental approvals (scroll past, see CTA, tap) and required-read friction.

**Crisis banner**  
Auto-applied crisis notes should not be possible to scroll past without acknowledgment. The spec notes "If CRISIS notes auto-applied" as a section — but doesn't define whether it's dismissible or requires active acknowledgment.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| R-1 | Long plan on mobile | Show plan in **accordion per week** (collapsed by default). Each week shows: theme + number of practices. Counselor expands weeks they want to review. Default-expand Week 1. |
| R-2 | Approve CTA placement | Show "Approve plan" as a **sticky footer button** (always visible). Add a secondary "Review week by week" progress indicator above it: "Viewed 3 of 6 weeks." This enables fast approval for experienced counselors while gently nudging careful review. |
| R-3 | Crisis banner acknowledgment | If plan has crisis notes, **block the Approve CTA behind an acknowledgment step**. Show: *"This plan has crisis-level notes — please read before approving."* Require a checkbox interaction before Approve is enabled. |

---

### 3.3 Client detail (P5)

#### What works
- Status chips (Intake ✓ / Plan pending / Plan active) are scannable.
- Red flag icon on the list is correct prominence.

#### Issues

**P5 — Action buttons at the bottom, context at the top**  
The spec lists: header, intake summary, plan status, engagement, red flags, then actions. A counselor responding to a red-flag alert needs the action buttons immediately, not after scrolling past demographics. Context-action proximity changes by use case.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| D-1 | Action placement | For the red-flag entry path (from P1 alert), show a **compact contextual action bar** near the top: [Message] [Review plan]. Full detail below. Leave the bottom-of-screen action layout for the default browse path (from Clients tab). |

---

## 4. Global elements — Review

### 4.1 Crisis strip (persistent)

#### What works
- Thin persistent affordance is correct — visible without dominating.
- Bottom sheet on mobile (vs. top banner on web) is the right platform adaptation.

#### Issues

**Tap target size**  
A "thin bar" for crisis access could be as small as 8–12px tall — far below the 44px minimum touch target. Users in distress need this to be reliably tappable.

**Bottom sheet depth**  
The spec shows the crisis sheet will have 4 resources (iCall, Aasra, findahelpline, Safety guidelines). On a small screen, a bottom sheet with 4 rows, phone numbers, and copy risks being cut off above the fold.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| CR-1 | Touch target | Crisis affordance must be **min 44px tall**. Recommended: a full-width banner styled as a subtle gradient bar (not a hairline divider) with "Need help now?" text visible without tap. |
| CR-2 | Bottom sheet overflow | Bottom sheet should be **scrollable** with a fixed `max-height: 70vh`. Test on 5-inch screens. Snap to 50% of screen height on open; allow drag-up. |

---

### 4.2 "I'm struggling" button (Phase 1b)

#### Issue
The spec places this as a "floating action or tab-adjacent button." On Android, FABs overlap tab bars and content in complex ways. Phase 1b placement needs firmer definition.

#### Recommendation
Place "I'm struggling" as the **leftmost item on the Today tab** — a full-width yellow card above the morning check-in, always visible, with three quick actions (breathing, message counselor, crisis sheet). Remove the FAB concept entirely. This makes it intentional, not intrusive.

---

## 5. Navigation architecture — Overall assessment

The 4-tab structure for both roles is correct. Observations:

| Role | Tab order | Assessment |
|------|-----------|------------|
| Client | Today / Program / Messages / Profile | Today first is correct. Messages before Profile is right (more frequent use). |
| Counselor | Home / Clients / Messages / Profile | Home (queue) first is correct. Clients before Messages is appropriate. |

**One issue:** Both roles have `Messages` at position 3 (third tab). The unread badge on Messages is the primary alert mechanism in MVP. Thumb reach to position 3 on a large phone is inside the "neutral zone" — comfortable. This is fine.

**Missing:** The spec doesn't define **tab highlight/active state behavior**. When a counselor approves a plan and returns to the work queue, does the Home tab badge clear? Define badge lifecycle for all tab types.

---

## 6. Design system consistency — Web to Mobile

The web app uses:
- Font: Geist (system fallback)
- Primary text: `#111`
- Accent: `#fbbf24` (amber/yellow)
- Secondary: `#f97316` (orange, used in gradients)
- White backgrounds, `#f9f9f9` for sections
- `border-radius: 16px` on cards
- No component library (all inline styles)

The mobile spec says: match web colors. This is achievable but needs explicit design tokens to avoid drift during Expo build.

#### Recommendations

| # | Issue | Recommendation |
|---|-------|----------------|
| DS-1 | Token definition | Define a `theme.ts` file in `apps/mobile` before any screen development. Export: `colors`, `spacing`, `typography`, `radii`. Mirror web values exactly for brand consistency. |
| DS-2 | Typography | Use **system font stack** (SF Pro on iOS, Roboto on Android) rather than loading Geist as a web font. Geist is available as a variable font but adds bundle size. Pilot on system fonts; switch if brand fidelity requires Geist. |
| DS-3 | Spacing | The web uses `24px` as standard horizontal padding. On mobile, use `16px` horizontal padding for content, `24px` for hero/header sections. Smaller screens need less margin. |

---

## 7. Accessibility notes

| Element | Concern | Recommendation |
|---------|---------|----------------|
| Pain slider | Touch precision on slider thumb | Ensure slider thumb is min 44×44px with haptic feedback on increment |
| OTP boxes | Screen readers announce "edit box" 6 times | Add `accessibilityLabel="OTP digit 1 of 6"` pattern |
| Crisis strip | Persistent element should be accessible from any screen | Add `accessibilityRole="button"` and `accessibilityLabel="Get crisis support"` |
| Progress bar (intake) | Dynamic content change | Announce step changes with `AccessibilityInfo.announceForAccessibility("Step 2 of 7: About you")` |
| Message bubbles | No visual distinction for sender besides position | Add accessible sender attribution in `accessibilityLabel` of each bubble |

---

## 8. Open questions raised by this review

These extend the 5 Q&A items in the spec and need resolution before Expo prototype:

| # | Question | Stakes |
|---|----------|--------|
| OQ-1 | Will the intake require network connectivity, or can Steps 1–6 complete offline with Step 7 (submit) requiring connectivity? | Affects local storage architecture |
| OQ-2 | Is the pain slider (0–10) a clinical reporting tool or a subjective check-in? Clinical → needs NRS-11 standard; subjective → more flexibility. | Affects later plan adjustments |
| OQ-3 | What happens when a client's plan expires (6 weeks done)? Does the app have an end state? | Screen C10 Today tab is undefined after Week 6 |
| OQ-4 | Can a counselor have more than one intake pending for the same client (re-intake)? | Affects P4 plan review screen complexity |
| OQ-5 | Pilot is +91 India only — are all copy and date/time formats India-specific? | Affects calendar, time display, phone formatting |

---

## 9. Summary of changes to MOBILE_APP_UX.md

| Section | Priority | Change |
|---------|----------|--------|
| A2 — OTP input | High | Specify 6-box split input pattern |
| C1–C7 — Intake step labeling | High | Clarify C7a / C8 are outcome screens, not steps |
| C7 — Safety step | High (patient safety) | Split into 2 screens; rewrite copy tone |
| C10 — Today tab layout | High | Define content priority order; max visible above fold |
| C11 — Pain input | High | Replace slider with visual face scale |
| P4 — Plan review | High (clinical) | Crisis notes: require acknowledgment before approve |
| P4 — Approve CTA | Medium | Sticky footer; week-view progress |
| C19 — Message list | Medium | Remove for pilot; direct to thread |
| C17 — Weekly check-in | Medium | One-question-at-a-time flow |
| C14 — Locked weeks | Medium | Teaser card design |
| A0 — Splash | Low | Make functional (session validation during splash) |
| DS-1 — Design tokens | Pre-build | Define `theme.ts` before any screen |

---

## 10. Recommended first-build prototype screen order

When engineering starts the Expo prototype, prioritize screens in this order to enable early clinical review by Ramya:

1. **A1 / A2** — OTP login (establishes access pattern)
2. **C1–C7** — Intake flow (Ramya's primary clinical review surface)
3. **C8 / C9** — Post-intake states (waiting for plan)
4. **P4** — Plan review (counselor approves; unlocks client Today)
5. **C10** — Today tab (the daily core loop)
6. **C20 / P8** — Message threads (both roles)
7. **P1** — Counselor work queue (operational backbone)

Rationale: the intake → plan approval → today loop is the core value proposition. Everything else can be reviewed later.

---

*Review prepared for Satheesh, Ramya, and engineering. Please annotate with approval / change / defer on each recommendation.*
