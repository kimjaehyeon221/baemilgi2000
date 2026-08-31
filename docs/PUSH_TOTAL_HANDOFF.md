# PUSH TOTAL — Pre-release handoff

The release-candidate branch is `push-total-rc`.

## What is already done
- Release UI/UX and Pocket Count sensor flow
- Local persistence, manual fallback, edit/delete/export
- Motion permission + privacy manifest
- Expo SDK 57 / React Native 0.86.3 dependency alignment
- EAS project created and linked: `@magpie221/push-total`
- EAS project ID persisted in `app.json`
- TypeScript / Expo Doctor / Expo config CI validation
- App Store copy draft, privacy policy, support page, sensor test plan

## One-time step that still requires the developer interactively
The new iOS bundle ID does not yet have Apple signing credentials/provisioning suitable for builds. Do **not** put an Apple password into GitHub or chat.

From a local checkout of `push-total-rc`, run:

```bash
git checkout push-total-rc
git pull
npm install
npx eas-cli@latest build --platform ios --profile preview
```

Follow the EAS/Apple prompts directly in the terminal. Allow EAS to create/manage the required Apple credentials and register the test iPhone if prompted.

After that one-time setup, non-interactive GitHub/EAS builds can be retried.

## Immediately after installing preview
Run the test in `docs/PUSH_TOTAL_QUICK_TEST.md` before treating Pocket Count as production-ready.

Most important checks:
1. 3 × 10 normal push-ups.
2. Slow / normal / fast sets.
3. Walking, stairs and sit/stand false positives.
4. If stable but biased, adjust sensitivity.
5. If inconsistent, redesign the detector rather than hiding error with sensitivity.

## App Store blockers after sensor validation
- Publicly host `docs/privacy.html` and `docs/support.html` and paste those URLs into App Store Connect.
- Capture App Store screenshots following `docs/PUSH_TOTAL_APP_STORE_COPY.md`.
- Complete the age-rating questionnaire and app privacy declaration.
- Run an interactive production build once if Apple production credentials were not created during preview setup.
- Upload the production archive to App Store Connect and review metadata before submission.

## Current privacy declaration assumption
If no analytics, ads, account system, cloud backend, or additional data-collecting SDK is added before release, the intended App Store privacy answer is that the app does not collect data. Motion samples are processed live on-device and raw samples are not retained or uploaded.
