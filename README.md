# PUSH TOTAL

**푸쉬업을 걸음처럼 쌓는 iPhone용 ‘푸쉬업 만보기’입니다.**

푸쉬업은 하루 운동량보다도 오랫동안 쌓인 총량이 더 재미있는 기록이 될 수 있다고 생각했습니다. PUSH TOTAL은 복잡한 루틴이나 소셜 기능 대신, **평생 누적 푸쉬업이라는 하나의 숫자**에 집중합니다.

> **Concept**  
> 걸음 수처럼 푸쉬업도 자동으로 세고, 평생 누적할 수 있을까?

## Demo Video

[▶ 실제 앱 구동 영상 보기](demo/PUSH_TOTAL_Demo.mp4)

## What it does

- iPhone을 앞주머니에 넣고 시작하는 **Pocket Count**
- 기기의 동작 센서로 반복 움직임을 감지해 푸쉬업 횟수 추정
- 5초 동안 움직임이 없으면 세트 자동 종료
- 저장 전 감지 횟수를 보정한 뒤 저장
- 오늘 / 이번 주 / 이번 달 / 최근 기록 확인
- **100 PUSHES = 1 BRICK**으로 평생 누적량을 벽처럼 시각화
- 계정 없이 기기에 저장

## Product idea

많은 운동 앱은 루틴, 칼로리, 코칭, 리더보드까지 한꺼번에 제공합니다. 이 앱에서는 반대로 기능을 덜어내고, **‘오늘 한 짧은 세트도 내 평생 기록에 남는다’**는 감각만 남겼습니다. 사용자가 매번 횟수를 직접 입력하지 않도록 iPhone 동작 센서를 활용한 것도 같은 이유입니다.

## Tech

- React Native / Expo
- iPhone Motion & Fitness sensor
- EAS Build
- Local-first data storage

## Development

AI를 활용해 제품 콘셉트, 센서 기반 카운팅 흐름, UI 반복 개선과 iOS 배포 준비까지 직접 진행했습니다.
