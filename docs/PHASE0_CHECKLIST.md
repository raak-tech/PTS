# Phase 0 Execution Checklist

**Duration:** 1-2 weeks  
**Lead:** Satheesh + Ramya  
**Goal:** Validate all flows work, identify bugs, prepare for Phase 1

---

## Pre-Testing Setup (Today)

- [ ] Verify Vercel deployment: https://pts-web-pied.vercel.app
- [ ] Confirm environment variables are set:
  - [ ] DATABASE_URL (Neon)
  - [ ] OPENROUTER_API_KEY
  - [ ] COUNSELOR_INVITE_CODE=CNSL-32223077
  - [ ] CRISIS_ALERT_EMAIL (optional, for testing alerts)
- [ ] Review PHASE0_TESTING_GUIDE.md
- [ ] Bookmark: /provider/metrics (Ramya's dashboard)

---

## Day 1: Happy Path (45 minutes)

**Satheesh (Client):**
- [ ] Go to https://pts-web-pied.vercel.app
- [ ] Click "Start intake"
- [ ] Complete 7-step form (15 min, includes demographics)
- [ ] Submit → plan should generate automatically
- [ ] Navigate to /plan → see 6-week program

**Ramya (Counselor):**
- [ ] Register at /register/counselor
  - Invite code: CNSL-32223077
  - Email: ramya@pts-test.local
  - Full name: Dr. Ramya
  - Bio: (any description)
  - Calendly: https://calendly.com/ramya-test (or leave blank)
- [ ] Navigate to /provider/plans
- [ ] Find Satheesh's plan (marked "draft")
- [ ] Review content (overview, themes, weeks 1-6)
- [ ] Add optional note: "Looks good, personalized well"
- [ ] Click "Approve" button
- [ ] Verify status changes to "approved"

**Back to Satheesh:**
- [ ] Refresh /plan → see approved plan with Ramya's name
- [ ] Navigate to /messages → see Ramya listed
- [ ] Send message: "Got the plan, thanks!"
- [ ] Wait 8 seconds → message should appear as sent

**Ramya:**
- [ ] Go to /messages
- [ ] See Satheesh's message
- [ ] Reply: "You're welcome, let's begin week 1!"
- [ ] Verify message appears in thread

---

## Day 2: Metrics & Booking (20 minutes)

**Ramya:**
- [ ] Go to /provider/metrics
- [ ] Verify it shows:
  - [ ] 1 registered client
  - [ ] 1 intake completed (100%)
  - [ ] 1 plan generated
  - [ ] 1 plan approved (100%)
  - [ ] 1 message (or more)
- [ ] Take screenshot for documentation

**Satheesh:**
- [ ] Go to /messages with Ramya
- [ ] Look for "📅 Book a session" button in thread header
- [ ] Click → opens Calendly (or shows "Not available" if no URL)
- [ ] Verify no errors

---

## Day 3: Notifications (15 minutes)

**Satheesh:**
- [ ] Go to /messages
- [ ] Look for "🔔 Enable reminders" button in sidebar
- [ ] Click → browser asks for permission
- [ ] Click "Allow" in permission popup
- [ ] Close PTS tab (go to another website)
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Type: `new Notification("PTS Test", { body: "Notifications work!" })`
- [ ] Press Enter
- [ ] You should see a system notification
- [ ] Document: Does it work? Any issues?

---

## Day 4: Crisis Handling (15 minutes)

**Satheesh (test unsafe intake):**
- [ ] Create NEW account: client-crisis@pts-test.local
- [ ] Start intake
- [ ] Go through steps 1-6 normally
- [ ] Step 7 (Safety check):
  - [ ] Check box: "One or more of the above apply to me right now"
  - [ ] Answer "Are you safe?" → Select "I need support right now"
  - [ ] Complete consent
  - [ ] Submit

**What should happen:**
- [ ] Plan generates
- [ ] Plan is marked "CRISIS" in counselor notes
- [ ] Email alert sent to CRISIS_ALERT_EMAIL (check inbox, may take 1-2 min)
- [ ] Alert email says: "Client has completed intake with safety concerns"
- [ ] Metrics dashboard shows red flag at top

**Ramya:**
- [ ] Check /provider/metrics
- [ ] See red flag alert
- [ ] Go to /provider/plans
- [ ] Find crisis client's plan
- [ ] See "🚨 CRISIS" in notes
- [ ] Review and approve (marking as handled)

---

## Ongoing: Bug Screening

**During all testing, document:**

**CRITICAL BUGS** (block Phase 1):
- [ ] Form submission fails
- [ ] Plan doesn't generate
- [ ] Plan can't be approved
- [ ] Messaging breaks
- [ ] Database errors
- [ ] Metrics shows wrong numbers

**MEDIUM BUGS** (fix before Phase 1):
- [ ] UI breaks on mobile
- [ ] Slow load (>3 sec)
- [ ] Typos or confusing copy
- [ ] Missing crisis resources

**LOW** (nice to fix):
- [ ] Layout tweaks
- [ ] Copy refinement
- [ ] Console warnings

---

## End of Phase 0: Summary

**Document findings in:** PHASE0_RESULTS.md

**Include:**
- Total users/intakes completed
- Any bugs found (with reproduction steps)
- Metrics accuracy verification
- Crisis handling verification
- Mobile experience feedback
- Go/no-go decision for Phase 1

**Success criteria:**
- [ ] Happy path works end-to-end
- [ ] No critical bugs
- [ ] Ramya confident in product quality
- [ ] Metrics accurate
- [ ] Crisis flow works

---

## Troubleshooting

**"Plan didn't generate"**
- Check Vercel logs (Settings > Logs > Functions)
- Verify OPENROUTER_API_KEY is set
- Check intake actually saved (query DB)
- Try again (API might have had temp failure)

**"Can't login as counselor"**
- Verify exact code: CNSL-32223077
- Check Vercel env vars (COUNSELOR_INVITE_CODE)
- Try form again

**"Metrics show 0"**
- Wait 30 sec (metrics refresh every 30s)
- Reload page
- Check DB: `SELECT count(*) FROM intake_responses`

**"Email didn't send"**
- Check CRISIS_ALERT_EMAIL is set in Vercel
- Check Vercel logs for `crisis_alert_email_failed`
- If nodemailer unconfigured, it fails silently

**"LLM response broken"**
- Code strips markdown automatically
- Check logs for `plan_generation_parse_error`
- Regenerate (submit intake again)

---

## Next Steps After Phase 0

1. Fix critical bugs (if any)
2. Iterate on copy/UX based on feedback
3. Document findings in PHASE0_RESULTS.md
4. **Decision:** Proceed to Phase 1 or iterate Phase 0 again?
5. If Phase 1: Use PILOT_RECRUITMENT.md to recruit closed cohort

---
