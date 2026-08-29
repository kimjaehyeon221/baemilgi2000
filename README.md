# 배밀기 2000

200개의 Quest를 따라 배밀기 기록을 늘려가는 iPhone 앱입니다.

## 개발 방식

- **원본 코드:** 이 GitHub 저장소
- **iOS:** Expo / React Native
- **배포:** EAS Build → TestFlight → App Store
- **일상 수정:** `main`에 반영되면 EAS Update로 production 채널에 OTA 업데이트

한 번 TestFlight 빌드를 설치한 뒤에는 JavaScript/UI/문구/이미지 변경 대부분을 앱 재설치 없이 받을 수 있습니다. 네이티브 라이브러리, Expo SDK, iOS 권한, 앱 아이콘 등 native runtime이 바뀌면 새 TestFlight 빌드가 필요합니다.

## 최초 1회 설정

1. Expo 계정 생성/로그인
2. `npx eas-cli@latest init`
3. `npx eas-cli@latest update:configure`
4. Expo 프로젝트 설정에서 이 GitHub 저장소 연결
5. Apple Developer 자격 증명 구성 후 `.eas/workflows/submit-ios.yml` 실행

`eas update:configure`가 `app.json`에 `updates.url`과 `extra.eas.projectId`를 추가합니다. 이 값은 Expo 프로젝트를 만든 뒤에만 알 수 있으므로 저장소 초기 업로드에는 포함하지 않습니다.

## 제품 원칙

- 카메라 없음
- 템포 강제 없음
- 기록은 자기 신고
- 배밀기 공식 복귀는 **팔을 편 채 엉덩이를 뒤·위로**
- 2,000은 의학적 권장량이 아니라 역사적 Dand 고반복 기록에서 가져온 Final Quest
