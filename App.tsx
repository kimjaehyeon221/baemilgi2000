import { DeviceMotion } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';

type RunState = 'idle' | 'countdown' | 'running' | 'stopped';
type Phase = 'neutral' | 'positive';
type Sample = {
  t: number;
  projected: number;
  smooth: number;
  count: number;
};

const BG = '#F4F3EE';
const INK = '#11110F';
const MUTED = '#77756E';
const LINE = '#D8D6CF';
const PANEL = '#FFFFFF';
const ACCENT = '#315CFF';

const UPDATE_MS = 40; // 25 Hz: enough for a slow repetitive movement experiment.
const MAX_RUN_MS = 90_000;
const MIN_REP_MS = 520;
const MAX_HALF_CYCLE_MS = 2_200;

const SENSITIVITY = {
  high: { label: '민감', threshold: 0.42 },
  medium: { label: '보통', threshold: 0.62 },
  low: { label: '둔감', threshold: 0.88 },
} as const;

type SensitivityKey = keyof typeof SENSITIVITY;

function format1(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export default function App() {
  const [runState, setRunState] = useState<RunState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [signal, setSignal] = useState(0);
  const [smoothSignal, setSmoothSignal] = useState(0);
  const [peak, setPeak] = useState(0);
  const [trough, setTrough] = useState(0);
  const [samplesSeen, setSamplesSeen] = useState(0);
  const [expected, setExpected] = useState('10');
  const [sensitivity, setSensitivity] = useState<SensitivityKey>('medium');

  const subscriptionRef = useRef<any>(null);
  const startedAtRef = useRef(0);
  const lastCountAtRef = useRef(0);
  const positiveAtRef = useRef(0);
  const phaseRef = useRef<Phase>('neutral');
  const smoothRef = useRef(0);
  const countRef = useRef(0);
  const samplesRef = useRef<Sample[]>([]);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const threshold = SENSITIVITY[sensitivity].threshold;

  const clearTimers = () => {
    countdownTimersRef.current.forEach(clearTimeout);
    countdownTimersRef.current = [];
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  };

  const stopSubscription = () => {
    subscriptionRef.current?.remove?.();
    subscriptionRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimers();
      stopSubscription();
    };
  }, []);

  useEffect(() => {
    if (runState !== 'running') return;
    const timer = setInterval(() => {
      setElapsed(Date.now() - startedAtRef.current);
    }, 100);
    return () => clearInterval(timer);
  }, [runState]);

  const resetRun = () => {
    clearTimers();
    stopSubscription();
    setRunState('idle');
    setCountdown(3);
    setCount(0);
    countRef.current = 0;
    setElapsed(0);
    setSignal(0);
    setSmoothSignal(0);
    smoothRef.current = 0;
    setPeak(0);
    setTrough(0);
    setSamplesSeen(0);
    phaseRef.current = 'neutral';
    lastCountAtRef.current = 0;
    positiveAtRef.current = 0;
    samplesRef.current = [];
  };

  const stopRun = () => {
    clearTimers();
    stopSubscription();
    if (startedAtRef.current) {
      setElapsed(Date.now() - startedAtRef.current);
    }
    setRunState('stopped');
  };

  const processMotion = (motion: any) => {
    const acc = motion?.acceleration;
    const withGravity = motion?.accelerationIncludingGravity;
    if (!acc || !withGravity) return;

    // DeviceMotion does not expose a gravity vector directly. Subtracting
    // user acceleration from accelerationIncludingGravity gives us one.
    const gx = withGravity.x - acc.x;
    const gy = withGravity.y - acc.y;
    const gz = withGravity.z - acc.z;
    const gNorm = Math.sqrt(gx * gx + gy * gy + gz * gz);
    if (!Number.isFinite(gNorm) || gNorm < 1) return;

    // Project user acceleration onto gravity. This makes the signal mostly
    // independent from whether the phone is upright, sideways, or upside-down
    // inside a pocket.
    const projected = (acc.x * gx + acc.y * gy + acc.z * gz) / gNorm;
    const smooth = smoothRef.current * 0.72 + projected * 0.28;
    smoothRef.current = smooth;

    const now = Date.now();
    const sinceStart = now - startedAtRef.current;
    const activeThreshold = SENSITIVITY[sensitivity].threshold;

    setSignal(projected);
    setSmoothSignal(smooth);
    setPeak((current) => Math.max(current, smooth));
    setTrough((current) => Math.min(current, smooth));
    setSamplesSeen((current) => current + 1);

    // Ignore the first 600 ms after the start vibration so that the vibration
    // itself cannot be mistaken for a push-up.
    if (sinceStart > 600) {
      if (phaseRef.current === 'neutral' && smooth > activeThreshold) {
        phaseRef.current = 'positive';
        positiveAtRef.current = now;
      } else if (phaseRef.current === 'positive') {
        const halfCycle = now - positiveAtRef.current;
        if (smooth < -activeThreshold) {
          const sinceLast = now - lastCountAtRef.current;
          if (halfCycle <= MAX_HALF_CYCLE_MS && sinceLast >= MIN_REP_MS) {
            countRef.current += 1;
            lastCountAtRef.current = now;
            setCount(countRef.current);
          }
          phaseRef.current = 'neutral';
        } else if (halfCycle > MAX_HALF_CYCLE_MS) {
          phaseRef.current = 'neutral';
        }
      }
    }

    samplesRef.current.push({
      t: sinceStart,
      projected,
      smooth,
      count: countRef.current,
    });
  };

  const beginListening = () => {
    DeviceMotion.setUpdateInterval(UPDATE_MS);
    startedAtRef.current = Date.now();
    lastCountAtRef.current = 0;
    positiveAtRef.current = 0;
    phaseRef.current = 'neutral';
    smoothRef.current = 0;
    samplesRef.current = [];
    setSignal(0);
    setSmoothSignal(0);
    setPeak(0);
    setTrough(0);
    setSamplesSeen(0);
    setCount(0);
    countRef.current = 0;
    setElapsed(0);
    setRunState('running');

    // One vibration means "start now". We ignore sensor events immediately
    // after this pulse in the counter logic above.
    Vibration.vibrate(90);
    subscriptionRef.current = DeviceMotion.addListener(processMotion);
    autoStopRef.current = setTimeout(stopRun, MAX_RUN_MS);
  };

  const startRun = async () => {
    resetRun();

    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        Alert.alert('동작 센서를 사용할 수 없음', '이 기기에서는 DeviceMotion 센서를 사용할 수 없어요. 실제 iPhone에서 다시 시도해 주세요.');
        return;
      }

      const permission = await DeviceMotion.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('동작 권한 필요', '주머니 속 반복 움직임을 측정하려면 동작 및 피트니스 센서 권한이 필요해요.');
        return;
      }

      setRunState('countdown');
      setCountdown(3);

      [1, 2, 3].forEach((second) => {
        const timer = setTimeout(() => {
          const left = 3 - second;
          if (left > 0) setCountdown(left);
          else beginListening();
        }, second * 1000);
        countdownTimersRef.current.push(timer);
      });
    } catch {
      Alert.alert('센서 시작 실패', '센서를 시작하지 못했어요. 앱을 다시 실행한 뒤 시도해 주세요.');
    }
  };

  const shareCsv = async () => {
    if (samplesRef.current.length === 0) {
      Alert.alert('데이터 없음', '먼저 센서 실험을 한 번 실행해 주세요.');
      return;
    }
    const lines = ['ms,projected_mps2,smoothed_mps2,count'];
    samplesRef.current.forEach((item) => {
      lines.push(`${item.t},${item.projected.toFixed(4)},${item.smooth.toFixed(4)},${item.count}`);
    });
    await Share.share({
      title: 'PUSH TOTAL pocket sensor test',
      message: lines.join('\n'),
    });
  };

  const expectedNumber = Math.max(0, Math.floor(Number(expected) || 0));
  const difference = count - expectedNumber;
  const accuracy = expectedNumber > 0
    ? Math.max(0, 100 - (Math.abs(difference) / expectedNumber) * 100)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.wordmark}>PUSH TOTAL · LAB</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>POCKET SENSOR</Text></View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>센서가 감지한 푸쉬업</Text>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.meta}>{(elapsed / 1000).toFixed(1)}초 · {samplesSeen} samples</Text>
          </View>

          {runState === 'countdown' && (
            <View style={styles.countdownCard}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownTitle}>앞주머니에 넣으세요</Text>
              <Text style={styles.countdownBody}>짧게 한 번 진동하면 바로 푸쉬업을 시작하세요.</Text>
            </View>
          )}

          {runState === 'running' && (
            <View style={styles.liveCard}>
              <View style={styles.liveDot} />
              <View style={styles.liveCopy}>
                <Text style={styles.liveTitle}>측정 중</Text>
                <Text style={styles.liveBody}>폰은 주머니에 그대로 두고 평소 속도로 푸쉬업하세요.</Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            {runState === 'running' || runState === 'countdown' ? (
              <Pressable style={[styles.mainButton, styles.stopButton]} onPress={stopRun}>
                <Text style={styles.mainButtonText}>측정 중지</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.mainButton} onPress={startRun}>
                <Text style={styles.mainButtonText}>3초 후 측정 시작</Text>
              </Pressable>
            )}
            <Pressable style={styles.resetButton} onPress={resetRun}>
              <Text style={styles.resetButtonText}>초기화</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>민감도</Text>
            <Text style={styles.sectionBody}>첫 실험은 ‘보통’으로. 10개 했는데 적게 잡히면 민감, 너무 많이 잡히면 둔감으로 바꿔보세요.</Text>
            <View style={styles.segmentRow}>
              {(Object.keys(SENSITIVITY) as SensitivityKey[]).map((key) => {
                const selected = key === sensitivity;
                return (
                  <Pressable
                    key={key}
                    disabled={runState === 'running' || runState === 'countdown'}
                    style={[styles.segment, selected && styles.segmentSelected]}
                    onPress={() => setSensitivity(key)}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{SENSITIVITY[key].label}</Text>
                    <Text style={[styles.segmentThreshold, selected && styles.segmentTextSelected]}>{SENSITIVITY[key].threshold.toFixed(2)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>실제 몇 개 했나요?</Text>
            <View style={styles.expectedRow}>
              <TextInput
                value={expected}
                onChangeText={(value) => setExpected(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={styles.expectedInput}
                placeholder="10"
                placeholderTextColor="#A4A19A"
              />
              <Text style={styles.expectedUnit}>개</Text>
            </View>
            {runState === 'stopped' && expectedNumber > 0 && (
              <View style={styles.resultCard}>
                <View><Text style={styles.resultLabel}>센서</Text><Text style={styles.resultValue}>{count}</Text></View>
                <View><Text style={styles.resultLabel}>실제</Text><Text style={styles.resultValue}>{expectedNumber}</Text></View>
                <View><Text style={styles.resultLabel}>오차</Text><Text style={styles.resultValue}>{difference > 0 ? '+' : ''}{difference}</Text></View>
                <View><Text style={styles.resultLabel}>단순 정확도</Text><Text style={styles.resultValue}>{accuracy?.toFixed(0)}%</Text></View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>실시간 센서 값</Text>
            <View style={styles.debugGrid}>
              <View style={styles.debugCell}><Text style={styles.debugLabel}>raw</Text><Text style={styles.debugValue}>{format1(signal)}</Text></View>
              <View style={styles.debugCell}><Text style={styles.debugLabel}>smooth</Text><Text style={styles.debugValue}>{format1(smoothSignal)}</Text></View>
              <View style={styles.debugCell}><Text style={styles.debugLabel}>peak</Text><Text style={styles.debugValue}>{format1(peak)}</Text></View>
              <View style={styles.debugCell}><Text style={styles.debugLabel}>trough</Text><Text style={styles.debugValue}>{format1(trough)}</Text></View>
            </View>
            <Text style={styles.debugHint}>기준값 ±{threshold.toFixed(2)} m/s² · 반복 움직임의 +→− 전환을 1회로 계산</Text>
          </View>

          <Pressable style={styles.shareButton} onPress={shareCsv}>
            <Text style={styles.shareButtonText}>센서 원본 CSV 공유</Text>
          </Pressable>

          <View style={styles.protocol}>
            <Text style={styles.protocolTitle}>실험 방법</Text>
            <Text style={styles.protocolText}>1. 실제 iPhone을 앞주머니에 세로로 넣기</Text>
            <Text style={styles.protocolText}>2. ‘3초 후 측정 시작’을 누르고 주머니에 넣기</Text>
            <Text style={styles.protocolText}>3. 진동 후 평소 속도로 정확히 10개 하기</Text>
            <Text style={styles.protocolText}>4. 3세트 반복하고 각 결과의 센서/실제 오차 확인</Text>
            <Text style={styles.protocolText}>5. 안 맞으면 CSV를 공유해 파형 기준값을 조정하기</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 54 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { color: INK, fontSize: 13, fontWeight: '900', letterSpacing: 1.3 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: '#E4E9FF' },
  badgeText: { color: ACCENT, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  hero: { marginTop: 50, alignItems: 'center' },
  eyebrow: { color: MUTED, fontSize: 14, fontWeight: '700' },
  count: { marginTop: 2, color: INK, fontSize: 126, lineHeight: 136, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },
  meta: { marginTop: -4, color: MUTED, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  countdownCard: { marginTop: 28, padding: 22, borderRadius: 22, backgroundColor: INK, alignItems: 'center' },
  countdownNumber: { color: '#FFFFFF', fontSize: 62, lineHeight: 68, fontWeight: '900' },
  countdownTitle: { marginTop: 5, color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  countdownBody: { marginTop: 6, color: '#C9C7C0', fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  liveCard: { marginTop: 28, padding: 18, borderRadius: 18, backgroundColor: '#E8F7ED', flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 11, height: 11, borderRadius: 99, backgroundColor: '#1E8E4A', marginRight: 12 },
  liveCopy: { flex: 1 },
  liveTitle: { color: '#125C32', fontSize: 15, fontWeight: '900' },
  liveBody: { marginTop: 3, color: '#427258', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  actions: { marginTop: 28, gap: 10 },
  mainButton: { minHeight: 60, borderRadius: 18, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  stopButton: { backgroundColor: INK },
  mainButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  resetButton: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  resetButtonText: { color: MUTED, fontSize: 14, fontWeight: '800' },
  section: { marginTop: 34, paddingTop: 24, borderTopWidth: 1, borderColor: LINE },
  sectionTitle: { color: INK, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
  sectionBody: { marginTop: 7, color: MUTED, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 15 },
  segment: { flex: 1, minHeight: 62, borderRadius: 15, borderWidth: 1, borderColor: LINE, backgroundColor: PANEL, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { borderColor: INK, backgroundColor: INK },
  segmentText: { color: INK, fontSize: 14, fontWeight: '900' },
  segmentTextSelected: { color: '#FFFFFF' },
  segmentThreshold: { marginTop: 2, color: MUTED, fontSize: 10, fontWeight: '700' },
  expectedRow: { marginTop: 14, flexDirection: 'row', alignItems: 'baseline' },
  expectedInput: { width: 130, minHeight: 58, borderWidth: 1, borderColor: LINE, borderRadius: 15, backgroundColor: PANEL, paddingHorizontal: 16, color: INK, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  expectedUnit: { marginLeft: 9, color: MUTED, fontSize: 15, fontWeight: '800' },
  resultCard: { marginTop: 16, padding: 17, borderRadius: 18, backgroundColor: PANEL, borderWidth: 1, borderColor: LINE, flexDirection: 'row', justifyContent: 'space-between' },
  resultLabel: { color: MUTED, fontSize: 10, fontWeight: '800' },
  resultValue: { marginTop: 5, color: INK, fontSize: 21, fontWeight: '900', fontVariant: ['tabular-nums'] },
  debugGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  debugCell: { width: '48%', minHeight: 78, padding: 14, borderRadius: 15, backgroundColor: PANEL, borderWidth: 1, borderColor: LINE, justifyContent: 'space-between' },
  debugLabel: { color: MUTED, fontSize: 10, fontWeight: '800' },
  debugValue: { color: INK, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  debugHint: { marginTop: 9, color: MUTED, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  shareButton: { marginTop: 26, minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  shareButtonText: { color: INK, fontSize: 14, fontWeight: '900' },
  protocol: { marginTop: 30, padding: 18, borderRadius: 18, backgroundColor: '#EAE8E1' },
  protocolTitle: { color: INK, fontSize: 14, fontWeight: '900' },
  protocolText: { marginTop: 8, color: MUTED, fontSize: 12, lineHeight: 18, fontWeight: '600' },
});
