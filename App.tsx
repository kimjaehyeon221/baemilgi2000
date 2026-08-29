import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import {
  AppState,
  GAMA_SOURCE_URL,
  PRIVACY_URL,
  STORAGE_KEY,
  SUPPORT_URL,
  initialState,
  recomputeProgress,
  safeState,
  targetForLevel,
} from './src/core';
import { styles } from './src/styles';
import { Button, FormStep, Header } from './src/ui';
import { Onboarding } from './src/Onboarding';
import { Challenge, Training } from './src/Workout';

export default function App() {
  const { isUpdatePending } = Updates.useUpdates();
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState<'home' | 'quests' | 'records'>('home');
  const [infoOpen, setInfoOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [challengeLevel, setChallengeLevel] = useState<number | null>(null);
  const [trainingLevel, setTrainingLevel] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isUpdatePending) Updates.reloadAsync().catch(() => {});
  }, [isUpdatePending]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setState(raw ? safeState(JSON.parse(raw)) : initialState))
      .catch(() => {
        Alert.alert('기록을 읽지 못했어', '기존 기록을 덮어쓰지 않도록 앱을 다시 실행해줘.');
        setState(initialState);
      });
  }, []);

  const commit = async (next: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
      return true;
    } catch {
      Alert.alert('기록 저장 실패', '이 기기에 기록을 저장하지 못했어. 저장 공간을 확인한 뒤 다시 시도해줘.');
      return false;
    }
  };

  if (!state) return <SafeAreaView style={styles.root} />;
  if (!state.onboarded) return <Onboarding onDone={commit} />;

  if (challengeLevel !== null) {
    return (
      <Challenge
        level={challengeLevel}
        onCancel={() => setChallengeLevel(null)}
        onFinish={async (success, seconds, actualReps) => {
          const old = state.clearedLevel;
          const clearedLevel = success ? Math.max(old, challengeLevel) : old;
          const next = {
            ...state,
            clearedLevel,
            selectedLevel: success
              ? Math.min(200, Math.max(clearedLevel + 1, state.selectedLevel))
              : state.selectedLevel,
            sessions: [
              ...state.sessions,
              {
                at: new Date().toISOString(),
                type: 'challenge' as const,
                level: challengeLevel,
                target: targetForLevel(challengeLevel),
                success,
                seconds,
                actualReps,
              },
            ],
          };
          const saved = await commit(next);
          setChallengeLevel(null);
          if (!saved) return;
          if (success && clearedLevel >= 200) setMessage('2,000. Final Quest를 완료했어.');
          else if (success && targetForLevel(old || 1) < 500 && targetForLevel(clearedLevel || 1) >= 500) {
            setMessage('500. 여기까지 와도 충분해. 마지막은 2,000이야.');
          } else if (success) {
            setMessage(`LEVEL ${challengeLevel} CLEAR. 아래 레벨도 모두 완료됐어.`);
          } else {
            setMessage(`LEVEL ${challengeLevel} · ${actualReps}개에서 종료. 다음 기록의 기준으로 남겼어.`);
          }
        }}
      />
    );
  }

  if (trainingLevel !== null) {
    const currentBest = state.clearedLevel > 0 ? targetForLevel(state.clearedLevel) : 0;
    return (
      <Training
        level={trainingLevel}
        currentBest={currentBest}
        onCancel={() => setTrainingLevel(null)}
        onFinish={async (seconds) => {
          const saved = await commit({
            ...state,
            sessions: [
              ...state.sessions,
              {
                at: new Date().toISOString(),
                type: 'training',
                level: trainingLevel,
                target: targetForLevel(trainingLevel),
                success: true,
                seconds,
              },
            ],
          });
          setTrainingLevel(null);
          if (saved) setMessage('훈련 완료. 준비됐다고 느껴질 때 Quest에 도전해.');
        }}
      />
    );
  }

  const nextLevel = state.clearedLevel >= 200 ? 200 : Math.max(state.clearedLevel + 1, state.selectedLevel);
  const nextTarget = targetForLevel(nextLevel);
  const currentReps = state.clearedLevel > 0 ? targetForLevel(state.clearedLevel) : 0;
  const history = state.sessions
    .map((session, index) => ({ session, index }))
    .reverse()
    .slice(0, 30);

  const exportRecords = async () => {
    const payload = {
      app: '배밀기 2000',
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      state,
    };
    try {
      await Share.share({ title: '배밀기 2000 백업', message: JSON.stringify(payload, null, 2) });
    } catch {
      Alert.alert('내보내기 실패', '잠시 후 다시 시도해줘.');
    }
  };

  const restoreRecords = async () => {
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
  };

  const saveEditedSession = async (index: number, patch: Partial<AppState['sessions'][number]>) => {
    const sessions = [...state.sessions];
    sessions[index] = { ...sessions[index], ...patch };
    await commit(recomputeProgress({ ...state, sessions }));
  };

  const deleteSession = (index: number) => {
    Alert.alert('이 기록을 삭제할까?', '진행 레벨도 남아 있는 성공 기록을 기준으로 다시 계산돼.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const sessions = state.sessions.filter((_, i) => i !== index);
          await commit(recomputeProgress({ ...state, sessions }));
        },
      },
    ]);
  };

  const promptFailureReps = (index: number) => {
    const session = state.sessions[index];
    Alert.prompt(
      '실패 기록 수정',
      `LEVEL ${session.level}에서 몇 개까지 성공했어?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '저장',
          onPress: (value) => {
            const actualReps = Math.max(0, Math.floor(Number(value) || 0));
            saveEditedSession(index, { success: false, actualReps });
          },
        },
      ],
      'plain-text',
      String(session.actualReps ?? 0),
      'number-pad',
    );
  };

  const editSession = (index: number) => {
    const session = state.sessions[index];
    if (session.type === 'training') {
      Alert.alert(`LEVEL ${session.level} 훈련`, '잘못 저장한 기록이라면 삭제할 수 있어.', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => deleteSession(index) },
      ]);
      return;
    }

    Alert.alert(
      `LEVEL ${session.level} 기록 편집`,
      session.success ? '현재 CLEAR로 기록돼 있어.' : `현재 ${session.actualReps ?? 0}개에서 실패로 기록돼 있어.`,
      [
        { text: '취소', style: 'cancel' },
        session.success
          ? { text: '실패로 수정', onPress: () => promptFailureReps(index) }
          : { text: '성공으로 수정', onPress: () => saveEditedSession(index, { success: true, actualReps: session.target }) },
        ...(!session.success ? [{ text: '횟수 수정', onPress: () => promptFailureReps(index) }] : []),
        { text: '기록 삭제', style: 'destructive' as const, onPress: () => deleteSession(index) },
      ],
    );
  };

  const editStartingRecord = () => {
    Alert.prompt(
      '시작 기록 수정',
      '처음 입력한 배밀기 최고 기록을 수정해. 0을 입력하면 시작 기록을 비워둘게.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '저장',
          onPress: async (value) => {
            const reps = Math.max(0, Math.floor(Number(value) || 0));
            await commit(recomputeProgress({ ...state, firstBaemilgiMax: reps > 0 ? reps : null }));
          },
        },
      ],
      'plain-text',
      String(state.firstBaemilgiMax ?? 0),
      'number-pad',
    );
  };

  const reset = () => Alert.alert(
    '기록을 모두 지울까?',
    '이 기기에 저장된 진행 기록이 모두 삭제돼. 먼저 기록을 내보낼 수 있어.',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setInfoOpen(false);
          setState(initialState);
        },
      },
    ],
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Header onInfo={() => setInfoOpen(true)} />

      {tab === 'home' && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.kicker}>CURRENT</Text>
          <Text style={styles.heroLevel}>LEVEL {state.clearedLevel}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${state.clearedLevel / 2}%` }]} />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.mutedSmall}>{state.clearedLevel} / 200 QUEST</Text>
            <Text style={styles.mutedSmall}>현재 최고 {currentReps}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.kicker}>NEXT QUEST</Text>
            <Text style={styles.cardLevel}>LEVEL {nextLevel}</Text>
            <Text style={styles.cardNumber}>{nextTarget}</Text>
            <Text style={styles.cardUnit}>연속 배밀기</Text>
            <Button label="도전하기" onPress={() => setChallengeLevel(nextLevel)} />
            <View style={{ height: 9 }} />
            <Button label="훈련하기" secondary onPress={() => setTrainingLevel(nextLevel)} />
          </View>

          <Pressable style={styles.linkRow} onPress={() => setTab('quests')}>
            <Text style={styles.linkText}>200개의 Quest 보기</Text>
            <Text style={styles.linkArrow}>→</Text>
          </Pressable>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기록은 스스로에게 정직하게.</Text>
            <Text style={styles.sectionBody}>완료와 실패 모두 기록해. 잘못 눌렀다면 RECORD에서 언제든 수정할 수 있어.</Text>
          </View>
        </ScrollView>
      )}

      {tab === 'quests' && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.pageTitle}>200{`\n`}QUESTS</Text>
          <Text style={styles.pageCopy}>주황색은 완료, 검정색은 다음에 고른 Quest야. 더 높은 Quest를 깨면 그 아래 레벨도 모두 완료돼.</Text>
          <View style={styles.grid}>
            {Array.from({ length: 200 }, (_, i) => i + 1).map((level) => {
              const done = level <= state.clearedLevel;
              const selected = level === state.selectedLevel && !done;
              const reps = targetForLevel(level);
              const landmark = [50, 100, 250, 500, 1000, 2000].includes(reps);
              const inverse = done || selected;
              return (
                <Pressable
                  key={level}
                  onPress={async () => {
                    if (done) setTrainingLevel(level);
                    else {
                      await commit({ ...state, selectedLevel: level });
                      setTab('home');
                    }
                  }}
                  style={[styles.cell, done && styles.cellDone, selected && styles.cellSelected, landmark && styles.cellLandmark]}
                >
                  <Text style={[styles.cellLevel, inverse && styles.cellTextInverse]}>{done ? `✓ ${level}` : level}</Text>
                  <Text style={[styles.cellReps, inverse && styles.cellTextInverse]}>{reps}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {tab === 'records' && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.pageTitle}>RECORD</Text>
          <Text style={styles.pageCopy}>성공뿐 아니라 실패 지점도 남겨. 잘못 저장한 기록은 눌러서 수정할 수 있어.</Text>
          <View style={styles.stats}>
            <Pressable style={styles.stat} onPress={editStartingRecord}>
              <Text style={styles.statLabel}>START · EDIT</Text>
              <Text style={styles.statValue}>{state.firstBaemilgiMax ?? '—'}</Text>
            </Pressable>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>CURRENT</Text>
              <Text style={styles.statValue}>{currentReps || '—'}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>QUEST</Text>
              <Text style={styles.statValue}>{state.clearedLevel}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>최근 기록</Text>
          {history.length === 0 ? (
            <Text style={styles.pageCopy}>아직 기록이 없어.</Text>
          ) : (
            history.map(({ session, index }) => (
              <Pressable key={`${session.at}-${index}`} style={styles.historyRow} onPress={() => editSession(index)}>
                <View>
                  <Text style={styles.historyMain}>
                    {session.type === 'challenge'
                      ? `LEVEL ${session.level} ${session.success ? 'CLEAR' : 'FAIL'}`
                      : `LEVEL ${session.level} TRAINING`}
                  </Text>
                  <Text style={styles.historySub}>{new Date(session.at).toLocaleDateString('ko-KR')}</Text>
                </View>
                <View>
                  <Text style={styles.historyTarget}>
                    {session.type === 'challenge' && !session.success
                      ? `${session.actualReps ?? 0} / ${session.target}`
                      : session.target}
                  </Text>
                  <Text style={styles.historyEdit}>편집</Text>
                </View>
              </Pressable>
            ))
          )}
          <View style={{ height: 22 }} />
          <Button label="전체 기록 백업" secondary onPress={exportRecords} />
        </ScrollView>
      )}

      <View style={styles.nav}>
        {(['home', 'quests', 'records'] as const).map((name) => (
          <Pressable key={name} onPress={() => setTab(name)} style={styles.navButton}>
            <Text style={[styles.navText, tab === name && styles.navTextActive]}>
              {name === 'home' ? 'HOME' : name === 'quests' ? 'QUEST' : 'RECORD'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>배밀기 2000</Text>
            <Text style={styles.sheetCopy}>2,000은 의학적 권장량이 아니라 20세기 초 레슬러 Great Gama의 역사적 Dand 고반복 기록에서 가져온 Final Quest야.</Text>
            <Text style={styles.sheetCopy}>현재 기록은 이 iPhone에 저장돼. 기기를 바꿀 때는 백업을 내보낸 뒤 새 기기에서 복원할 수 있어.</Text>
            <View style={{ gap: 9 }}>
              <Button label="전체 기록 백업" secondary onPress={exportRecords} />
              <Button label="백업 복원" secondary onPress={() => { setInfoOpen(false); setRestoreOpen(true); }} />
              <Button label="공식 자세 다시 보기" secondary onPress={() => { setInfoOpen(false); setFormOpen(true); }} />
              <Button label="왜 2,000?" secondary onPress={() => { setInfoOpen(false); setWhyOpen(true); }} />
              <Button label="개인정보 처리방침" secondary onPress={() => Linking.openURL(PRIVACY_URL)} />
              <Button label="지원" secondary onPress={() => Linking.openURL(SUPPORT_URL)} />
              <Button label="기록 초기화" danger onPress={reset} />
              <Button label="닫기" onPress={() => setInfoOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={restoreOpen} transparent animationType="slide" onRequestClose={() => setRestoreOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>백업 복원</Text>
            <Text style={styles.sheetCopy}>이전 iPhone에서 ‘전체 기록 백업’으로 저장한 JSON 전체를 여기에 붙여넣어.</Text>
            <TextInput
              value={restoreText}
              onChangeText={setRestoreText}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="백업 JSON 붙여넣기"
              placeholderTextColor="#A79F93"
              style={styles.restoreInput}
            />
            <Button label="기록 복원" onPress={restoreRecords} />
            <View style={{ height: 9 }} />
            <Button label="취소" secondary onPress={() => setRestoreOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>공식 배밀기 자세</Text>
            <FormStep n="1" title="엉덩이를 높여 시작" body="역 V자에 가깝게." />
            <FormStep n="2" title="가슴을 앞으로" body="팔꿈치를 굽혀 낮게 통과." />
            <FormStep n="3" title="팔을 펴고 가슴을 든다" body="앞으로 나간 뒤 상체를 올림." />
            <FormStep n="4" title="팔을 편 채 뒤로" body="엉덩이를 뒤·위로 보내 원위치." />
            <View style={{ height: 14 }} />
            <Button label="닫기" onPress={() => setFormOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={whyOpen} transparent animationType="slide" onRequestClose={() => setWhyOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>왜 2,000?</Text>
            <Text style={styles.sheetCopy}>Great Gama는 20세기 초를 대표하는 프로 레슬러야. 1911년 T. M. Alexander는 그가 약 3시간 동안 2,000회가 넘는 Dand를 하는 것을 세었다고 기록했어.</Text>
            <Text style={styles.sheetCopy}>현대식 공인 기록이나 운동 권장량은 아니야. 이 앱은 그 숫자를 ‘마지막 벽’으로만 사용해.</Text>
            <Text style={[styles.sheetTitle, { fontSize: 23, marginVertical: 18 }]}>1년 뒤, 당신은 몇 개까지 갈 수 있을까?</Text>
            <Button label="역사적 기록 보기" secondary onPress={() => Linking.openURL(GAMA_SOURCE_URL)} />
            <View style={{ height: 9 }} />
            <Button label="닫기" onPress={() => setWhyOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={message !== null} transparent animationType="fade" onRequestClose={() => setMessage(null)}>
        <View style={styles.centerOverlay}>
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
            <Button label="확인" onPress={() => setMessage(null)} />
            {message?.includes('CLEAR') ? (
              <>
                <View style={{ height: 9 }} />
                <Button label="공유" secondary onPress={() => Share.share({ message: `${message}\n배밀기 2000` })} />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
