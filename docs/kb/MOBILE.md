# Mobile (Expo) knowledge

**App paths:** `apps/mobile/`  
**Pilot APK:** `dist/pts-mobile-pain-pilot.apk` · package `com.pts.mobile.painscript` · cohort `EXPO_PUBLIC_PILOT_COHORT=pain_script`  
**API default:** `https://pts-web-pied.vercel.app`

---

## Expo Router — hard rules

1. **Never** have both `foo.tsx` and a `foo/` directory under the same parent. Expo registers both as screen `foo` → **immediate launch crash**.
2. For a flow folder, use `foo/_layout.tsx` + `foo/index.tsx` (+ child screens). Put redirects in `index`, not a sibling `foo.tsx`.
3. Parent `Stack.Screen name="foo"` refers to the **folder group**, not a leaf screen, when `foo/_layout.tsx` exists.
4. Before every release APK: `cd apps/mobile && npm run check:routes` (also runs inside `scripts/build-apk-pain-pilot.sh`).

```text
❌ app/(client)/intake.tsx + app/(client)/intake/_layout.tsx
✅ app/(client)/intake/_layout.tsx + index.tsx + segment.tsx …
```

---

## Keyboard UX

- Shared `Screen` supports `footer` (sticky above keyboard) and `scrollToEndOnKeyboard`.
- Android: `softwareKeyboardLayoutMode: 'resize'` in `app.config.ts`, **and** `Screen` lifts `footer` by measured `keyboardHeight` (resize alone often still clips Gboard under edge-to-edge).
- Keyboard pad on footer must be applied as a live inline style — not inside `useThemedStyles` (that hook only rebuilds on theme color changes).
- Use `footer` for primary CTAs on intake segment / onebox / confirm / follow-up, login, OTP, check-ins, messages. Do not put the only submit button in the scroll body below a tall list or multiline field.
- Segment select: sticky Continue only — **no auto-advance** on tap.

---

## Builds

| Action | Command / note |
|--------|----------------|
| Pain pilot APK (local Gradle) | `bash ./scripts/build-apk-pain-pilot.sh` |
| Faster / Pixel-shaped | `PTS_ANDROID_ABI=arm64-v8a bash ./scripts/build-apk-pain-pilot.sh` |
| Install | `adb install -r dist/pts-mobile-pain-pilot.apk` |
| Verify no crash | Launch via adb monkey; confirm `pidof com.pts.mobile.painscript`; logcat for `duplicate screen` / `FATAL EXCEPTION` |
| versionCode | Bump in `app.config.ts` for each sideload that must replace Play/install |

**Do not build or install APK unless the user explicitly asks.** Finish a coherent set of mobile changes first; then build on request. Deploying web/API is separate and may still happen when the API must be live for testing.

Release builds ignore developer `.env` LAN URLs (`EXPO_NO_DOTENV=1` in gradle script) — API comes from env/script defaults or `eas.json`.

---

## Auth / roles (one APK, two trees)

OTP login is shared. Routing is by `user.role` from the API (`app/index.tsx`):

| Role | Tree | Intent |
|------|------|--------|
| `client` | `app/(client)/*` | Full client journey (intake → waiting-plan → today/program/messages) |
| `provider` | `app/(provider)/*` | Counselor mobile — **not** the web workspace; still richer than “messages only” today |

Layouts gate incorrectly-role access with redirect to login (`ClientLayout` / `ProviderLayout`). **Same APK binary** — counselor content on a client phone means a **client-route bug** (wrong copy), not that they logged into the counselor tree.

### Client copy invariant

Intake extract LLM often writes counselor third person. Client confirm must rewrite via `toClientFacingText` / never show confidence % or “the client…”. See [`INTAKE.md`](INTAKE.md).

### Incomplete intake — no premature tabs

While `!intakeComplete`, routing stays on `/(client)/intake` (then waiting-plan until plan approved). Do **not** put incomplete intake on the Today/Program tab bar. Account exit is on the intake/waiting-plan shell (`Screen` `showAccountExit` → Sign out / Delete account), not buried behind Profile tabs.

Local notifications: `syncClientNotifications` — intake nudges only until complete; program daily reminders only after plan approved.

### Your counselor (assigned only)

`GET /api/me/contacts` returns the assigned counselor’s **public** profile (name, title, credentials, bio, years, specialisations, languages, Calendly, optional `sessionJoinUrl`) — never personal email/phone. Mobile: `YourCounselorCard` on Profile / waiting-plan + `profile/counselor` detail. Counselor edits at `/provider/profile`. Live video stays external: Book via Calendly; **Join session** when counselor pastes an ephemeral room link. Not a marketplace — see `DECISIONS.md` 2026-07-16.

### Counselor mobile scope (as of Jul 2026)

**Mode:** Bridge to web Caseload + Client Chart ([`COUNSELOR_WEB.md`](COUNSELOR_WEB.md), plan [`../plans/2026-07-16-counselor-mobile-bridge.md`](../plans/2026-07-16-counselor-mobile-bridge.md)).

**Present on phone:** Queue (Caseload-lite), pending intakes + Generate Week 1 (formulation → open web), Clients directory, Messages, engagement, Week 1 plan review/approve, Layer-1 Client story snippets, read-out **playback**, deep-links to Chart `?tab=` / formulation.

**Not on phone (use web Chart):** Formulation review UI, full WeekEditor, Apply thin week drafts, Notes CRUD, About-you / field-request deep clinical tooling, holistic visibility toggles (approve releases draft as written).

Helpers: `apps/mobile/src/lib/counselorWeb.ts` (`chartUrl`, `formulationUrl`, `caseloadUrl`).

If product wants “basic only,” shrink `(provider)` further to queue summary + messages + deep-link to web.

---

## Auth / test

- OTP test mode: phone OTP `123456` when `OTP_TEST_MODE` on API.
- Seed/pilot phones: see `PILOT_TODO.md` Test accounts and `TEST_CREDENTIALS_AND_LINKS.md`.
- Do not commit `.env` / `.env.local`. Share env **names** via `.env.example`; secrets via 1Password / Vercel.

---

## Debugging launch crashes

```bash
adb logcat -c
adb shell am force-stop com.pts.mobile.painscript
adb shell monkey -p com.pts.mobile.painscript -c android.intent.category.LAUNCHER 1
# then:
adb logcat -d | rg -i 'FATAL|duplicate screen|ReactNativeJS'
```
