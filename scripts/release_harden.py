from pathlib import Path


def replace_required(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'{label} not found')
    return text.replace(old, new)


core = Path('src/core.ts')
s = core.read_text()
s = s.replace(
    "export const GAMA_SOURCE_URL = 'https://commons.wikimedia.org/wiki/File:Dand,_Dund,_Hindu_push-up,_Figures_1_and_2.jpg';",
    "export const GAMA_SOURCE_URL = 'https://simplexstrong.com/2020/03/what-makes-the-oriental-strong-the-indian-dands-1911/';",
)
s = s.replace(
    "export const PRIVACY_URL = 'https://baemilgi2000-upendjh-6028s-projects.vercel.app/privacy';",
    "export const PRIVACY_URL = 'https://baemilgi2000-upendjh-6028s-projects.vercel.app/privacy.html';",
)
s = s.replace(
    "export const SUPPORT_URL = 'https://baemilgi2000-upendjh-6028s-projects.vercel.app/support';",
    "export const SUPPORT_URL = 'https://baemilgi2000-upendjh-6028s-projects.vercel.app/support.html';",
)
core.write_text(s)

app = Path('App.tsx')
s = app.read_text()
s = s.replace('formatVersion: 2,', 'formatVersion: 3,')

old_restore = """  const restoreRecords = async () => {
    try {
      const parsed = JSON.parse(restoreText.trim());
      const candidate = parsed?.state ?? parsed;
      const restored = safeState(candidate);
      if (!restored.onboarded) throw new Error('invalid backup');
      Alert.alert('이 백업으로 교체할까?', '현재 이 iPhone의 기록은 백업 내용으로 교체돼.', [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          onPress: async () => {
            const saved = await commit(restored);
            if (saved) {
              setRestoreText('');
              setRestoreOpen(false);
              setInfoOpen(false);
              setMessage('기록을 복원했어.');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('백업을 읽을 수 없어', '배밀기 2000에서 내보낸 JSON 전체를 그대로 붙여넣어줘.');
    }
  };"""
new_restore = """  const restoreRecords = async () => {
    try {
      const parsed = JSON.parse(restoreText.trim());
      const wrapped = Boolean(
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        Object.prototype.hasOwnProperty.call(parsed, 'state'),
      );

      if (wrapped) {
        if (parsed.app !== '배밀기 2000') throw new Error('wrong app backup');
        const formatVersion = Number(parsed.formatVersion);
        if (!Number.isInteger(formatVersion) || formatVersion < 1 || formatVersion > 3) {
          throw new Error('unsupported backup version');
        }
      }

      const candidate = wrapped ? parsed.state : parsed;
      if (
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate) ||
        candidate.onboarded !== true ||
        !Array.isArray(candidate.sessions)
      ) {
        throw new Error('invalid backup shape');
      }

      const restored = safeState(candidate);
      if (!restored.onboarded) throw new Error('invalid backup');
      Alert.alert('이 백업으로 교체할까?', '현재 이 iPhone의 기록은 백업 내용으로 교체돼.', [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          onPress: async () => {
            const saved = await commit(restored);
            if (saved) {
              setRestoreText('');
              setRestoreOpen(false);
              setInfoOpen(false);
              setMessage('기록을 복원했어.');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('백업을 읽을 수 없어', '배밀기 2000에서 내보낸 JSON 전체를 그대로 붙여넣어줘.');
    }
  };"""
s = replace_required(s, old_restore, new_restore, 'restore block')

old_reset = """        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setInfoOpen(false);
          setState(initialState);
        },"""
new_reset = """        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setInfoOpen(false);
            setSaveStatus('saved');
            setState(initialState);
          } catch {
            Alert.alert('기록을 지우지 못했어', '기존 기록을 유지했어. 저장 공간을 확인한 뒤 다시 시도해줘.');
          }
        },"""
s = replace_required(s, old_reset, new_reset, 'reset block')
app.write_text(s)

onboarding = Path('src/Onboarding.tsx')
s = onboarding.read_text()
s = s.replace(
    "import React, { useEffect, useState } from 'react';",
    "import React, { useEffect, useRef, useState } from 'react';",
)
old_timer = """function CalibrationTest({ onCancel, onFinish }: { onCancel: () => void; onFinish: () => void }) {
  useKeepAwake();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);"""
new_timer = """function CalibrationTest({ onCancel, onFinish }: { onCancel: () => void; onFinish: () => void }) {
  useKeepAwake();
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    const sync = () => setSeconds(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, []);"""
s = replace_required(s, old_timer, new_timer, 'baseline timer block')
onboarding.write_text(s)

doc = Path('docs/APP_STORE_RELEASE.md')
s = doc.read_text()
s = s.replace(
    '공개 지원 페이지 배포 후 입력한다.',
    'https://baemilgi2000-upendjh-6028s-projects.vercel.app/support.html',
)
s = s.replace(
    '공개 지원 페이지에 표시할 연락 이메일을 확정한 뒤 입력합니다.',
    '문의: kjh967221@gmail.com',
)
marker = '### 마케팅 URL\n\n선택 사항. 1.0에서는 비워 둔다.\n'
if marker in s and '### 개인정보 처리방침 URL' not in s:
    s = s.replace(
        marker,
        marker + '\n### 개인정보 처리방침 URL\n\nhttps://baemilgi2000-upendjh-6028s-projects.vercel.app/privacy.html\n',
    )
doc.write_text(s)
