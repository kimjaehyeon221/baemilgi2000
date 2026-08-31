# PUSH TOTAL — Release Candidate Checklist

## Product status
Target: iOS App Store release candidate, version 0.9.0.

## Code / device checks
- [ ] `npm run typecheck` passes.
- [ ] `npm run doctor` passes.
- [ ] Release build launches on a physical iPhone.
- [ ] Motion permission prompt appears only after Pocket Count is tapped.
- [ ] Pocket Count works with screen kept awake.
- [ ] Manual logging works when motion permission is denied.
- [ ] Local records survive app restart.
- [ ] Edit/delete/export work.
- [ ] Large lifetime totals do not clip.
- [ ] iOS 26 Liquid Glass renders correctly.
- [ ] Older supported iOS version uses the fallback surface correctly.

## Sensor validation before submission
Do not describe Pocket Count as highly accurate until validated.

Minimum quick test:
- 30 real sets total.
- Include 10, 15, 20 rep sets.
- Include slow / normal / fast cadence.
- Test at least two front-pocket positions if practical.
- Record detected count and actual count.
- Track exact-count rate and mean absolute error.

Decision:
- Good accuracy: keep Pocket Count as primary CTA.
- Moderate accuracy: label `Pocket Count · Beta` in App Store copy and keep editing prominent.
- Poor accuracy: make manual logging primary for v1 and continue sensor tuning after launch.

## Apple requirements noted for 2026
- App Store uploads require iOS 26 SDK / Xcode 26 or later.
- App must be complete, useful, stable, and have working metadata/URLs.
- Privacy policy URL is required for iOS apps.
- Privacy policy must also be easily accessible inside the app.
- App Privacy response for current design: `No, we do not collect data from this app`, assuming no analytics/ads/back-end SDK is added before submission.

## App Store metadata draft
**Name:** PUSH TOTAL

**Subtitle:** 푸쉬업을 위한 만보기

**Promotional idea:** 폰을 앞주머니에 넣고 푸쉬업하세요. 한 세트가 끝날 때마다 평생 누적 숫자가 올라갑니다.

**Keywords (KR):** 푸쉬업,팔굽혀펴기,운동,카운터,피트니스,홈트,기록

**Category:** Health & Fitness

**Price:** Free

**Data collection:** None (current architecture)

## Review notes draft
PUSH TOTAL counts repetitive push-up motion using the iPhone motion sensor while the device is placed in a front pants pocket. Motion samples are processed live on-device and are not uploaded or retained. The user can manually correct any estimated count. Manual logging remains fully usable if motion permission is declined.

## Required outside the binary before App Review
- [ ] Public privacy policy URL
- [ ] App Store screenshots
- [ ] App Store Connect app record / bundle ID match
- [ ] Updated age rating questionnaire
- [ ] Physical-device sensor validation
- [ ] Production EAS build
- [ ] Final archive uploaded to App Store Connect

## Commands for the final build step
```bash
npm install
npm run typecheck
npm run doctor
npx eas-cli@latest build --platform ios --profile production
```

Submission (only after reviewing the build in App Store Connect):
```bash
npx eas-cli@latest submit --platform ios --profile production
```
