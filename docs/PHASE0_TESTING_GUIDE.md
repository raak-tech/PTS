# Phase 0 Testing Guide

**Duration:** 1–2 weeks  
**Who:** You (Satheesh) + Ramya (clinical lead)  
**Goal:** Confidence that all core flows work, identify critical bugs, validate the experience

---

## Quick Start

**All systems live at:** https://pts-web-pied.vercel.app

**You have:**
- ✅ Client registration & intake flow
- ✅ LLM plan generation (Claude API)
- ✅ Counselor console (review plans, see clients)
- ✅ Messaging (async)
- ✅ Calendly booking (link)
- ✅ Push notifications (browser Notifications API)
- ✅ Metrics dashboard (monitoring)
- ✅ Crisis alerts (red flags detected)

---

## Checklist: The happy path (end-to-end)

**Day 1: Setup (30 min)**

- [ ] Ramya creates counselor account at `/register/counselor`
  - Invite code: **CNSL-32223077**
  - Fill in: credentials, bio, Calendly URL (optional: use calendly.com/ramya or similar)
  - She gets logged in → sees provider console

- [ ] You create client account at `/register`
  - Email: something you can receive on
  - Complete the 7-step intake (15 min) → includes demographics

**Day 1: Intake → Plan (10 min)**

- [ ] Intake completes → plan generates automatically
- [ ] Ramya's provider console shows: new client, new plan awaiting review
- [ ] Ramya goes to `/provider/plans` → sees your plan with full context
- [ ] Ramya reviews the plan (generated content, themes, daily practices)
- [ ] Ramya clicks "Approve" → enters optional notes
- [ ] Plan status changes to "approved" → you (client) see it on `/plan`

**The plan should:**
- Be personalized (mention your pain source, goals, recovery timeline)
- Have 6 weeks of structure
- Include daily practices (3 per day, with duration)
- Show themes and watch points

**Day 1: Messaging (5 min)**

- [ ] Client goes to `/messages` → sees Ramya listed (assigned counselor)
- [ ] Client sends a message: "Hi Ramya, got the plan. Looking good."
- [ ] Ramya checks `/messages` → sees your message
- [ ] Ramya replies: "Great! Let's start week 1..."
- [ ] 8-second polling works (message appears without refresh)

**Day 1: Booking (2 min)**

- [ ] Client goes to `/messages` → thread with Ramya
- [ ] Thread header shows Ramya's name + "📅 Book a session" button
- [ ] Click → opens Calendly link (or shows "Not available" if no URL)

**Day 2: Notifications (5 min)**

- [ ] Client goes to `/messages` → sees "🔔 Enable reminders" button in sidebar
- [ ] Click → browser asks permission → allow
- [ ] Close PTS tab
- [ ] **Open browser DevTools Console** (F12 → Console)
- [ ] Type: `new Notification("Test", { body: "If you see this, notifications work" })`
- [ ] You should see a notification (exact behavior depends on OS/browser)

**Day 2: Metrics (5 min)**

- [ ] Ramya goes to `/provider/metrics`
- [ ] Should show:
  - 1 client, 1 counselor
  - 1 intake completed (100%)
  - 1 plan generated
  - 1 plan approved (100%)
  - 1 message sent
- [ ] Auto-refreshes every 30s

---

## Checklist: Crisis handling

**Setup:**

- [ ] Create a test intake with **red flags**
  - Reach the safety check step (Step 7)
  - Check: "One or more of the above apply to me right now" (simulating red flag)
  - Answer "Are you safe?" → "I need support right now"
  - Submit

**Expected behavior:**

- [ ] Plan is generated ✅
- [ ] Plan's `counselorNotes` field shows: "🚨 CRISIS: RED FLAGS OR SAFETY CONCERN..."
- [ ] Email alert sent to: $CRISIS_ALERT_EMAIL (check Vercel env vars)
- [ ] Metrics dashboard shows red flag alert at the top
- [ ] Ramya's plan review page marks this plan as urgent

**Test the email flow:**

- [ ] In Vercel project settings, set `CRISIS_ALERT_EMAIL=your-email@example.com`
- [ ] Create another test intake with red flags
- [ ] Check your email inbox for alert (may take 1–2 min)
- [ ] Alert should say: "Client has completed intake with safety concerns"

---

## Checklist: Data & behavior edge cases

### Empty/minimal intake
- [ ] Try to submit intake with missing required fields
  - Should show validation error ("Tell us more about your pain")
  - Cannot submit Step 1 without describing pain

### Invalid email
- [ ] Register with invalid email (abc@, no domain)
  - Should show error before submit

### Duplicate email
- [ ] Register two accounts with same email
  - Second should fail: "That email is already registered"

### Plan regeneration
- [ ] Go back and resubmit intake (same client) with different pain description
  - New plan should generate
  - Old plan in DB is replaced (upsert logic)

### Message read status
- [ ] Ramya sends message to client
- [ ] Client opens `/messages`
- [ ] Message should mark as read (visible in DB: `readAt` timestamp)
- [ ] If Ramya sends another message, client sees both

### Logout / session expiry
- [ ] Log in as client
- [ ] Click logout
- [ ] Try to access `/plan` → redirect to `/login`
- [ ] Session cookie should be cleared

---

## What to watch for (bug screening)

### Critical bugs (block Phase 1)
- [ ] Intake form doesn't submit (network error, validation bug)
- [ ] Plan doesn't generate (LLM API error, bad prompt)
- [ ] Plan can't be approved (database error)
- [ ] Messaging breaks (8s poll fails, message doesn't save)
- [ ] Counselor can't see clients (query error)
- [ ] Metrics shows wrong numbers (calculation bug)
- [ ] Crisis alert email doesn't send (SMTP config missing)

### Medium bugs (fix before Phase 1)
- [ ] UI errors (form layout breaks on mobile, button doesn't respond)
- [ ] Slow load times (> 3 sec for any page)
- [ ] Typos or awkward copy
- [ ] Missing red flag resources (iCall, Aasra numbers in crisis message)
- [ ] Notifications permission never asked
- [ ] Plan approval takes >5 seconds

### Low priority (nice to fix)
- [ ] Minor layout tweaks
- [ ] Copy refinement
- [ ] Console warnings (not errors)

---

## Data flow checklist (technical)

| Component | Expected behavior | How to verify |
|-----------|-------------------|---------------|
| **Intake form** | Saves 7 steps to `intake_responses` table | Ramya's console shows client data |
| **LLM call** | Claude API called with demographics + context | Check Vercel logs (Settings > Logs) |
| **Plan generation** | JSON parsed correctly, saved to `plans` table | Ramya sees rendered plan (not JSON) |
| **Plan approval** | `plans.status` → "approved", `counselorId` set | Plan appears on client's `/plan` |
| **Messaging** | Rows inserted into `messages` table, 8s polling works | Both see each other's messages instantly |
| **Calendly link** | `calendlyUrl` stored in `counselor_profiles` | Client sees clickable button |
| **Push subscriptions** | Subscription saved (optional for MVP) | Button toggles on/off |
| **Metrics query** | Counts match actual DB rows | Manual query: `SELECT count(*) FROM intake_responses` |

---

## Database health check

**SSH into Neon** (if you have access) or use Vercel > Integrations > Neon dashboard:

```sql
-- Should see: 1 intake
SELECT count(*) FROM intake_responses;

-- Should see: 1 plan
SELECT count(*) FROM plans;

-- Should see: 1 assignment
SELECT count(*) FROM client_counselor;

-- Should see: ≥1 messages
SELECT count(*) FROM messages;

-- Check red flags
SELECT id, has_red_flags, is_safe FROM intake_responses;

-- Check plan status
SELECT id, status, counselor_notes FROM plans;
```

---

## Logging & debugging

**Check Vercel logs:**
- Go to Vercel project > Deployments > Recent deployment > Functions
- Look for errors in structured JSON format
- Example: `{ "type": "error", "message": "...", "stack": "..." }`

**Check browser console:**
- F12 > Console tab
- Look for any red `Error:` messages
- Check Network tab to see failed API calls (4xx, 5xx)

**Check Neon logs:**
- Vercel > Integrations > Neon > Open Dashboard
- Query > Logs tab
- Look for slow queries or connection errors

---

## Sample test data (if you want to skip the form)

Instead of doing the full 7-step intake manually, you can **insert test data directly** (if you have DB access):

```sql
INSERT INTO intake_responses (
  id, user_id, pain_source, pain_description, pain_duration,
  age_range, gender, occupation, affects_work, has_dependents, prior_therapy, country_region,
  activities_affected, biggest_change, recovery_goal, recovery_timeline,
  current_treatment, social_support, structure_preference, engagement_time,
  has_red_flags, is_safe, consent_given, completed_at, created_at, updated_at
) VALUES (
  gen_random_uuid(), '<<CLIENT_USER_ID>>',
  'workplace', 'Injured my knee in a fall at the office', '3to6m',
  '26to35', 'male', 'Software engineer', 'yes', 'yes', 'no', 'India',
  '["work", "sport", "social"]', 'I cannot run or play football anymore', 
  'Be able to work full-time and exercise again', '6to12m',
  'Seeing a physio', 'yes', 'structured', 'evening',
  false, true, true, NOW(), NOW(), NOW()
);
```

Then trigger plan generation:
```bash
curl -X POST https://pts-web-pied.vercel.app/api/intake \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<<YOUR_SESSION_TOKEN>>" \
  -d '{"painSource":"workplace",...all fields}'
```

(Or just do the form — it's faster for Phase 0)

---

## Success criteria for Phase 0

| Criterion | How to know | Owner |
|-----------|------------|-------|
| Core flow works end-to-end | Client intake → plan → approval → messaging | Both |
| No critical bugs | No crashes, all pages load | Both |
| Ramya confident in quality | Can see enough to make call on messaging/plan | Ramya |
| Metrics dashboard works | Shows accurate numbers | Both |
| Crisis alerts work | Red flag detected, email sent, plan flagged | Both |
| Mobile experience acceptable | Form usable on phone, readable | Satheesh |

**Exit Phase 0 when:** All above are ✅. No critical blockers.

**Go to Phase 1 when:** You confirm Phase 0 complete + finalize recruitment script.

---

## Common gotchas

### "Plan didn't generate"
- Check Vercel logs for LLM error
- Verify `OPENROUTER_API_KEY` is set in Vercel env
- Check intake was actually saved (query DB)
- Try submitting intake again (might work on 2nd try if API had temp failure)

### "Can't login as counselor"
- Make sure you're using the exact invite code: **CNSL-32223077**
- Check it in Vercel env vars: `COUNSELOR_INVITE_CODE`
- Restart form, try again

### "Metrics shows 0 clients but I created an account"
- Check user table has the record
- Run: `SELECT count(*) FROM users WHERE role = 'client'`
- Metrics refreshes every 30s—wait and reload

### "Email didn't send"
- Check `CRISIS_ALERT_EMAIL` is set correctly
- For nodemailer: if env vars aren't set, email fails silently (logs it but doesn't crash)
- Look at Vercel logs for: `"crisis_alert_email_failed"`

### "LLM response is malformed JSON"
- Claude wrapped it in markdown: ````json...` ```
- Code strips markdown automatically—should work
- If still fails, check logs for `plan_generation_parse_error`
- Regenerate plan (submit intake again)

---

## After Phase 0

**Document findings:**

- What worked well
- What was confusing
- Any bugs (with reproduction steps)
- What UX tweaks are needed
- Any scope creep or feature requests

**Then:**
- Fix critical bugs
- Refine copy based on feedback
- Decide: proceed to Phase 1 or iterate?
