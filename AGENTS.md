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

## Current release status
- The earlier `Configure Xcode project` failure was resolved by using an ASCII native target name in commit `238309c68d4b408b870b5d9266ee46382c91f53f`.
- Production iOS EAS build `a4544ec9-3c97-49ba-8297-f50312f17838` finished successfully as version `1.0.0 (5)`.
- App Store Connect submission `c8e04c28-7425-4abf-9fef-33b432ba225d` finished successfully.
- Remaining release work is real-device regression testing, App Store screenshots/privacy metadata, and App Review submission state confirmation.

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
