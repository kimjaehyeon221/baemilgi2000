# PUSH TOTAL Asset Update Guide

## Why assets live in GitHub

PUSH TOTAL의 앱 내 이미지, 온보딩 일러스트, 인트로 그래픽, 사운드는 코드와 함께 GitHub에서 버전 관리한다. 이렇게 하면 어떤 앱 버전에서 어떤 이미지가 사용됐는지 추적하고, 문제가 생기면 이전 버전으로 되돌리기 쉽다.

## Recommended paths

- `assets/icon.png` — iOS 앱 아이콘. 네이티브 자산이므로 변경 후 새 iOS binary/build가 필요하다.
- `assets/onboarding/` — 온보딩용 PNG/SVG/WebP 등 앱 내부 이미지.
- `assets/intro/` — 앱 시작 후 재생되는 인트로 애니메이션용 이미지/프레임/벡터 자산.
- `assets/audio/` — 앞으로 추가되는 효과음. 현재 기존 사운드 경로는 호환성을 위해 유지할 수 있다.

실제 자산이 생길 때 위 폴더를 만들고 파일을 커밋한다. 빈 폴더만 미리 만들지는 않는다.

## Update rules

1. 파일 이름은 역할 중심으로 고정한다. 예: `brick-wall.png`, `pocket-phone.png`, `intro-fist.png`.
2. 같은 역할의 디자인을 교체할 때 가능하면 기존 경로를 유지한다. 코드 수정량과 실수를 줄일 수 있다.
3. 앱 안에서 쓰는 이미지/애니메이션 자산은 GitHub에 같이 커밋한다.
4. 큰 원본 디자인 파일(PSD, 대형 영상, 다수의 고해상도 원본)은 저장소를 무겁게 만들 수 있으므로 Figma/원본 저장소 또는 Git LFS를 사용하고, 앱에 실제 포함되는 export 파일은 GitHub에 둔다.
5. `assets/icon.png` 변경은 OTA 대상에서 제외한다. 아이콘 변경 시 새 iOS build를 만든다.
6. 일반 앱 내부 이미지와 JS/UI 변경은 현재 preview OTA 워크플로 범위에 포함될 수 있으므로, 네이티브 설정 변경이 없다면 새 binary 없이 테스트할 수 있다.

## Visual direction

Current direction: **Flat Industrial / Masonry**

- warm ivory background
- brick red masonry
- strong black typography
- minimal industrial graphics
- avoid glossy 3D, stock-fitness imagery, and game-ad aesthetics

이 문서는 디자인 자산이 추가될 때마다 경로와 역할을 업데이트한다.
