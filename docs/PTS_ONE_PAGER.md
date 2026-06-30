# PTS — One Pager

**Pain to Strength** · Counseling-led recovery for people whose pain has changed how they live.  
**Status:** Pilot-ready web app live · Mobile app (Expo) in design · Admin web separate  
**Repo:** [github.com/raak-tech/PTS](https://github.com/raak-tech/PTS) · **Live:** [pts-web-pied.vercel.app](https://pts-web-pied.vercel.app)

---

## What it is

| | |
|---|---|
| **Promise** | “You got hurt. We help you get back to living.” |
| **What it is** | 6-week counseling program + human counselor + daily support |
| **What it isn’t** | Medical care, diagnosis, emergency service, therapy marketplace |
| **Users** | **Clients** (pain recovery) · **Counselors** (review plans, message, monitor) · **Admin** (ops only, web) |

---

## Product surfaces (target)

```
┌─────────────────────┐     ┌─────────────────────┐
│  ONE Android app    │     │  Admin web          │
│  (Expo)             │     │  (browser)          │
│  · Client UI        │     │  · Create users     │
│  · Counselor UI     │     │  · Metrics / flags  │
│  · OTP login        │     │  · Escalations      │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
              PTS API + PostgreSQL (Neon)
              apps/web today → Vercel
```

**Not a third app:** Current web (`apps/web`) = marketing + pilot fallback until mobile ships.

---

## How it works (happy path)

1. **Admin** creates account (phone + role: client or counselor)  
2. User downloads app → **OTP login** (+91, MSG91 — reuse trainer-app stack)  
3. **Client:** 7-step intake → AI draft plan → **counselor approves** → daily program + messages  
4. **Counselor:** Work queue → approve plans, reply to messages, handle red flags  

---

## Tech stack

| Layer | Choice |
|-------|--------|
| API / web (now) | Next.js 16, TypeScript, Drizzle, Neon PostgreSQL |
| Mobile (next) | Expo (React Native), Bearer token auth |
| SMS / OTP | MSG91 (from `trainer-app-mvp-recovered` on 100.119.182.21) |
| LLM plans | Claude via OpenRouter |
| Deploy | Vercel (`sin1` region) |

---

## What's built today (web)

- OTP-ready backend **not yet** — still email/password on web  
- 7-step intake, LLM 6-week plans, counselor approve, messaging, metrics  
- Counselor register (invite code `CNSL-32223077`), Calendly, push subscriptions  
- Crisis alerts, `/admin` dashboard, PWA shell  

---

## Mobile app (approved direction)

| | |
|---|---|
| **Auth** | Phone only · admin pre-registers number · same OTP flow for both roles |
| **Client tabs** | Today · Program · Messages · Profile |
| **Counselor tabs** | Home (work queue) · Clients · Messages · Profile |
| **Full UX spec** | [`docs/MOBILE_APP_UX.md`](MOBILE_APP_UX.md) |

---

## People & pilot

| Role | Who |
|------|-----|
| Product / owner | Satheesh |
| Clinical lead | Ramya |
| Phase 0 | Internal E2E test (you + Ramya) before closed recruitment |
| Phase 1 pilot | 10–20 clients, 2–3 counselors |

---

## Key docs

| Doc | Purpose |
|-----|---------|
| [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) | Vision, intervention model |
| [`MOBILE_APP_UX.md`](MOBILE_APP_UX.md) | All mobile screens & flows |
| [`CURSOR_EXECUTION_SPEC.md`](../CURSOR_EXECUTION_SPEC.md) | Phase 0 runbook |
| [`CURSOR_BACKLOG_SPEC.md`](../CURSOR_BACKLOG_SPEC.md) | 98-item build backlog |
| [`PHASE0_CHECKLIST.md`](PHASE0_CHECKLIST.md) | Manual test checklist |
| [`BEFORE_PRODUCTION.md`](BEFORE_PRODUCTION.md) | Go-live: admin, MSG91, OTP test mode, data cleanup |

---

## Env vars (production)

`DATABASE_URL` · `OPENROUTER_API_KEY` · `COUNSELOR_INVITE_CODE` · `CRISIS_ALERT_EMAIL` · `ADMIN_EMAILS`  
*Mobile adds:* `MSG91_AUTH_KEY` · `MSG91_TEMPLATE_ID`

---

## Next steps (in order)

1. **Approve** [`MOBILE_APP_UX.md`](MOBILE_APP_UX.md)  
2. **Phase 0** — manual web E2E + `PHASE0_RESULTS.md`  
3. **Port OTP API** from trainer app → PTS  
4. **Expo prototype** on localhost (clickable all screens)  
5. **Wire mobile → API** · admin “create user” form  
6. **Closed pilot recruitment**

---

## Crisis (always visible in product)

**India:** iCall 9152987821 · Aasra 9820466726 · **Global:** findahelpline.com

---

*Last updated: 2026-05-29*
