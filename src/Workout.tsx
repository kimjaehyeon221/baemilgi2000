import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  View,
  Vibration,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { formatSeconds, targetForLevel, trainingPlan } from './core';
import { C } from './styles';
import { FONT } from './typography';

const mono = FONT.data;
const serif = FONT.archival;
const metric = FONT.display;
const body = FONT.body;
const headline = FONT.headline;

function FocusHeader({ code, onClose, light = false }: { code: string; onClose: () => void; light?: boolean }) {
  return (
    <View style={[S.focusHeader, light && S.focusHeaderLight]}>
      <View style={S.codeLockup}>
        <View style={S.blueStitch} />
        <Text style={[S.code, light && S.codeLight]}>{code}</Text>
      </View>
      <Pressable onPress={onClose} hitSlop={6} accessibilityRole="button" accessibilityLabel="닫기" style={S.closeHit}>
        <Text style={[S.close, light && S.closeLight]}>×</Text>
      </Pressable>
    </View>
  );
}

function StampFlash({
  kind,
  value,
  saveFailed = false,
  onRetry,
}: {
  kind: 'cleared' | 'recorded';
  value: number;
  saveFailed?: boolean;
  onRetry?: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pulse, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 210,
      mass: 0.7,
    }).start();
  }, [pulse]);

  const cleared = kind === 'cleared';
  return (
    <View
      style={[S.flash, S.flashLight]}
      pointerEvents={saveFailed ? 'auto' : 'none'}
      accessible
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`${value}개, ${cleared ? '성공 기록' : '중단 기록'}${saveFailed ? ', 저장 실패. 다시 저장할 수 있음' : ' 저장 중'}`}
    >
      <StatusBar barStyle="dark-content" />
      <Text style={S.flashValue}>{value}</Text>
      <Animated.View
        style={[
          S.stamp,
          !cleared && S.recordStamp,
          {
            opacity: pulse,
            transform: [
              { rotate: cleared ? '-4deg' : '-2deg' },
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1.22, 1] }) },
            ],
          },
        ]}
      >
        <Text style={[S.stampText, !cleared && S.recordStampText]}>{cleared ? 'CLEARED' : 'RECORDED'}</Text>
      </Animated.View>
      <Text style={S.flashMeta}>
        {saveFailed ? 'LOCAL SAVE FAILED · RECORD KEPT ON SCREEN' : cleared ? 'TRAINING VERIFIED' : 'ATTEMPT LOGGED'}
      </Text>
      {saveFailed && onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="기록 다시 저장"
          onPress={onRetry}
          style={({ pressed }) => [S.retrySaveAction, pressed && S.pressed]}
        >
          <Text style={S.retrySaveActionText}>SAVE AGAIN</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Challenge({
  level,
  onCancel,
  onFinish,
}: {
  level: number;
  onCancel: () => void;
  onFinish: (success: boolean, seconds: number, actualReps: number) => Promise<boolean> | boolean;
}) {
  useKeepAwake();
  const target = targetForLevel(level);
  const [seconds, setSeconds] = useState(0);
  const [recordFailure, setRecordFailure] = useState(false);
  const [failedReps, setFailedReps] = useState('');
  const [flash, setFlash] = useState<'cleared' | 'recorded' | null>(null);
  const [flashValue, setFlashValue] = useState(target);
  const [saveFailed, setSaveFailed] = useState(false);
  const runningSinceRef = useRef(Date.now());
  const resultLockedRef = useRef(false);
  const savingRef = useRef(false);
  const pendingResultRef = useRef<{ success: boolean; seconds: number; reps: number } | null>(null);
  const accumulatedMsRef = useRef(0);

  const currentElapsedSeconds = () => Math.max(
    0,
    Math.floor((accumulatedMsRef.current + (Date.now() - runningSinceRef.current)) / 1000),
  );

  const pauseElapsedClock = () => {
    accumulatedMsRef.current += Math.max(0, Date.now() - runningSinceRef.current);
    setSeconds(Math.floor(accumulatedMsRef.current / 1000));
  };

  const resumeElapsedClock = () => {
    runningSinceRef.current = Date.now();
  };

  useEffect(() => {
    if (recordFailure || flash) return;
    const sync = () => setSeconds(currentElapsedSeconds());
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, [recordFailure, flash]);

  const persistPendingResult = async () => {
    const pending = pendingResultRef.current;
    if (!pending || savingRef.current) return;
    savingRef.current = true;
    setSaveFailed(false);
    const saved = await onFinish(pending.success, pending.seconds, pending.reps);
    if (!saved) {
      savingRef.current = false;
      setSaveFailed(true);
    }
  };

  const finishCleared = () => {
    if (resultLockedRef.current || flash) return;
    resultLockedRef.current = true;
    const finalSeconds = currentElapsedSeconds();
    pauseElapsedClock();
    pendingResultRef.current = { success: true, seconds: finalSeconds, reps: target };
    setFlashValue(target);
    setFlash('cleared');
    Vibration.vibrate(35);
    setTimeout(persistPendingResult, 950);
  };

  const saveFailure = () => {
    if (!failedReps.trim()) {
      Alert.alert('멈춘 횟수를 적어줘', '0개라면 0을 입력해도 돼.');
      return;
    }
    const reps = Math.max(0, Math.floor(Number(failedReps) || 0));
    if (reps >= target) {
      Alert.alert(
        '목표 횟수 이상이야',
        `${target}개를 완료했다면 COMPLETE를 눌러줘. 중단 기록은 ${Math.max(0, target - 1)}개까지 저장할 수 있어.`,
      );
      return;
    }
    if (resultLockedRef.current) return;
    resultLockedRef.current = true;
    Keyboard.dismiss();
    const finalSeconds = Math.floor(accumulatedMsRef.current / 1000);
    pendingResultRef.current = { success: false, seconds: finalSeconds, reps };
    setFlashValue(reps);
    setFlash('recorded');
    Vibration.vibrate(20);
    setTimeout(persistPendingResult, 850);
  };

  if (flash) {
    return (
      <StampFlash
        kind={flash}
        value={flashValue}
        saveFailed={saveFailed}
        onRetry={persistPendingResult}
      />
    );
  }

  if (recordFailure) {
    return (
      <SafeAreaView style={S.logRoot}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView
          style={S.logPage}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <FocusHeader code={`QUEST / ${String(level).padStart(3, '0')}`} onClose={() => { resumeElapsedClock(); setRecordFailure(false); }} light />

          <View style={S.ledger}>
            <View style={S.ledgerBlueTop} />
            <View style={S.ledgerHeadingRow}>
              <View>
                <Text style={S.ledgerTitle}>RECORDED.</Text>
                <Text style={S.ledgerCode}>BAEMILGI 2000 // EVENT LOG</Text>
              </View>
              <Text style={S.ledgerMark}>▰</Text>
            </View>

            <View style={S.dashedRule} />
            <Text style={S.ledgerPrompt}>멈춘 지점도 수련의 일부야. 숫자만 정확히 남겨.</Text>

            <View style={S.ledgerRows}>
              <View style={S.ledgerRow}>
                <Text style={S.ledgerLabel}>TARGET</Text>
                <Text style={S.ledgerValue}>{target}</Text>
              </View>
              <View style={S.ledgerRow}>
                <Text style={S.ledgerLabel}>STOPPED AT</Text>
                <View style={S.stopInputWrap}>
                  <TextInput
                    value={failedReps}
                    onChangeText={(value) => setFailedReps(value.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    placeholder="0"
                    placeholderTextColor="#8C8D89"
                    style={S.stopInput}
                    autoFocus
                    accessibilityLabel="중단 전까지 성공한 배밀기 개수"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={S.logActions}>
            <Pressable style={({ pressed }) => [S.stitchedAction, pressed && S.pressed]} onPress={saveFailure}>
              <Text style={S.stitchedActionText}>SAVE RECORD</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [S.returnAction, pressed && S.pressed]} onPress={() => { resumeElapsedClock(); setRecordFailure(false); }}>
              <Text style={S.returnActionText}>RETURN TO QUEST</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.activeRoot}>
      <StatusBar barStyle="light-content" />
      <View style={S.activePage}>
        <FocusHeader code={`QUEST / ${String(level).padStart(3, '0')}`} onClose={onCancel} />

        <View style={S.matFrame}>
          <View style={S.matDots}>
            <View style={S.matDot} />
            <View style={S.matDot} />
            <View style={S.matDot} />
          </View>
          <View style={S.targetCenter}>
            <Text style={S.target}>{target}</Text>
            <Text style={S.targetLabel}>TARGET REPS</Text>
          </View>
          <Text style={S.elapsed}>{formatSeconds(seconds)}  ELAPSED</Text>
        </View>

        <Text style={S.activeHint}>직접 세어. 자세가 무너지거나 불편하면 STOP HERE.</Text>

        <View style={S.activeActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="퀘스트 완료 기록" style={({ pressed }) => [S.completeAction, pressed && S.pressed]} onPress={finishCleared}>
            <Text style={S.completeActionText}>COMPLETE</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="여기까지 기록"
            style={({ pressed }) => [S.stopAction, pressed && S.pressed]}
            onPress={() => { pauseElapsedClock(); setRecordFailure(true); }}
          >
            <Text style={S.stopActionText}>STOP HERE</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function Training({
  level,
  currentBest,
  onCancel,
  onFinish,
}: {
  level: number;
  currentBest: number;
  onCancel: () => void;
  onFinish: (seconds: number) => Promise<boolean> | boolean;
}) {
  useKeepAwake();
  const plan = trainingPlan(currentBest, targetForLevel(level));
  const [setNumber, setSetNumber] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [rest, setRest] = useState(false);
  const [restLeft, setRestLeft] = useState(plan.rest);
  const sessionStartedAtRef = useRef(Date.now());
  const restDeadlineRef = useRef<number | null>(null);
  const actionLockedRef = useRef(false);

  const currentSessionSeconds = () => Math.max(0, Math.floor((Date.now() - sessionStartedAtRef.current) / 1000));

  useEffect(() => {
    const sync = () => setSeconds(currentSessionSeconds());
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!rest) return;
    const syncRest = () => {
      const deadline = restDeadlineRef.current;
      if (!deadline) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRestLeft(remaining);
      if (remaining <= 0) {
        restDeadlineRef.current = null;
        setRest(false);
        setRestLeft(plan.rest);
      }
    };
    syncRest();
    const id = setInterval(syncRest, 250);
    return () => clearInterval(id);
  }, [rest, plan.rest]);

  const beginRest = () => {
    restDeadlineRef.current = Date.now() + plan.rest * 1000;
    setRestLeft(plan.rest);
    setRest(true);
  };

  const skipRest = () => {
    restDeadlineRef.current = null;
    setRest(false);
    setRestLeft(plan.rest);
  };

  const releaseActionLock = () => {
    setTimeout(() => {
      actionLockedRef.current = false;
    }, 350);
  };

  const handleTrainingAction = async () => {
    if (actionLockedRef.current) return;
    actionLockedRef.current = true;

    if (rest) {
      skipRest();
      releaseActionLock();
      return;
    }

    if (setNumber >= plan.sets) {
      const saved = await onFinish(currentSessionSeconds());
      if (!saved) actionLockedRef.current = false;
      return;
    }

    setSetNumber((v) => v + 1);
    beginRest();
    releaseActionLock();
  };

  return (
    <SafeAreaView style={S.activeRoot}>
      <StatusBar barStyle="light-content" />
      <View style={S.activePage}>
        <FocusHeader code={`DRILL / ${String(level).padStart(3, '0')}`} onClose={onCancel} />

        <View style={S.trainingBand}>
          <Text style={S.trainingBandLabel}>{rest ? 'REST' : `SET ${setNumber} / ${plan.sets}`}</Text>
          <View style={S.trainingBandMarks}>
            {Array.from({ length: plan.sets }, (_, i) => (
              <View key={i} style={[S.trainingMark, i < setNumber && S.trainingMarkDone]} />
            ))}
          </View>
        </View>

        <View style={S.trainingMat}>
          <Text style={S.trainingNumber}>{rest ? formatSeconds(restLeft) : plan.reps}</Text>
          <Text style={S.trainingUnit}>{rest ? 'REST' : 'REPS'}</Text>
          <Text style={S.trainingSession}>{formatSeconds(seconds)}  SESSION</Text>
        </View>

        <Text style={S.activeHint}>반복 가능한 리듬을 유지해. 쉬는 동안 호흡을 정리해.</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rest ? '휴식 건너뛰기' : setNumber >= plan.sets ? '훈련 완료 기록' : `${setNumber}세트 완료`}
          style={({ pressed }) => [rest ? S.stopAction : S.completeAction, pressed && S.pressed]}
          onPress={handleTrainingAction}
        >
          <Text style={rest ? S.stopActionText : S.completeActionText}>
            {rest ? 'SKIP REST' : setNumber >= plan.sets ? 'COMPLETE TRAINING' : 'COMPLETE SET'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  activeRoot: { flex: 1, backgroundColor: '#121212' },
  activePage: { flex: 1, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#121212' },
  focusHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusHeaderLight: { borderBottomWidth: 1, borderBottomColor: '#C8C4BB' },
  codeLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  blueStitch: { width: 18, height: 3, backgroundColor: '#1B365D' },
  code: { color: '#A8ADAE', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  codeLight: { color: '#1B365D' },
  closeHit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  close: { fontFamily: body, color: '#A8ADAE', fontSize: 34, lineHeight: 36, fontWeight: '300' },
  closeLight: { color: '#121212' },

  matFrame: { flex: 1, maxHeight: 430, minHeight: 360, marginTop: 32, borderWidth: 2, borderColor: '#354B69', backgroundColor: '#151515', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  matDots: { position: 'absolute', top: 15, left: 15, flexDirection: 'row', gap: 5 },
  matDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#5D6263' },
  targetCenter: { alignItems: 'center' },
  target: { color: '#FAF9F6', fontFamily: metric, fontSize: 116, lineHeight: 124, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },
  targetLabel: { color: '#8B9091', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 2.2, marginTop: 8 },
  elapsed: { position: 'absolute', bottom: 16, right: 16, color: '#A9B9CF', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, fontVariant: ['tabular-nums'] },
  activeHint: { fontFamily: body, color: '#8D9192', fontSize: 12, lineHeight: 18, marginTop: 16, marginHorizontal: 4 },
  activeActions: { gap: 12, marginTop: 16 },
  completeAction: { minHeight: 56, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FAF9F6' },
  completeActionText: { fontFamily: headline, color: '#121212', fontSize: 18, fontWeight: '900', letterSpacing: 1.2 },
  stopAction: { minHeight: 56, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#565B5D' },
  stopActionText: { fontFamily: headline, color: '#FAF9F6', fontSize: 15, fontWeight: '900', letterSpacing: 1.1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.987 }] },

  logRoot: { flex: 1, backgroundColor: '#FAF9F6' },
  logPage: { flex: 1, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#FAF9F6' },
  ledger: { flex: 1, marginTop: 16, borderWidth: 2, borderColor: '#1B365D', backgroundColor: '#FAF9F6', padding: 22, position: 'relative' },
  ledgerBlueTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: '#1B365D' },
  ledgerHeadingRow: { marginTop: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: '#121212' },
  ledgerTitle: { color: '#121212', fontFamily: serif, fontSize: 30, lineHeight: 35, fontWeight: '900' },
  ledgerCode: { color: '#686A68', fontFamily: mono, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: 5 },
  ledgerMark: { fontFamily: body, color: '#1B365D', fontSize: 18 },
  dashedRule: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#C8C4BB', marginTop: 22 },
  ledgerPrompt: { color: '#686A68', fontFamily: serif, fontStyle: 'italic', fontSize: 13, lineHeight: 20, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: '#1B365D', marginTop: 20, marginBottom: 28 },
  ledgerRows: { borderTopWidth: 2, borderTopColor: '#121212' },
  ledgerRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: '#C8C4BB' },
  ledgerLabel: { color: '#686A68', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  ledgerValue: { color: '#121212', fontFamily: metric, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  stopInputWrap: { minWidth: 92, alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: '#1B365D' },
  stopInput: { minWidth: 92, color: '#121212', fontFamily: metric, fontSize: 44, lineHeight: 50, fontWeight: '900', textAlign: 'right', paddingVertical: 4, fontVariant: ['tabular-nums'] },
  logActions: { gap: 12, marginTop: 16 },
  stitchedAction: { minHeight: 56, borderWidth: 2, borderStyle: 'dashed', borderColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  stitchedActionText: { color: '#121212', fontFamily: headline, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  returnAction: { minHeight: 52, borderWidth: 1, borderColor: '#C8C4BB', alignItems: 'center', justifyContent: 'center' },
  returnActionText: { color: '#686A68', fontFamily: headline, fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  flash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF9F6', paddingHorizontal: 24 },
  flashLight: { backgroundColor: '#FAF9F6' },
  flashValue: { color: '#121212', fontFamily: metric, fontSize: 116, lineHeight: 122, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },
  stamp: { borderWidth: 5, borderColor: '#B22222', paddingHorizontal: 18, paddingVertical: 8, marginTop: -18, backgroundColor: '#FAF9F6' },
  stampText: { color: '#B22222', fontFamily: serif, fontSize: 25, fontWeight: '900', letterSpacing: 3 },
  recordStamp: { borderWidth: 2, borderColor: '#1B365D' },
  recordStampText: { color: '#1B365D', fontFamily: mono, fontSize: 17, letterSpacing: 2 },
  flashMeta: { color: '#686A68', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: 24, textAlign: 'center' },
  retrySaveAction: { minWidth: 220, minHeight: 56, marginTop: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#121212', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  retrySaveActionText: { color: '#121212', fontFamily: headline, fontSize: 13, fontWeight: '900', letterSpacing: 1.1 },

  trainingBand: { minHeight: 64, marginTop: 16, borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#1B365D', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  trainingBandLabel: { color: '#D5DBE2', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  trainingBandMarks: { flexDirection: 'row', gap: 5 },
  trainingMark: { width: 10, height: 22, borderWidth: 1, borderColor: '#53595B' },
  trainingMarkDone: { backgroundColor: '#1B365D', borderColor: '#1B365D' },
  trainingMat: { flex: 1, minHeight: 330, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  trainingNumber: { color: '#FAF9F6', fontFamily: metric, fontSize: 112, lineHeight: 120, fontWeight: '900', letterSpacing: -6, fontVariant: ['tabular-nums'] },
  trainingUnit: { color: '#8B9091', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  trainingSession: { position: 'absolute', bottom: 14, right: 2, color: '#A9B9CF', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, fontVariant: ['tabular-nums'] },
});
