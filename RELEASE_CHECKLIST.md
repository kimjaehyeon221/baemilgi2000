# iOS 배포 체크리스트

## 제품
- [x] 카메라 제거
- [x] 템포 강제 제거
- [x] 공식 자세 기준 확정
- [x] 자동 푸쉬업 환산 제거
- [x] 목표 없는 첫 기록 직접 측정
- [x] 빈 입력 자동값 제거
- [x] 200 Quest
- [x] 높은 레벨 성공 시 하위 자동 완료
- [x] 로컬 기록 자동 저장 상태 표시
- [x] 기록 백업 및 복원
- [x] EAS production / OTA workflow 준비 — TestFlight build 10 runtime 대상

## 제출 전
- [x] Expo 프로젝트 및 GitHub 연결
- [x] projectId / updates.url 설정
- [x] Apple Developer Program 활성
- [x] Production iOS build 성공 — 1.0.0 (10)
- [x] App Store Connect 업로드 성공
- [ ] 실제 iPhone 핵심 흐름 회귀 테스트
- [ ] 개인정보 처리방침 / 지원 URL 공개 전환 — 현재 Vercel 로그인으로 리디렉션됨
- [ ] App Store 스크린샷 제작
- [ ] App Privacy 입력
- [ ] App Review 제출

## 실기기 핵심 흐름
- [ ] 초보자 → 자세 → 직접 측정 → 0개 기록
- [ ] 초보자 → 직접 측정 → 1개 이상 기록 → 다음 Quest
- [ ] 경험자 → 빈 입력 차단 → 기록 입력 → 시작
- [ ] Quest 성공/실패 → 기록 저장 → 앱 재실행 후 유지
- [ ] 훈련 완료 → 기록 저장
- [ ] 기록 수정/삭제 후 진행도 재계산
- [ ] 백업 내보내기 및 복원
- [ ] 앱 완전 종료 후 OTA 업데이트 적용
