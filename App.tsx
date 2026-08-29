import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, SafeAreaView, ScrollView, Share, StatusBar, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { AppState, GAMA_SOURCE_URL, PRIVACY_URL, STORAGE_KEY, SUPPORT_URL, initialState, safeState, targetForLevel } from './src/core';
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
  const [challengeLevel, setChallengeLevel] = useState<number | null>(null);
  const [trainingLevel, setTrainingLevel] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { if (isUpdatePending) Updates.reloadAsync().catch(() => {}); }, [isUpdatePending]);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => setState(raw ? safeState(JSON.parse(raw)) : initialState)).catch(() => setState(initialState));
  }, []);

  const commit = async (next: AppState) => { setState(next); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  if (!state) return <SafeAreaView style={styles.root} />;
  if (!state.onboarded) return <Onboarding onDone={commit} />;

  if (challengeLevel !== null) {
    return <Challenge level={challengeLevel} onCancel={() => setChallengeLevel(null)} onFinish={async (success, seconds) => {
      const old = state.clearedLevel;
      const clearedLevel = success ? Math.max(old, challengeLevel) : old;
      await commit({ ...state, clearedLevel, selectedLevel: success ? Math.min(200, Math.max(clearedLevel + 1, state.selectedLevel)) : state.selectedLevel, sessions: [...state.sessions, { at: new Date().toISOString(), type: 'challenge', level: challengeLevel, target: targetForLevel(challengeLevel), success, seconds }].slice(-300) });
      setChallengeLevel(null);
      if (success && clearedLevel >= 200) setMessage('2,000. Final Quest를 완료했어.');
      else if (success && targetForLevel(old || 1) < 500 && targetForLevel(clearedLevel || 1) >= 500) setMessage('500. 여기까지 와도 충분해. 마지막은 2,000이야.');
      else setMessage(success ? `LEVEL ${challengeLevel} CLEAR. 아래 레벨도 모두 완료됐어.` : `LEVEL ${challengeLevel}은 아직이야. 기록은 그대로 유지돼.`);
    }} />;
  }

  if (trainingLevel !== null) {
    const currentBest = state.clearedLevel > 0 ? targetForLevel(state.clearedLevel) : 0;
    return <Training level={trainingLevel} currentBest={currentBest} onCancel={() => setTrainingLevel(null)} onFinish={async (seconds) => {
      await commit({ ...state, sessions: [...state.sessions, { at: new Date().toISOString(), type: 'training', level: trainingLevel, target: targetForLevel(trainingLevel), success: true, seconds }].slice(-300) });
      setTrainingLevel(null);
      setMessage('훈련 완료. 준비됐다고 느껴질 때 Quest에 도전해.');
    }} />;
  }

  const nextLevel = state.clearedLevel >= 200 ? 200 : Math.max(state.clearedLevel + 1, state.selectedLevel);
  const nextTarget = targetForLevel(nextLevel);
  const currentReps = state.clearedLevel > 0 ? targetForLevel(state.clearedLevel) : 0;
  const history = [...state.sessions].reverse().slice(0, 30);

  const reset = () => Alert.alert('기록을 모두 지울까?', '이 기기에 저장된 진행 기록만 삭제돼.', [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(STORAGE_KEY); setInfoOpen(false); setState(initialState); } },
  ]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Header onInfo={() => setInfoOpen(true)} />
      {tab === 'home' && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.kicker}>CURRENT</Text>
          <Text style={styles.heroLevel}>LEVEL {state.clearedLevel}</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${state.clearedLevel / 2}%` }]} /></View>
          <View style={styles.metaRow}><Text style={styles.mutedSmall}>{state.clearedLevel} / 200 QUEST</Text><Text style={styles.mutedSmall}>현재 최고 {currentReps}</Text></View>
          <View style={styles.card}>
            <Text style={styles.kicker}>NEXT QUEST</Text>
            <Text style={styles.cardLevel}>LEVEL {nextLevel}</Text>
            <Text style={styles.cardNumber}>{nextTarget}</Text>
            <Text style={styles.cardUnit}>연속 배밀기</Text>
            <Button label="도전하기" onPress={() => setChallengeLevel(nextLevel)} />
            <View style={{ height: 9 }} />
            <Button label="훈련하기" secondary onPress={() => setTrainingLevel(nextLevel)} />
          </View>
          <Pressable style={styles.linkRow} onPress={() => setTab('quests')}><Text style={styles.linkText}>200개의 Quest 보기</Text><Text style={styles.linkArrow}>→</Text></Pressable>
          <View style={styles.section}><Text style={styles.sectionTitle}>기록은 스스로에게 정직하게.</Text><Text style={styles.sectionBody}>카메라도 자동 판정도 없어. 정해진 횟수를 공식 자세로 완료했다면 CLEAR.</Text></View>
        </ScrollView>
      )}

      {tab === 'quests' && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.pageTitle}>200{`\n`}QUESTS</Text>
          <Text style={styles.pageCopy}>더 높은 Quest를 먼저 깨면 그 아래 레벨도 모두 완료돼. 완료한 레벨은 눌러서 훈련용으로 다시 쓸 수 있어.</Text>
          <View style={styles.grid}>{Array.from({ length: 200 }, (_, i) => i + 1).map((level) => {
            const done = level <= state.clearedLevel;
            const selected = level === state.selectedLevel && !done;
            const reps = targetForLevel(level);
            const landmark = [50, 100, 250, 500, 1000, 2000].includes(reps);
            return <Pressable key={level} onPress={async () => { if (done) setTrainingLevel(level); else { await commit({ ...state, selectedLevel: level }); setTab('home'); } }} style={[styles.cell, done && styles.cellDone, selected && styles.cellSelected, landmark && styles.cellLandmark]}><Text style={styles.cellLevel}>{level}</Text><Text style={styles.cellReps}>{reps}</Text></Pressable>;
          })}</View>
        </ScrollView>
      )}

      {tab === 'records' && (
        <ScrollView contentContainerStyle={styles.page}>
          <Text style={styles.pageTitle}>RECORD</Text>
          <Text style={styles.pageCopy}>앱 사용 시간이 아니라 실제 기록이 얼마나 늘었는지가 중요해.</Text>
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statLabel}>START</Text><Text style={styles.statValue}>{state.firstBaemilgiMax ?? '—'}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>CURRENT</Text><Text style={styles.statValue}>{currentReps || '—'}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>QUEST</Text><Text style={styles.statValue}>{state.clearedLevel}</Text></View>
          </View>
          <Text style={styles.sectionTitle}>최근 기록</Text>
          {history.length === 0 ? <Text style={styles.pageCopy}>아직 기록이 없어.</Text> : history.map((session) => <View key={`${session.at}-${session.level}`} style={styles.historyRow}><View><Text style={styles.historyMain}>{session.type === 'challenge' ? `LEVEL ${session.level} ${session.success ? 'CLEAR' : 'FAIL'}` : `LEVEL ${session.level} TRAINING`}</Text><Text style={styles.historySub}>{new Date(session.at).toLocaleDateString('ko-KR')}</Text></View><Text style={styles.historyTarget}>{session.target}</Text></View>)}
        </ScrollView>
      )}

      <View style={styles.nav}>{(['home', 'quests', 'records'] as const).map((name) => <Pressable key={name} onPress={() => setTab(name)} style={styles.navButton}><Text style={[styles.navText, tab === name && styles.navTextActive]}>{name === 'home' ? 'HOME' : name === 'quests' ? 'QUEST' : 'RECORD'}</Text></Pressable>)}</View>

      <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>배밀기 2000</Text><Text style={styles.sheetCopy}>2,000은 의학적 권장량이 아니라 역사적 Dand 고반복 기록에서 가져온 Final Quest야.</Text><View style={{ gap: 9 }}><Button label="공식 자세 다시 보기" secondary onPress={() => { setInfoOpen(false); setFormOpen(true); }} /><Button label="왜 2,000?" secondary onPress={() => { setInfoOpen(false); setWhyOpen(true); }} /><Button label="개인정보 처리방침" secondary onPress={() => Linking.openURL(PRIVACY_URL)} /><Button label="지원" secondary onPress={() => Linking.openURL(SUPPORT_URL)} /><Button label="기록 초기화" danger onPress={reset} /><Button label="닫기" onPress={() => setInfoOpen(false)} /></View></View></View></Modal>
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>공식 배밀기 자세</Text><FormStep n="1" title="엉덩이를 높여 시작" body="역 V자에 가깝게." /><FormStep n="2" title="가슴을 앞으로" body="팔꿈치를 굽혀 낮게 통과." /><FormStep n="3" title="팔을 펴고 가슴을 든다" body="앞으로 나간 뒤 상체를 올림." /><FormStep n="4" title="팔을 편 채 뒤로" body="엉덩이를 뒤·위로 보내 원위치." /><View style={{ height: 14 }} /><Button label="닫기" onPress={() => setFormOpen(false)} /></View></View></Modal>
      <Modal visible={whyOpen} transparent animationType="slide" onRequestClose={() => setWhyOpen(false)}><View style={styles.overlay}><View style={styles.sheet}><Text style={styles.sheetTitle}>왜 2,000?</Text><Text style={styles.sheetCopy}>1911년 T. M. Alexander는 Great Gama가 약 3시간 동안 2,000회가 넘는 dand를 하는 것을 세었다고 기록했어. 현대식 공인 기록은 아니야.</Text><Text style={[styles.sheetTitle, { fontSize: 23, marginVertical: 18 }]}>1년 뒤, 당신은 몇 개까지 갈 수 있을까?</Text><Button label="역사적 기록 보기" secondary onPress={() => Linking.openURL(GAMA_SOURCE_URL)} /><View style={{ height: 9 }} /><Button label="닫기" onPress={() => setWhyOpen(false)} /></View></View></Modal>
      <Modal visible={message !== null} transparent animationType="fade" onRequestClose={() => setMessage(null)}><View style={styles.centerOverlay}><View style={styles.messageCard}><Text style={styles.messageText}>{message}</Text><Button label="확인" onPress={() => setMessage(null)} />{message?.includes('CLEAR') ? <><View style={{ height: 9 }} /><Button label="공유" secondary onPress={() => Share.share({ message: `${message}\n배밀기 2000` })} /></> : null}</View></View></Modal>
    </SafeAreaView>
  );
}
