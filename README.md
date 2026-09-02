# 배밀기 2000

**1개부터 2,000개까지, 200개의 Quest로 배밀기를 이어가는 iPhone 앱입니다.**

배밀기(Hindu push-up)는 한 번에 큰 목표를 잡으면 시작하기 어렵습니다. 배밀기 2000은 목표를 200개의 작은 Quest로 쪼개고, 현재 수준에서 다음 도전을 계속 이어갈 수 있도록 만든 단일 운동 기록 앱입니다.

> **Concept**  
> 큰 운동 목표를 작은 관문으로 바꾸면 더 오래 이어갈 수 있을까?

## What it does

- 1개부터 시작하는 **200개의 Quest**
- 경험자는 현재 수준에 맞는 Quest부터 시작
- 높은 레벨을 성공하면 아래 단계도 함께 완료
- 아직 어렵다면 현재 레벨에 맞는 보조 훈련 제공
- 배밀기 자세 가이드
- 운동 기록과 성장 과정 저장
- 계정·광고 없이 기기 중심으로 사용
- 기록 백업 및 복원

## Product idea

단순히 오늘 몇 개 했는지 세는 운동 앱보다, **‘다음 관문을 하나씩 통과한다’는 감각**을 만들고 싶었습니다. 주짓수의 띠처럼 단계가 쌓이는 시각 언어와 Quest 구조를 이용해 반복 운동을 하나의 장기적인 도전으로 바꾸는 것이 핵심입니다.

## Status

**iOS · App Store 배포**

## Tech

- React Native / Expo
- EAS Build / EAS Update
- Local-first workout records

## Product principles

- 카메라 없이 사용
- 템포를 강제하지 않음
- 사용자의 자기 기록을 신뢰
- 2,000은 의학적 권장량이 아니라 오래된 Dand 고반복 훈련 기록에서 가져온 Final Quest

## Screenshots

App Store에 사용한 실제 제품 스크린샷을 이 섹션에 추가해, 처음 보는 사람도 `Quest 선택 → 운동 → 완료 → 성장 확인` 흐름을 한눈에 이해할 수 있도록 정리할 예정입니다.

## Development

- 원본 코드: 이 저장소
- iOS: Expo / React Native
- 배포: EAS Build → TestFlight → App Store
- 일상적인 JS/UI 변경: EAS Update production 채널
