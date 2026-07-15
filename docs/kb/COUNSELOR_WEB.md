# Counselor web console

Durable notes for the **web** counselor workplace (`/provider/*`). Mobile counselor is **Bridge mode** — see [`MOBILE.md`](MOBILE.md) and [`../plans/2026-07-16-counselor-mobile-bridge.md`](../plans/2026-07-16-counselor-mobile-bridge.md).

**Canonical IA:** [`../plans/2026-07-15-counselor-chart-ia.md`](../plans/2026-07-15-counselor-chart-ia.md)  
**Ship / morning review:** [`../plans/2026-07-15-counselor-chart-ia-ship.md`](../plans/2026-07-15-counselor-chart-ia-ship.md)  
**Workflow depth:** [`../PROVIDER_WORKFLOW.md`](../PROVIDER_WORKFLOW.md)

---

## Primary IA (2026-07-15)

| Surface | URL | Do |
|---------|-----|-----|
| Caseload | `/provider/clients` | **Only home.** Urgency queue; Generate Week 1; formulation pending; engagement chips. |
| Client Chart | `/provider/clients/[id]?tab=` | Single workplace. **Layer-1 Client story rail on every mode.** |
| Plans | `/provider/plans` | **Not a second home.** Redirect → `?filter=plans` or Chart via `?highlight=<planId>`. |

Chart tabs: `plan` | `activity` | `messages` | `notes` (aliases: `overview`/`readouts` → activity).

### Four layers

1. **Client story** — intake / safety (always on Chart rail)  
2. **AI draft** — formulation / Week N draft  
3. **Counselor decisions** — edit, approve, notes  
4. **Lived action** — check-ins, holistic, read-outs, messages  

Clinical gates unchanged: week-at-a-time, claim-on-first-action, formulation approve before Week 1 for Pain Script cohort B.

---

## Auth & session (non-negotiables)

- Counselor/admin: **email/password** (`/login`). Phone OTP is for clients; `/login/mobile` nudges email when `next` is `/provider` or `/admin`.
- **Never revoke session on GET `/logout`.** Next.js `<Link href="/logout">` prefetch previously signed counselors out when opening Profile. Use **POST** form (sidebar) or GET confirm page → POST.
- Unauthenticated `/provider/*` redirects to `/login?next=/provider/clients` (email), not mobile OTP.

---

## Caseload behaviour

- Sort: safety → unread → **formulation pending** → plan draft/review → generate needed → quiet.
- `planStatus === 'none'`: **Generate Week 1** (client fetch `/api/provider/generate-plan`).  
  - `formulation_not_approved` / `formulation_missing` → open `/provider/formulations/[id]`.  
  - `unauthorized` → session expired; re-login with email.
- Pain Script pending formulations: `PendingFormulationsClient` on Caseload (moved off old plans page).
- Engagement: `/api/provider/engagement` — on !ok or error set **unavailable**, never leave “Loading today’s progress…” forever.

---

## Theme

Light high-contrast console: `apps/web/src/app/provider/provider-console.css`.  
Do **not** style all `button` elements with dark fill without excluding `.provider-tab` (tabs become illegible).

---

## Key code map

| Concern | File |
|---------|------|
| Shell + POST sign-out | `components/provider/ProviderShell.tsx` |
| Caseload list + Generate | `components/provider/ProviderClientsListClient.tsx` |
| Caseload data + formulations | `app/provider/clients/page.tsx` |
| Chart + rail + tabs | `app/provider/clients/[id]/ProviderClientWorkspaceClient.tsx` |
| Layer-1 rail | `components/provider/IntakeContextRail.tsx` |
| Plans redirect | `app/provider/plans/page.tsx` |
| Logout | `app/logout/route.ts` |

---

## Review smoke (any time)

1. Email login → Caseload.  
2. Progress chips resolve.  
3. Chart shows Client story on Plan + Activity.  
4. Sign out does not fire on Profile nav hover.  
5. `/provider/plans` → filtered Caseload.
