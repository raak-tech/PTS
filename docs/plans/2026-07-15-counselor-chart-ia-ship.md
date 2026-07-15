# Counselor Chart IA — ship note (overnight 2026-07-15)

**Status:** Shipped to production  
**Prod:** https://pts-web-pied.vercel.app  
**Branch:** `PainModelLearned` (working tree deployed; commit when ready)  
**Approved plan (do not rewrite):** [`2026-07-15-counselor-chart-ia.md`](2026-07-15-counselor-chart-ia.md)  
**Durable ops/IA notes:** [`../kb/COUNSELOR_WEB.md`](../kb/COUNSELOR_WEB.md)  
**Related incidents:** [`../kb/INCIDENTS.md`](../kb/INCIDENTS.md) § 2026-07-15 counselor web

## Why this ship exists

Counselor feedback + screenshots (plan contrast, Profile silent logout, dual OTP forms, Caseload stuck on “Loading today’s progress…”, Plan `unauthorized`, intake missing on some stages) led to an approved **Client Chart + four layers** IA. Overnight work finished the gaps left when `/provider/plans` became a redirect (Generate Week 1 + pending formulations).

## Four layers (glossary)

| Layer | Name | Counselor question |
|-------|------|--------------------|
| 1 | Client story | Who is this person? |
| 2 | AI draft | What does the system recommend? |
| 3 | Counselor decisions | What have I decided? |
| 4 | Lived action | What did they do? |

Week-at-a-time gate, claim-on-first-action, and AI-draft / counselor-author are unchanged (`DECISIONS.md`).

## Primary surfaces (canonical)

| Surface | URL | Role |
|---------|-----|------|
| **Caseload** | `/provider/clients` | Only counselor home / queue |
| **Client Chart** | `/provider/clients/[id]?tab=` | Single workplace; Layer-1 rail always on |
| **Plans (legacy)** | `/provider/plans` | Redirect → Caseload `?filter=plans` or Chart via `?highlight=<planId>` |
| **Formulation** | `/provider/formulations/[userId]` | Pain Script Stage 1 (still required before Week 1 for cohort B) |

### Chart modes

| `?tab=` | Layers | Notes |
|---------|--------|-------|
| `plan` | 2 + 3 | Default; `?week=N` for week sub-tab |
| `activity` | 4 | Also accepts legacy `overview` / `readouts` |
| `messages` | 4 | |
| `notes` | 3 | Admin notes; `#admin-notes` hash |

## What shipped overnight (post–plans redirect)

1. **Generate Week 1 on Caseload** for `planStatus === 'none'` (with timeout + elapsed; formulation → redirect to formulation review).
2. **Pending formulations** section restored on Caseload (`PendingFormulationsClient`).
3. **Urgency sort** includes formulation pending; cards show intake teaser + review CTAs.
4. **Engagement chips** treat non-OK / missing row as `unavailable` (never infinite loading).
5. **Light theme polish** — tab buttons no longer inherit dark `.provider-console button` fill; default tag contrast.
6. **Chart polish** — ← Caseload link; tab clicks sync `?tab=` via `history.replaceState`.
7. **Link sweep** — queue / engagement / admin / formulations pointing at plans → Caseload or highlight redirect.
8. **Auth** — GET `/logout` confirm page only (no revoke); POST signs out; mobile OTP stepped (`sent=1`); email nudge for `/provider`/`/admin` next.

## Key files

| Area | Path |
|------|------|
| IA plan | `docs/plans/2026-07-15-counselor-chart-ia.md` |
| Light console CSS | `apps/web/src/app/provider/provider-console.css` |
| Shell / nav / POST logout | `apps/web/src/components/provider/ProviderShell.tsx` |
| Logout route | `apps/web/src/app/logout/route.ts` |
| Caseload page | `apps/web/src/app/provider/clients/page.tsx` |
| Caseload list UI | `apps/web/src/components/provider/ProviderClientsListClient.tsx` |
| Layer-1 rail | `apps/web/src/components/provider/IntakeContextRail.tsx` |
| Chart | `apps/web/src/app/provider/clients/[id]/ProviderClientWorkspaceClient.tsx` |
| Plans redirect | `apps/web/src/app/provider/plans/page.tsx` |
| Mobile login step | `apps/web/src/app/login/mobile/page.tsx` |

## Morning review checklist

- [ ] Sign in with **email** at `/login?next=/provider/clients` (not phone OTP).
- [ ] Caseload loads; progress chips clear to ready **or** “unavailable” (no forever Loading…).
- [ ] Client story one-liner / formulation banner visible when relevant.
- [ ] `Generate Week 1` or `Review formulation` / `Review plan draft` as appropriate.
- [ ] Open chart → Client story rail on every tab; Plan / Activity / Messages / Notes work; URL `?tab=` updates.
- [ ] Profile → Sign out (sidebar POST) does **not** silently logout on hover; confirm page on GET `/logout`.
- [ ] `/provider/plans` lands on filtered Caseload.
- [ ] Light theme: readable text on cards/tabs (no dark-on-dark / light-on-light).

## Deploy note

Prod aliased **2026-07-15 ~23:07 IST** (`pts-web-pied.vercel.app`). Local tree may still be uncommitted — commit when reviewing so git history matches prod.

## Out of scope (unchanged)

Clinical gates, mobile client IA, claim-on-first-action rules.
