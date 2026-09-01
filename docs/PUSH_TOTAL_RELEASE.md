# PUSH TOTAL — Release Candidate Checklist

## Product status
Target: iOS App Store public release after TestFlight validation.
Current TestFlight build: #12 (staging / STORE / preview OTA channel).

## Code / build checks
- [x] TypeScript check passes.
- [x] Expo Doctor passes.
- [x] Expo config check passes.
- [x] TestFlight build #12 is VALID in App Store Connect.
- [x] Internal tester is assigned to build #12.
- [x] Motion permission description is configured in iOS metadata.
- [x] Privacy manifest declares no tracking and no collected-data categories for the current architecture.
- [x] Pocket Count keeps the session awake while counting.
- [x] Unrestricted manual push-up entry is removed.
- [ ] Physical iPhone test confirms local records survive app restart.
- [ ] Physical iPhone test confirms delete/export behavior.
- [ ] Physical iPhone test confirms large lifetime totals do not clip.

## Current Pocket Count UX
1. User taps Pocket Count.
2. First 5 seconds: place iPhone fully in a front pants pocket.
3. Next 5 seconds: get into and hold the push-up start position.
4. Start sound + strong haptic signals measurement start.
5. Motion sensor estimates repetitive push-up movement.
6. Five seconds without repetitive movement ends the set automatically.
7. User verifies the detected count and may adjust only within ±10 before saving.

## Sensor validation before public submission
Do not describe Pocket Count as highly accurate until real-device validation is complete.

Minimum quick test:
- 30 real sets total.
- Include 10, 15 and 20 rep sets.
- Include slow / normal / fast cadence.
- Test at least two practical front-pocket positions.
- Record actual count and detected count.
- Track exact-count rate and mean absolute error.

Decision rule:
- Good accuracy: keep Pocket Count as the primary CTA.
- Moderate accuracy: consider `Pocket Count · Beta` in store copy and keep the pre-save correction explanation prominent.
- Poor accuracy: do not ship publicly until the sensor algorithm is improved. Do not reintroduce unrestricted manual logging just to bypass measurement quality.

## App privacy / metadata
Current architecture assumption: no account, analytics, ads, cloud sync, or back-end collection.

- [x] Privacy policy source exists in `PRIVACY.md`.
- [x] Web privacy page source exists in `docs/privacy.html`.
- [x] Web support page source exists in `docs/support.html`.
- [x] App Store copy is aligned with the current no-manual-entry Pocket Count flow.
- [x] App Review notes include exact reviewer test instructions.
- [ ] Privacy policy has a public HTTPS URL.
- [ ] Support page has a public HTTPS URL and a usable developer contact method.
- [ ] App Store Connect App Privacy answers match the current architecture.
- [ ] Age rating questionnaire is completed.
- [ ] Final screenshots are uploaded.

## Screenshot story
1. Lifetime total — `평생 한 푸쉬업, 하나의 숫자로.`
2. Brick wall — `100개마다 벽돌 하나.`
3. Pocket setup — `5초 넣고, 5초 자세 잡기.`
4. Live count — `주머니 속에서 자동으로 세기.`
5. Verification — `5초 멈추면 세트 종료.`
6. History — `오늘·이번 주·평생을 한눈에.`

## Final public binary
Build #12 is a staging binary that listens to the `preview` OTA channel. Do not use it as the public production binary.

Before public submission:
- [ ] Finish physical-device sensor validation.
- [ ] Bump app/runtime version when final native runtime is frozen.
- [ ] Build with the `production` profile / `production` update channel.
- [ ] Upload the final production build to App Store Connect.
- [ ] Attach the production build to the App Store version and submit for review.
