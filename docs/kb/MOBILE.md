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
- Android: `softwareKeyboardLayoutMode: 'resize'` in `app.config.ts`.
- Use `footer` for primary CTAs on multiline forms (intake onebox, check-ins, messages composer). Do not put the only submit button below a tall multiline field without a footer/KAV.

---

## Builds

| Action | Command / note |
|--------|----------------|
| Pain pilot APK (local Gradle) | `bash ./scripts/build-apk-pain-pilot.sh` |
| Faster / Pixel-shaped | `PTS_ANDROID_ABI=arm64-v8a bash ./scripts/build-apk-pain-pilot.sh` |
| Install | `adb install -r dist/pts-mobile-pain-pilot.apk` |
| Verify no crash | Launch via adb monkey; confirm `pidof com.pts.mobile.painscript`; logcat for `duplicate screen` / `FATAL EXCEPTION` |
| versionCode | Bump in `app.config.ts` for each sideload that must replace Play/install |

Release builds ignore developer `.env` LAN URLs (`EXPO_NO_DOTENV=1` in gradle script) — API comes from env/script defaults or `eas.json`.

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
