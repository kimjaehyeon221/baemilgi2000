# Codex instructions for baemilgi2000

## Role
Act as the primary implementation and QA agent for this repository. Prefer fixing issues directly, running commands/tests, and reporting evidence over asking the user to manually inspect intermediate steps.

## Product constraints
- App name: 배밀기 2000.
- Core loop: Quest -> Training if needed -> Quest Clear -> Next Quest.
- Official rep style is traditional Dand/Hindu push-up: hips high -> chest dives forward near floor -> arms/chest extend up -> keep arms straight and push hips back/up -> return to start.
- No camera, pose detection, auto counting, AI form score, leaderboard, coins, XP, confetti, or mandatory tempo in V1.
- Progress never goes backward. Clearing a higher Quest auto-clears lower levels.
- 2,000 is a historical Final Quest reference, not a medical recommendation.
- Records must never be silently discarded.
- Preserve the current dark dojo-ledger visual direction unless a task explicitly requests redesign.

## Engineering priorities
1. Build blockers and crashes.
2. Data loss/corruption and persistence bugs.
3. Broken onboarding / Quest / Training / Clear flows.
4. Dependency and Expo/EAS compatibility.
5. Accessibility and obvious UX defects.
6. Cosmetic cleanup last.

## Required validation loop
Before declaring a task complete, run as much of this as the environment supports and fix failures:

```bash
npm ci
npx expo-doctor
npx expo export --platform ios
rm -rf ios
npx expo prebuild --platform ios --no-install
```

If `expo prebuild` modifies package files, restore or intentionally commit only changes that are required. Do not commit generated `ios/` unless there is a specific reason.

For iOS build issues, inspect the exact EAS phase named in the failure. Do not assume an icon problem or dependency problem without evidence from logs.

## Current release issue
The most recent EAS production build passed Apple credential setup and upload, but failed in the `Configure Xcode project` build phase with an unknown error. Previous `Prebuild` failures caused by a corrupted PNG icon were fixed locally and `npx expo prebuild --platform ios --no-install` now completes successfully.

Latest failed EAS Build ID known from the user session:
`03ecdf3a-6026-4b71-9ae1-823fdc0487f2`

Goal: inspect the Configure Xcode project failure, reproduce/fix it, rerun local validation, and leave the repository in a state that should pass a production iOS EAS build.

## Safety / release boundaries
- Do not change bundle identifier, Apple team, EAS project ID, privacy policy, tracking behavior, native permissions, payments, or authentication unless the task explicitly requires it.
- Do not expose or request Apple passwords, 2FA codes, private keys, or secrets.
- Prefer a focused fix over broad rewrites during release stabilization.

## Reporting
At completion, report:
- root cause,
- files changed,
- commands/tests run and their results,
- anything that still requires the user's Apple/EAS interactive credentials,
- whether it is safe to run `npx testflight` again.
