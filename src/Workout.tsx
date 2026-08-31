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
  Text,
  TextInput,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { formatSeconds, targetForLevel, trainingPlan } from './core';
import { C } from './styles';

const mono = 'Courier New';
const serif = 'Georgia';
const metric = 'Arial';

function FocusHeader({ code, onClose, light = false }: { code: string; onClose: () => void; light?: boolean }) {
  return (
    <View style={[S.focusHeader, light && S.focusHeaderLight]}>
      <View style={S.codeLockup}>
        <View style={S.blueStitch} />
        <Text style={[S.code, light && S.codeLight]}>{code}</Text>
      </View>
      <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
        <Text style={[S.close, light && S.closeLight]}>×</Text>
      </Pressable>
    </View>
  );
}

function StampFlash({ kind, value }: { kind: 'cleared' | 'recorded'; value: number }) {
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
    <View style={[S.flash, cleared ? S.flashLight : S.flashLight]} pointerEvents="none">
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
      <Text style={S.flashMeta}>{cleared ? 'TRAINING VERIFIED' : 'ATTEMPT LOGGED'}</Text>
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
  onFinish: (success: boolean, seconds: number, actualReps: number) => void;
}) {
  useKeepAwake();
  const target = targetForLevel(level);
  const [seconds, setSeconds] = useState(0);
  const [recordFailure, setRecordFailure] = useState(false);
  const [failedReps, setFailedReps] = useState('');
  const [flash, setFlash] = useState<'cleared' | 'recorded' | null>(null);
  const [flashValue, setFlashValue] = useState(target);

  useEffect(() => {
    if (recordFailure || flash) return;
    const id = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [recordFailure, flash]);

  const finishCleared = () => {
    if (flash) return;
    setFlashValue(target);
    setFlash('cleared');
    setTimeout(() => onFinish(true, seconds, target), 720);
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
    Keyboard.dismiss();
    setFlashValue(reps);
    setFlash('recorded');
    setTimeout(() => onFinish(false, seconds, reps), 620);
  };

  if (flash) return <StampFlash kind={flash} value={flashValue} />;

  if (recordFailure) {
    return (
      <SafeAreaView style={S.logRoot}>
        <KeyboardAvoidingView
          style={S.logPage}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <FocusHeader code={`QUEST / ${String(level).padStart(3, '0')}`} onClose={() => setRecordFailure(false)} light />

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
            <Pressable style={({ pressed }) => [S.returnAction, pressed && S.pressed]} onPress={() => setRecordFailure(false)}>
              <Text style={S.returnActionText}>RETURN TO QUEST</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.activeRoot}>
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

        <Text style={S.activeHint}>직접 횟수를 세고, 자세가 무너지면 STOP HERE. 이 화면은 목표와 시간만 잡아준다.</Text>

        <View style={S.activeActions}>
          <Pressable style={({ pressed }) => [S.completeAction, pressed && S.pressed]} onPress={finishCleared}>
            <Text style={S.completeActionText}>COMPLETE</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [S.stopAction, pressed && S.pressed]} onPress={() => setRecordFailure(true)}>
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
  onFinish: (seconds: number) => void;
}) {
  useKeepAwake();
  const plan = trainingPlan(currentBest, targetForLevel(level));
  const [setNumber, setSetNumber] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [rest, setRest] = useState(false);
  const [restLeft, setRestLeft] = useState(plan.rest);

  useEffect(() => {
    const id = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!rest) return;
    if (restLeft <= 0) {
      setRest(false);
      setRestLeft(plan.rest);
      return;
    }
    const id = setTimeout(() => setRestLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [rest, restLeft, plan.rest]);

  const finishSet = () => {
    if (setNumber >= plan.sets) onFinish(seconds);
    else {
      setSetNumber((v) => v + 1);
      setRest(true);
    }
  };

  return (
    <SafeAreaView style={S.activeRoot}>
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

        <Text style={S.activeHint}>현재 기록에 맞춘 배밀기 보조 훈련. 한 세트를 무리해서 끝내는 것보다 반복 가능한 리듬을 유지해.</Text>

        <Pressable
          style={({ pressed }) => [rest ? S.stopAction : S.completeAction, pressed && S.pressed]}
          onPress={() => (rest ? (setRest(false), setRestLeft(plan.rest)) : finishSet())}
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
  activePage: { flex: 1, paddingHorizontal: 16, paddingBottom: 18, backgroundColor: '#121212' },
  focusHeader: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusHeaderLight: { borderBottomWidth: 1, borderBottomColor: '#C8C4BB' },
  codeLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  blueStitch: { width: 18, height: 3, backgroundColor: '#1B365D' },
  code: { color: '#A8ADAE', fontFamily: mono, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  codeLight: { color: '#1B365D' },
  close: { color: '#A8ADAE', fontSize: 34, lineHeight: 36, fontWeight: '300' },
  closeLight: { color: '#121212' },

  matFrame: { flex: 1, maxHeight: 430, minHeight: 360, marginTop: 24, borderWidth: 2, borderColor: '#354B69', backgroundColor: '#151515', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  matDots: { position: 'absolute', top: 15, left: 15, flexDirection: 'row', gap: 5 },
  matDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#5D6263' },
  targetCenter: { alignItems: 'center' },
  target: { color: '#FAF9F6', fontFamily: metric, fontSize: 116, lineHeight: 124, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },
  targetLabel: { color: '#8B9091', fontFamily: mono, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginTop: 8 },
  elapsed: { position: 'absolute', bottom: 16, right: 16, color: '#7E98BA', fontFamily: mono, fontSize: 10, fontWeight: '900', letterSpacing: 0.7, fontVariant: ['tabular-nums'] },
  activeHint: { color: '#8D9192', fontSize: 11, lineHeight: 17, marginTop: 18, marginHorizontal: 4 },
  activeActions: { gap: 10, marginTop: 18 },
  completeAction: { minHeight: 58, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FAF9F6' },
  completeActionText: { color: '#121212', fontSize: 18, fontWeight: '900', letterSpacing: 1.2 },
  stopAction: { minHeight: 56, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#565B5D' },
  stopActionText: { color: '#FAF9F6', fontSize: 15, fontWeight: '900', letterSpacing: 1.1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.987 }] },

  logRoot: { flex: 1, backgroundColor: '#FAF9F6' },
  logPage: { flex: 1, paddingHorizontal: 16, paddingBottom: 18, backgroundColor: '#FAF9F6' },
  ledger: { flex: 1, marginTop: 18, borderWidth: 2, borderColor: '#1B365D', backgroundColor: '#FAF9F6', padding: 22, position: 'relative' },
  ledgerBlueTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: '#1B365D' },
  ledgerHeadingRow: { marginTop: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: '#121212' },
  ledgerTitle: { color: '#121212', fontFamily: serif, fontSize: 30, lineHeight: 35, fontWeight: '900' },
  ledgerCode: { color: '#686A68', fontFamily: mono, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 5 },
  ledgerMark: { color: '#1B365D', fontSize: 18 },
  dashedRule: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#C8C4BB', marginTop: 22 },
  ledgerPrompt: { color: '#686A68', fontFamily: serif, fontStyle: 'italic', fontSize: 13, lineHeight: 20, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: '#1B365D', marginTop: 20, marginBottom: 28 },
  ledgerRows: { borderTopWidth: 2, borderTopColor: '#121212' },
  ledgerRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: '#C8C4BB' },
  ledgerLabel: { color: '#686A68', fontFamily: mono, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  ledgerValue: { color: '#121212', fontFamily: mono, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  stopInputWrap: { minWidth: 92, alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: '#1B365D' },
  stopInput: { minWidth: 92, color: '#121212', fontFamily: metric, fontSize: 44, lineHeight: 50, fontWeight: '900', textAlign: 'right', paddingVertical: 4, fontVariant: ['tabular-nums'] },
  logActions: { gap: 10, marginTop: 14 },
  stitchedAction: { minHeight: 56, borderWidth: 2, borderStyle: 'dashed', borderColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  stitchedActionText: { color: '#121212', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  returnAction: { minHeight: 52, borderWidth: 1, borderColor: '#C8C4BB', alignItems: 'center', justifyContent: 'center' },
  returnActionText: { color: '#686A68', fontFamily: mono, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  flash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF9F6', paddingHorizontal: 24 },
  flashLight: { backgroundColor: '#FAF9F6' },
  flashValue: { color: '#121212', fontFamily: metric, fontSize: 116, lineHeight: 122, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },
  stamp: { borderWidth: 5, borderColor: '#B22222', paddingHorizontal: 18, paddingVertical: 8, marginTop: -18, backgroundColor: '#FAF9F6' },
  stampText: { color: '#B22222', fontFamily: serif, fontSize: 25, fontWeight: '900', letterSpacing: 3 },
  recordStamp: { borderWidth: 2, borderColor: '#1B365D' },
  recordStampText: { color: '#1B365D', fontFamily: mono, fontSize: 17, letterSpacing: 2 },
  flashMeta: { color: '#686A68', fontFamily: mono, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 24 },

  trainingBand: { minHeight: 62, marginTop: 18, borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#1B365D', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  trainingBandLabel: { color: '#D5DBE2', fontFamily: mono, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  trainingBandMarks: { flexDirection: 'row', gap: 5 },
  trainingMark: { width: 10, height: 22, borderWidth: 1, borderColor: '#53595B' },
  trainingMarkDone: { backgroundColor: '#1B365D', borderColor: '#1B365D' },
  trainingMat: { flex: 1, minHeight: 330, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  trainingNumber: { color: '#FAF9F6', fontFamily: metric, fontSize: 112, lineHeight: 120, fontWeight: '900', letterSpacing: -6, fontVariant: ['tabular-nums'] },
  trainingUnit: { color: '#8B9091', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  trainingSession: { position: 'absolute', bottom: 14, right: 2, color: '#7E98BA', fontFamily: mono, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, fontVariant: ['tabular-nums'] },
});
