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
import { C, styles } from './src/styles';
import { Button, FormStep, Header } from './src/ui';
import { Onboarding } from './src/Onboarding';
import { Challenge, Training } from './src/Workout';
import { BAEMILGI_MARTIAL_COPY, CHAPTER_GUIDE_COPY, TRAINING_CHAPTERS, chapterForLevel } from './src/chapters';

export default function App() {
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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [loadError, setLoadError] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(30);


  const loadStoredState = () => {
    setLoadError(false);
    setState(null);
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setState(raw ? safeState(JSON.parse(raw)) : initialState))
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    loadStoredState();
  }, []);

  const commit = async (next: AppState) => {
    setSaveStatus('saving');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
      setSaveStatus('saved');
      return true;
    } catch {
      setSaveStatus('error');
      Alert.alert('기록 저장 실패', '이 기기에 기록을 저장하지 못했어. 저장 공간을 확인한 뒤 다시 시도해줘.');
      return false;
    }
  };

  if (loadError) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.onboarding}>
          <View style={styles.setupBody}>
            <Text style={styles.pageEyebrow}>LOCAL RECORD / READ ERROR</Text>
            <Text style={styles.question}>기록을 열지 못했어.</Text>
            <Text style={styles.copy}>기존 기록을 덮어쓰지 않도록 새 기록을 시작하지 않을게. 앱을 다시 읽어본 뒤에도 계속되면 지원으로 알려줘.</Text>
          </View>
          <Button label="다시 시도" onPress={loadStoredState} />
        </View>
      </SafeAreaView>
    );
  }
  if (!state) return <SafeAreaView style={styles.root} />;
  if (!state.onboarded) {
    return (
      <Onboarding
        onDone={async (next, firstChallengeLevel) => {
          const saved = await commit(next);
          if (saved) setChallengeLevel(firstChallengeLevel);
          return saved;
        }}
      />
    );
  }

  if (challengeLevel !== null) {
    return (
      <Challenge
        level={challengeLevel}
        onCancel={() => setChallengeLevel(null)}
        onFinish={async (success, seconds, actualReps) => {
          const old = state.clearedLevel;
          const next = recomputeProgress({
            ...state,
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
          });
          const clearedLevel = next.clearedLevel;
          const saved = await commit(next);
          if (!saved) return false;
          setChallengeLevel(null);
          if (success && clearedLevel >= 200) setMessage('2,000. 마지막 퀘스트를 완료했어.');
          else if (success && targetForLevel(old || 1) < 1000 && targetForLevel(clearedLevel || 1) >= 1000) {
            setMessage('1,000개 관문을 넘었어. 마지막 퀘스트까지 절반 남았어.');
          } else if (success && targetForLevel(old || 1) < 500 && targetForLevel(clearedLevel || 1) >= 500) {
            setMessage('500개를 넘었어. 최종 목표는 2,000개야.');
          } else {
            setMessage(null);
          }
          return true;
        }}
      />
    );
  }

  if (trainingLevel !== null) {
    const currentBest = state.sessions.reduce((best, session) => {
      if (session.type !== 'challenge') return best;
      return Math.max(best, session.success ? session.target : session.actualReps ?? 0);
    }, state.clearedLevel > 0 ? targetForLevel(state.clearedLevel) : 0);

    return (
      <Training
        level={trainingLevel}
        currentBest={currentBest}
        onCancel={() => setTrainingLevel(null)}
        onFinish={async (seconds, plan) => {
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
                trainingSets: plan.sets,
                trainingRepsPerSet: plan.reps,
                trainingRestSeconds: plan.rest,
              },
            ],
          });
          if (!saved) return false;
          setTrainingLevel(null);
          setMessage('훈련을 기록했어. 준비됐을 때 다음 퀘스트에 도전해.');
          return true;
        }}
      />
    );
  }

  const journeyComplete = state.clearedLevel >= 200;
  const nextLevel = journeyComplete ? 200 : state.clearedLevel + 1;
  const nextTarget = targetForLevel(nextLevel);
  const hasPersonalRecord = state.firstBaemilgiMax !== null || state.sessions.some((session) => session.type === 'challenge');
  const currentReps = state.sessions.reduce((best, session) => {
    if (session.type !== 'challenge') return best;
    return Math.max(best, session.success ? session.target : session.actualReps ?? 0);
  }, Math.max(state.firstBaemilgiMax ?? 0, state.clearedLevel > 0 ? targetForLevel(state.clearedLevel) : 0));
  const allHistory = state.sessions
    .map((session, index) => ({ session, index }))
    .reverse();
  const history = allHistory.slice(0, historyLimit);

  const openExternal = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(`${label}을 열 수 없어`, '네트워크 연결을 확인한 뒤 다시 시도해줘.');
    }
  };

  const nearbyStart = Math.max(1, nextLevel - 3);
  const nearbyEnd = Math.min(200, nearbyStart + 11);
  const nearbyLevels = Array.from(
    { length: nearbyEnd - nearbyStart + 1 },
    (_, i) => nearbyStart + i,
  );
  const milestoneLevels = [100, 130, 150, 175, 200];
  const currentChapter = chapterForLevel(nextLevel);

  const exportRecords = async () => {
    const payload = {
      app: '배밀기 2000',
      formatVersion: 3,
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
  };

  const saveEditedSession = async (index: number, patch: Partial<AppState['sessions'][number]>) => {
    const sessions = [...state.sessions];
    sessions[index] = { ...sessions[index], ...patch };
    await commit(recomputeProgress({ ...state, sessions }));
  };

  const deleteSession = (index: number) => {
    Alert.alert('이 기록을 삭제할까?', '진행 레벨도 남아 있는 도전 기록의 실제 수행 횟수를 기준으로 다시 계산돼.', [
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
    const previousReps = session.success ? session.target : session.actualReps ?? 0;
    Alert.prompt(
      session.success ? '성공 기록 낮추기' : '실패 기록 낮추기',
      `레벨 ${session.level}에서 실제로 몇 개까지 했어? 기록은 낮추는 수정만 가능해.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '저장',
          onPress: (value?: string) => {
            const actualReps = Math.max(0, Math.floor(Number(value) || 0));
            if (actualReps >= session.target) {
              Alert.alert('목표보다 낮은 횟수를 입력해줘', '성공 기록은 그대로 두거나 실제로 멈춘 횟수로 낮출 수 있어.');
              return;
            }
            if (!session.success && actualReps > previousReps) {
              Alert.alert('기록은 올릴 수 없어', '더 높은 횟수는 새 퀘스트 도전으로 남겨줘.');
              return;
            }
            saveEditedSession(index, { success: false, actualReps });
          },
        },
      ],
      'plain-text',
      String(session.success ? Math.max(0, session.target - 1) : previousReps),
      'number-pad',
    );
  };

  const editSession = (index: number) => {
    const session = state.sessions[index];
    if (session.type === 'training') {
      Alert.alert(`레벨 ${session.level} 훈련`, '잘못 저장한 기록이라면 삭제할 수 있어.', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => deleteSession(index) },
      ]);
      return;
    }

    Alert.alert(
      `레벨 ${session.level} 기록 편집`,
      session.success ? '현재 성공으로 기록돼 있어.' : `현재 ${session.actualReps ?? 0}개에서 실패로 기록돼 있어.`,
      [
        { text: '취소', style: 'cancel' },
        { text: session.success ? '실패로 낮추기' : '횟수 낮추기', onPress: () => promptFailureReps(index) },
        { text: '기록 삭제', style: 'destructive' as const, onPress: () => deleteSession(index) },
      ],
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
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setInfoOpen(false);
            setSaveStatus('saved');
            setState(initialState);
          } catch {
            Alert.alert('기록을 지우지 못했어', '기존 기록을 유지했어. 저장 공간을 확인한 뒤 다시 시도해줘.');
          }
        },
      },
    ],
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Header
        beltColor={currentChapter.color}
        beltName={currentChapter.name}
        onInfo={() => setInfoOpen(true)}
      />

      {tab === 'home' && (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.homeCanvas}>
            {saveStatus !== 'saved' ? (
              <View style={styles.storageInline} accessibilityLiveRegion="polite">
                <View style={[styles.storageDot, saveStatus === 'error' && styles.storageDotError]} />
                <Text style={styles.storageInlineText}>
                  {saveStatus === 'saving' ? '기록 저장 중' : '저장을 확인해줘'}
                </Text>
              </View>
            ) : null}

            <View style={styles.dojoMeta}>
              <Text style={styles.dojoQuestCode}>QUEST / {String(nextLevel).padStart(3, '0')}</Text>
              <Text style={[styles.dojoMetaRight, { color: currentChapter.id === 'white' ? '#686A68' : currentChapter.color }]}>{currentChapter.name} CHAPTER</Text>
            </View>

            <View
              style={styles.dojoHero}
              accessible
              accessibilityLabel={`다음 목표 ${nextTarget}개. 현재 최고 기록 ${hasPersonalRecord ? `${currentReps}개` : '없음'}`}
            >
              <Text style={styles.dojoHeroNumber} maxFontSizeMultiplier={1.15}>{nextTarget}</Text>
              <View style={styles.dojoCurrentBestRow}>
                <Text style={styles.dojoCurrentBestLabel}>CURRENT BEST:</Text>
                <Text style={styles.dojoCurrentBestValue}>{hasPersonalRecord ? currentReps : '—'}</Text>
              </View>
            </View>

            {journeyComplete ? (
              <View
                style={[styles.chapterRibbon, { backgroundColor: '#121212' }]}
                accessible
                accessibilityLabel="200개 퀘스트 완료. 최종 퀘스트 2,000개 달성"
              >
                <Text style={[styles.chapterRibbonName, { color: '#FAF9F6' }]}>200 / 200</Text>
                <Text style={[styles.chapterRibbonMeta, { color: '#FAF9F6' }]}>FINAL QUEST CLEARED · 2,000</Text>
              </View>
            ) : (
              <View style={[styles.chapterRibbon, { backgroundColor: currentChapter.color }]} accessible accessibilityLabel={`${currentChapter.name} 훈련 챕터, 퀘스트 ${currentChapter.startLevel}부터 ${currentChapter.endLevel}`}>
                <Text style={[styles.chapterRibbonName, { color: currentChapter.textColor }]}>{currentChapter.name}</Text>
                <Text style={[styles.chapterRibbonMeta, { color: currentChapter.textColor }]}>{currentChapter.label} · Q{String(currentChapter.startLevel).padStart(3, '0')}—{String(currentChapter.endLevel).padStart(3, '0')}</Text>
              </View>
            )}

            <View style={styles.questBandStage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.questBandStitch} />
              <View style={styles.questBand}>
                {nearbyLevels.slice(0, 7).map((level) => {
                  const active = level === nextLevel;
                  const done = level <= state.clearedLevel;
                  return (
                    <View key={level} style={[styles.questBandItem, active && styles.questBandActive, active && { borderBottomColor: currentChapter.color }]}>
                      {active && <View style={styles.questBandTape} />}
                      <Text style={[
                        styles.questBandItemText,
                        done && styles.questBandDoneText,
                        active && styles.questBandActiveText,
                      ]}>{level}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.primaryActions}>
              <Button label={journeyComplete ? '2,000 다시 도전' : 'START CHALLENGE'} onPress={() => setChallengeLevel(nextLevel)} />
              <Button label={journeyComplete ? '2,000 TRAINING' : 'TRAINING'} secondary onPress={() => setTrainingLevel(nextLevel)} />
            </View>

            <Pressable
              style={styles.archiveFooter}
              onPress={() => setTab('records')}
              accessibilityRole="button"
              accessibilityLabel="수련 기록 보기"
            >
              <View>
                <Text style={styles.archiveFooterLabel}>BAEMILGI RECORDS</Text>
                <Text style={styles.archiveFooterValue}>
                  {state.sessions.length ? `${state.sessions.length} TOTAL RECORDS` : 'NO RECORDS YET'}
                </Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {tab === 'quests' && (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageEyebrow}>ROUTE / 001—200</Text>
          <Text style={styles.pageTitle}>QUEST MAP</Text>
          <Text style={styles.pageCopy}>200개를 다 펼쳐놓지 않고, 지금의 훈련 챕터와 가까운 퀘스트만 보여줘.</Text>

          <Pressable
            style={styles.chapterGuide}
            onPress={() => Alert.alert('5색 훈련 챕터', CHAPTER_GUIDE_COPY)}
            accessibilityRole="button"
            accessibilityLabel="5색 훈련 챕터 안내"
          >
            <View style={styles.chapterGuideHeader}>
              <Text style={styles.chapterGuideTitle}>TRAINING CHAPTERS</Text>
              <Text style={styles.chapterGuideHint}>공식 띠 등급 아님 · 안내 →</Text>
            </View>
            <View style={styles.chapterSwatches}>
              {TRAINING_CHAPTERS.map((chapter) => {
                const active = chapter.id === currentChapter.id;
                return (
                  <View key={chapter.id} style={styles.chapterSwatchItem}>
                    <View style={[styles.chapterSwatch, { backgroundColor: chapter.color }, active && styles.chapterSwatchActive]} />
                    <Text style={[styles.chapterSwatchLabel, active && styles.chapterSwatchLabelActive]}>{chapter.name}</Text>
                  </View>
                );
              })}
            </View>
          </Pressable>

          <View style={styles.questHero}>
            <Text style={styles.kicker}>현재 위치</Text>
            <View style={styles.questHeroRow}>
              <View>
                <Text style={styles.questHeroLevel}>레벨 {nextLevel}</Text>
                <Text style={styles.questHeroCopy}>{journeyComplete ? '최종 퀘스트 완료' : '다음 도전'}</Text>
              </View>
              <Text style={styles.questHeroTarget} maxFontSizeMultiplier={1.2}>{nextTarget}<Text style={styles.questHeroUnit}>개</Text></Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${state.clearedLevel / 2}%` }]} />
            </View>
            <Text style={styles.questProgressCopy}>
              {journeyComplete
                ? '200단계 완료 · FINAL QUEST CLEARED'
                : `${state.clearedLevel}단계 완료 · 200단계까지 ${200 - state.clearedLevel}단계`}
            </Text>
          </View>

          <View style={styles.questSection}>
            <Text style={styles.questSectionLabel}>현재 구간</Text>
            <View style={styles.grid}>
            {nearbyLevels.map((level) => {
              const done = level <= state.clearedLevel;
              const selected = level === nextLevel && !done;
              const reps = targetForLevel(level);
              const inverse = done || selected;
              return (
                <Pressable
                  key={level}
                  accessibilityRole="button"
                  accessibilityLabel={`레벨 ${level}, 목표 ${reps}개${done ? ', 완료' : selected ? ', 다음 도전' : ''}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    if (done) {
                      setTrainingLevel(level);
                      return;
                    }
                    if (level === nextLevel) {
                      setTab('home');
                      return;
                    }
                    Alert.alert(
                      `레벨 ${level} · ${reps}개`,
                      `앞으로 만날 퀘스트야. 현재는 레벨 ${nextLevel}부터 이어서 진행해.`,
                    );
                  }}
                  accessibilityHint={done ? '완료한 단계의 훈련을 시작합니다' : level === nextLevel ? '현재 다음 퀘스트로 이동합니다' : '미래 퀘스트의 목표를 미리 봅니다'}
                  style={[
                    styles.cell,
                    done && styles.cellDone,
                    selected && styles.cellSelected,
                    selected && {
                      backgroundColor: currentChapter.color,
                      borderColor: currentChapter.id === 'white' ? C.line : currentChapter.color,
                    },
                  ]}
                >
                  <Text style={[
                    styles.cellLevel,
                    inverse && styles.cellTextInverse,
                    selected && { color: currentChapter.textColor },
                  ]}>{done ? '완료' : `L${level}`}</Text>
                  <Text style={[
                    styles.cellReps,
                    inverse && styles.cellTextInverse,
                    selected && { color: currentChapter.textColor },
                  ]}>{reps}개</Text>
                </Pressable>
              );
            })}
            </View>
          </View>

          <View style={styles.milestoneSection}>
            <Text style={styles.questSectionLabel}>주요 관문</Text>
            <View style={styles.milestoneList}>
            {milestoneLevels.map((level, index) => {
              const reps = targetForLevel(level);
              const done = level <= state.clearedLevel;
              const chapter = TRAINING_CHAPTERS[index];
              return (
                <Pressable
                  key={level}
                  accessibilityRole="button"
                  accessibilityLabel={`레벨 ${level}, ${reps}개 관문${done ? ', 완료' : ''}`}
                  onPress={() => {
                    if (done) {
                      setTrainingLevel(level);
                      return;
                    }
                    Alert.alert(
                      `관문 · 레벨 ${level}`,
                      `${reps.toLocaleString()}개. 현재 퀘스트를 이어가면 이 관문에 도달해.`,
                    );
                  }}
                  accessibilityHint={done ? '완료한 관문 단계의 훈련을 시작합니다' : '미래 관문의 목표를 미리 봅니다'}
                  style={({ pressed }) => [
                    styles.milestoneRow,
                    { backgroundColor: chapter.color, borderColor: chapter.id === 'white' ? C.line : chapter.color },
                    !done && styles.milestonePending,
                    pressed && styles.milestonePressed,
                  ]}
                >
                  <Text style={[styles.milestoneBelt, { color: chapter.textColor }]}>{chapter.name}</Text>
                  <Text
                    style={[styles.milestoneTitle, { color: chapter.textColor }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                  >
                    {reps.toLocaleString()}
                  </Text>
                  <Text style={[styles.milestoneCopy, { color: chapter.textColor }]}>
                    {done ? '✓ ' : ''}L{level}
                  </Text>
                </Pressable>
              );
            })}
            </View>
          </View>
        </ScrollView>
      )}

      {tab === 'records' && (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.archivePanel}>
            <Text style={styles.pageEyebrow}>PERSONAL RECORD / THIS DEVICE</Text>
            <Text style={styles.archiveTitle}>BAEMILGI RECORDS</Text>
            <Text style={styles.pageCopy}>영광의 목록보다 반복의 장부. 성공과 멈춘 지점을 같은 기록으로 남겨.</Text>

            <View style={styles.stats}>
              <View style={styles.stat} accessible accessibilityLabel={`전체 기록 ${state.sessions.length}개`}>
                <Text style={styles.statLabel}>TOTAL RECORDS</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                  {state.sessions.length}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>CURRENT BEST</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                  {hasPersonalRecord ? currentReps : '—'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>CLEARED</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                  {state.clearedLevel}
                </Text>
              </View>
            </View>

            <View style={styles.archiveTableHead}>
              <Text style={[styles.archiveHeadText, styles.archiveDateCol]}>DATE</Text>
              <Text style={[styles.archiveHeadText, styles.archiveCodeCol]}>CODE</Text>
              <Text style={[styles.archiveHeadText, styles.archiveRepsCol]}>REPS</Text>
              <Text style={[styles.archiveHeadText, styles.archiveStatusCol]}>STATUS</Text>
            </View>

            {history.length === 0 ? (
              <View style={styles.archiveEmpty}>
                <Text style={styles.archiveEmptyTitle}>NO RECORDS YET.</Text>
                <Text style={styles.archiveEmptyCopy}>첫 퀘스트를 시작하면 이곳에 수련 기록이 쌓여.</Text>
              </View>
            ) : (
              history.map(({ session, index }) => {
                const training = session.type === 'training';
                const stopped = session.type === 'challenge' && !session.success;
                const reps = stopped ? (session.actualReps ?? 0) : session.target;
                const trainingSummary = training && session.trainingSets && session.trainingRepsPerSet
                  ? `${session.trainingSets}×${session.trainingRepsPerSet}`
                  : '—';
                const accessiblePerformance = training
                  ? session.trainingSets && session.trainingRepsPerSet
                    ? `${session.trainingSets}세트, 세트당 ${session.trainingRepsPerSet}개`
                    : '이전 버전 훈련 기록, 세트 상세 없음'
                  : `${reps}개`;
                return (
                  <Pressable
                    key={`${session.at}-${index}`}
                    style={styles.archiveEntry}
                    onPress={() => editSession(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`${training ? '훈련' : '퀘스트'} 레벨 ${session.level}, ${accessiblePerformance}, ${training ? '훈련 완료' : stopped ? '중단 기록' : '성공 기록'}`}
                    accessibilityHint="두 번 탭하여 기록을 편집합니다"
                  >
                    <Text style={[styles.archiveCell, styles.archiveDateCol]}>
                      {new Date(session.at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\.\s?/g, '.').replace(/\.$/, '')}
                    </Text>
                    <Text style={[styles.archiveCell, styles.archiveCodeCol]}>
                      {session.type === 'training' ? `D-${String(session.level).padStart(3, '0')}` : `Q-${String(session.level).padStart(3, '0')}`}
                    </Text>
                    <Text
                      style={[styles.archiveReps, styles.archiveRepsCol]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.62}
                    >
                      {training ? trainingSummary : reps}
                    </Text>
                    <View style={styles.archiveStatusCol}>
                      {session.type === 'training' ? (
                        <View style={styles.drillTag}><Text style={styles.drillTagText}>DRILL</Text></View>
                      ) : stopped ? (
                        <View style={styles.stoppedTag}><Text style={styles.stoppedTagText}>STOPPED</Text></View>
                      ) : (
                        <View style={styles.stampSmall}><Text style={styles.stampSmallText}>CLEARED</Text></View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}

            {history.length < allHistory.length ? (
              <View style={{ marginTop: 16 }}>
                <Button
                  label={`이전 기록 더 보기 · ${allHistory.length - history.length}개 남음`}
                  secondary
                  onPress={() => setHistoryLimit((value) => Math.min(allHistory.length, value + 30))}
                />
              </View>
            ) : null}

            <View style={styles.storageCard}>
              <View style={styles.storageCardTop}>
                <Text style={styles.storageTitle}>LOCAL RECORD</Text>
                <Text style={styles.storageInlineCode}>NO ACCOUNT</Text>
              </View>
              <Text style={styles.storageCopy}>앱 삭제나 기기 변경 전에는 백업이 필요해.</Text>
              <Pressable style={styles.storageAction} onPress={exportRecords}>
                <Text style={styles.storageActionText}>EXPORT ARCHIVE</Text>
                <Text style={styles.linkArrow}>→</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.nav}>
        {(['home', 'quests', 'records'] as const).map((name) => (
          <Pressable
            key={name}
            onPress={() => setTab(name)}
            style={[styles.navButton, tab === name && styles.navButtonActive]}
            accessibilityRole="tab"
            accessibilityLabel={name === 'home' ? '홈' : name === 'quests' ? '퀘스트' : '기록'}
            accessibilityState={{ selected: tab === name }}
          >
            <Text style={[styles.navText, tab === name && styles.navTextActive]}>
              {name === 'home' ? '01  홈' : name === 'quests' ? '02  퀘스트' : '03  기록'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.infoSheet}>
            <View style={styles.infoSheetHeader}>
              <View>
                <Text style={styles.infoSheetEyebrow}>ABOUT / LOCAL</Text>
                <Text style={styles.sheetTitle}>배밀기 2000</Text>
              </View>
              <Pressable
                onPress={() => setInfoOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="정보 닫기"
                style={({ pressed }) => [styles.infoSheetClose, pressed && { opacity: 0.55 }]}
              >
                <Text style={styles.infoSheetCloseText}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.infoSheetScrollView}
              contentContainerStyle={styles.infoSheetScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sheetCopy}>2,000은 운동 권장량이 아니라 20세기 초 레슬러 Great Gama의 역사적 Dand 고반복 기록에서 가져온 마지막 퀘스트야.</Text>
              <Text style={styles.sheetCopy}>현재 기록은 이 iPhone에 저장돼. 기기를 바꿀 때는 백업을 내보낸 뒤 새 기기에서 복원할 수 있어.</Text>
              <Text style={styles.infoSheetSectionLabel}>DATA</Text>
              <View style={{ gap: 9 }}>
                <Button label="전체 기록 백업" secondary onPress={exportRecords} />
                <Button label="백업 복원" secondary onPress={() => { setInfoOpen(false); setRestoreOpen(true); }} />
              </View>
              <Text style={styles.infoSheetSectionLabel}>GUIDE</Text>
              <View style={{ gap: 9 }}>
                <Button label="배밀기와 무도" secondary onPress={() => Alert.alert('배밀기와 무도', BAEMILGI_MARTIAL_COPY)} />
                <Button label="5색 훈련 챕터" secondary onPress={() => Alert.alert('5색 훈련 챕터', CHAPTER_GUIDE_COPY)} />
                <Button label="배밀기 자세 다시 보기" secondary onPress={() => { setInfoOpen(false); setFormOpen(true); }} />
                <Button label="왜 2,000?" secondary onPress={() => { setInfoOpen(false); setWhyOpen(true); }} />
              </View>
              <Text style={styles.infoSheetSectionLabel}>SUPPORT</Text>
              <View style={{ gap: 9 }}>
                <Button label="개인정보 처리방침" secondary onPress={() => openExternal(PRIVACY_URL, '개인정보 처리방침')} />
                <Button label="지원" secondary onPress={() => openExternal(SUPPORT_URL, '지원 페이지')} />
                <Button label="기록 초기화" danger onPress={reset} />
              </View>
            </ScrollView>
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
              placeholderTextColor="#A49C90"
              style={styles.restoreInput}
              accessibilityLabel="백업 JSON 입력"
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
            <Text style={styles.sheetTitle}>배밀기 자세</Text>
            <Text style={styles.sheetCopy}>힌두 푸시업이라고도 불리는 동작이야. 유도 훈련에서도 기초 체력 동작으로 쓰이지만, 아래 안내는 특정 협회의 공식 기술 규정이 아니라 안전한 동작 이해를 위한 앱 가이드야.</Text>
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
            <Text style={styles.sheetCopy}>현대식 공인 기록이나 운동 권장량은 아니야. 이 앱에서는 200단계의 최종 목표로 사용해.</Text>
            <Text style={[styles.sheetTitle, { fontSize: 22, marginVertical: 18 }]}>1년 뒤, 몇 개까지 갈 수 있을까?</Text>
            <Button label="역사적 기록 보기" secondary onPress={() => openExternal(GAMA_SOURCE_URL, '역사적 기록')} />
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
            {message?.includes('완료') ? (
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
