# 배밀기 2000 — App Store Connect 웹 전용 최종 항목

현재 공개 App Store Connect API/asc 검증 결과: **blocking 0 / warnings 0**.

아래 항목은 Apple 웹 포털 세션에서만 최종 저장/게시할 수 있다.

## 1. App Privacy

배밀기 2000은 `expo-updates` / EAS Update를 사용하므로 `No, we do not collect data`로 두지 않는다.

권장 선언:
- Do you or your third-party partners collect data from this app? **Yes**
- Data Type: **Diagnostics → Crash Data**
- Purposes: **App Functionality**, **Analytics**
- Linked to the user's identity: **No**
- Used for tracking: **No**
- 완료 후 오른쪽 상단 **Publish**까지 실행

근거:
- 앱에는 계정/광고/추적/HealthKit/분석 SDK가 없다.
- 운동 횟수와 훈련 기록은 AsyncStorage에 로컬 저장된다.
- Expo는 EAS Update 사용 시 App Store Privacy에서 데이터 수집 Yes 및 Crash Data 선택을 안내한다.
- Expo EAS Update 요청은 OS, 프로젝트 정보, 무작위 업데이트 요청 토큰 및 서비스 안정성을 위한 제한된 기술 정보를 처리할 수 있다.

## 2. App Store Regulations & Permits — Regulated Medical Device

**No**

근거:
- 단순 운동 반복/퀘스트 기록 앱이다.
- 질병 또는 생리적 상태의 진단, 예방, 모니터링, 치료 기능이 없다.
- HealthKit/건강 기록/의료기기 하드웨어를 사용하지 않는다.

App Information → App Store Regulations & Permits → Declare Regulated Medical Device → **No** → Save.

## 3. Personal Services declaration (표시되는 경우)

**No**

배밀기 2000은 사용자 요청에 따라 개인이 시간/업무 기반 서비스를 제공하도록 중개하는 앱이 아니다. 트레이너 매칭, 배달, 운송, 과외, 전문가 서비스 등의 개인 서비스를 판매하거나 중개하지 않는다.

## 4. EU DSA Trader Status

이 항목은 개발자 본인의 법적 자기선언이므로 자동 선택하지 않는다.

Apple의 기준: trade, business, craft, profession과 관련된 목적으로 행동하는 자연인/법인이 trader에 해당할 수 있다. 개인 취미 프로젝트인지, 사업/직업 활동의 일부인지에 따라 개발자가 직접 판단해야 한다.

## 5. 제출 전 상태

- App version 1.0: PREPARE_FOR_SUBMISSION
- Build 10: VALID
- Screenshots: 4 COMPLETE
- App Availability: configured worldwide; new territories automatically included
- Public API submission blockers: 0
- Review draft exists: READY_FOR_REVIEW, not submitted

App Privacy Publish + web-only Regulations/Permits + DSA declaration을 완료하고 실제 TestFlight UI를 마지막으로 확인한 뒤 Submit for Review.
