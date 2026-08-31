import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import * as KeepAwake from 'expo-keep-awake';
import { DeviceMotion } from 'expo-sensors';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
  View,
} from 'react-native';

type EntrySource = 'pocket' | 'manual';
type SensitivityKey = 'high' | 'medium' | 'low';
type Screen = 'home' | 'session' | 'history';
type SessionStatus = 'countdown' | 'running';
type MotionPhase = 'neutral' | 'positive';

type Entry = {
  id: string;
  amount: number;
  source: EntrySource;
  date: string;
  createdAt: string;
};

type PersistedState = {
  onboarded: boolean;
  baseTotal: number;
  entries: Entry[];
  sensitivity: SensitivityKey;
};

const STORAGE_KEY = 'push-total-state-v1';
const KEEP_AWAKE_TAG = 'push-total-pocket-session';

const BG = '#F4F2EC';
const INK = '#10100F';
const MUTED = '#77746D';
const LINE = '#D8D4CA';
const WHITE = '#FFFFFF';
const ACCENT = '#315CFF';
const ACCENT_SOFT = '#DDE5FF';
const MINT = '#DCEFE6';
const DANGER = '#A23A34';

const UPDATE_MS = 40;
const MAX_SESSION_MS = 90_000;
const AUTO_FINISH_MS = 7_000;
const IGNORE_START_MS = 1_100;
const MIN_REP_MS = 480;
const MAX_HALF_CYCLE_MS = 2_300;

const SENSITIVITY: Record<SensitivityKey, { label: string; threshold: number }> = {
  high: { label: '민감', threshold: 0.42 },
  medium: { label: '보통', threshold: 0.62 },
  low: { label: '둔감', threshold: 0.88 },
};

const initialState: PersistedState = {
  onboarded: false,
  baseTotal: 0,
  entries: [],
  sensitivity: 'medium',
};

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatNumber(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString('en-US');
}

function parsePositiveInt(value: string) {
  const number = Number(value.replace(/[^0-9]/g, ''));
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.floor(number);
}

function safeEntry(raw: any): Entry | null {
  const amount = Math.floor(Number(raw?.amount));
  const createdAt = typeof raw?.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt))
    ? raw.createdAt
    : null;
  if (!createdAt || !Number.isFinite(amount) || amount <= 0) return null;
  const created = new Date(createdAt);
  return {
    id: typeof raw?.id === 'string' && raw.id
      ? raw.id
      : `${created.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    amount,
    source: raw?.source === 'pocket' ? 'pocket' : 'manual',
    date: typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
      ? raw.date
      : localDateKey(created),
    createdAt,
  };
}

function startOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const distance = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - distance);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sumSince(entries: Entry[], start: Date) {
  const threshold = start.getTime();
  return entries.reduce((sum, item) => (
    new Date(item.createdAt).getTime() >= threshold ? sum + item.amount : sum
  ), 0);
}

function groupByDay(entries: Entry[]) {
  const map = new Map<string, number>();
  entries.forEach((entry) => map.set(entry.date, (map.get(entry.date) ?? 0) + entry.amount));
  return [...map.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function lastSevenDays(entries: Entry[]) {
  const grouped = new Map(groupByDay(entries).map((item) => [item.date, item.amount]));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return {
      key,
      label: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
      amount: grouped.get(key) ?? 0,
    };
  });
}

function canUseGlass() {
  try {
    return Platform.OS === 'ios' && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

function GlassSurface({ children, style, interactive = false }: { children: React.ReactNode; style?: any; interactive?: boolean }) {
  if (canUseGlass()) {
    return (
      <GlassView
        isInteractive={interactive}
        glassEffectStyle="regular"
        tintColor="#FFFFFF22"
        style={[styles.glassBase, style]}
      >
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.glassBase, styles.glassFallback, style]}>{children}</View>;
}

export default function App() {
  const [state, setState] = useState<PersistedState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [manualOpen, setManualOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [existingValue, setExistingValue] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [sessionCount, setSessionCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const [toast, setToast] = useState<string | null>(null);

  const totalScale = useRef(new Animated.Value(1)).current;
  const repScale = useRef(new Animated.Value(1)).current;
  const livePulse = useRef(new Animated.Value(0)).current;
  const toastY = useRef(new Animated.Value(-20)).current;

  const subscriptionRef = useRef<any>(null);
  const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const lastCountAtRef = useRef(0);
  const positiveAtRef = useRef(0);
  const phaseRef = useRef<MotionPhase>('neutral');
  const smoothRef = useRef(0);
  const countRef = useRef(0);
  const finishingRef = useRef(false);
  const sensitivityRef = useRef<SensitivityKey>('medium');
  const finishSessionRef = useRef<(automatic?: boolean) => void>(() => undefined);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          const entries = Array.isArray(parsed.entries)
            ? parsed.entries.map(safeEntry).filter((item): item is Entry => item !== null)
            : [];
          const sensitivity: SensitivityKey = parsed.sensitivity === 'high' || parsed.sensitivity === 'low'
            ? parsed.sensitivity
            : 'medium';
          setState({
            onboarded: Boolean(parsed.onboarded),
            baseTotal: Math.max(0, Math.floor(Number(parsed.baseTotal) || 0)),
            entries,
            sensitivity,
          });
          sensitivityRef.current = sensitivity;
        }
      } catch {
        Alert.alert('기록 불러오기 실패', '저장된 기록을 읽지 못했어요. 앱을 다시 실행해 주세요.');
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      Alert.alert('기록 저장 실패', '이 기기에 기록을 저장하지 못했어요.');
    });
  }, [state, loaded]);

  useEffect(() => {
    sensitivityRef.current = state.sensitivity;
  }, [state.sensitivity]);

  const clearSessionInfrastructure = () => {
    subscriptionRef.current?.remove?.();
    subscriptionRef.current = null;
    countdownTimersRef.current.forEach(clearTimeout);
    countdownTimersRef.current = [];
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    maxTimerRef.current = null;
    idleTimerRef.current = null;
    elapsedTimerRef.current = null;
    void KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
  };

  useEffect(() => () => clearSessionInfrastructure(), []);

  const todayKey = localDateKey();
  const entriesTotal = useMemo(() => state.entries.reduce((sum, entry) => sum + entry.amount, 0), [state.entries]);
  const lifetimeTotal = state.baseTotal + entriesTotal;
  const todayEntries = useMemo(() => state.entries.filter((entry) => entry.date === todayKey), [state.entries, todayKey]);
  const todayTotal = useMemo(() => todayEntries.reduce((sum, entry) => sum + entry.amount, 0), [todayEntries]);
  const weekTotal = useMemo(() => sumSince(state.entries, startOfWeek()), [state.entries]);
  const monthTotal = useMemo(() => sumSince(state.entries, startOfMonth()), [state.entries]);
  const dailyHistory = useMemo(() => groupByDay(state.entries), [state.entries]);
  const sevenDays = useMemo(() => lastSevenDays(state.entries), [state.entries]);
  const maxSeven = Math.max(1, ...sevenDays.map((item) => item.amount));
  const recentEntries = useMemo(
    () => [...state.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
    [state.entries],
  );

  const animateTotal = () => {
    totalScale.setValue(1);
    Animated.sequence([
      Animated.spring(totalScale, { toValue: 1.045, useNativeDriver: true, speed: 28, bounciness: 8 }),
      Animated.spring(totalScale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 6 }),
    ]).start();
  };

  const animateRep = () => {
    repScale.setValue(1);
    Animated.sequence([
      Animated.spring(repScale, { toValue: 1.10, useNativeDriver: true, speed: 34, bounciness: 8 }),
      Animated.spring(repScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
    ]).start();
    livePulse.setValue(0);
    Animated.timing(livePulse, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  };

  const showToast = (message: string) => {
    setToast(message);
    toastY.setValue(-18);
    Animated.sequence([
      Animated.spring(toastY, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 7 }),
      Animated.delay(1800),
      Animated.timing(toastY, { toValue: -18, duration: 180, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const saveEntry = (amount: number, source: EntrySource) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const now = new Date();
    const entry: Entry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      amount: Math.floor(amount),
      source,
      date: localDateKey(now),
      createdAt: now.toISOString(),
    };
    setState((current) => ({ ...current, entries: [...current.entries, entry] }));
    animateTotal();
    showToast(`+${formatNumber(amount)} · ${source === 'pocket' ? 'Pocket' : '직접 기록'}`);
  };

  const addManual = (amount: number) => {
    saveEntry(amount, 'manual');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const submitCustom = () => {
    const amount = parsePositiveInt(customValue);
    if (!amount) {
      Alert.alert('숫자를 확인해 주세요', '1 이상의 푸쉬업 개수를 입력해 주세요.');
      return;
    }
    addManual(amount);
    setCustomValue('');
    setManualOpen(false);
  };

  const finishSession = (automatic = false) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const finalCount = countRef.current;
    clearSessionInfrastructure();
    if (finalCount > 0) {
      saveEntry(finalCount, 'pocket');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else {
      showToast('감지된 푸쉬업이 없어요');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
    setScreen('home');
    setSessionCount(0);
    countRef.current = 0;
    setCountdown(3);
    setElapsed(0);
    setTimeout(() => { finishingRef.current = false; }, automatic ? 250 : 0);
  };
  finishSessionRef.current = finishSession;

  const processMotion = (motion: any) => {
    const acc = motion?.acceleration;
    const withGravity = motion?.accelerationIncludingGravity;
    if (!acc || !withGravity) return;

    const gx = withGravity.x - acc.x;
    const gy = withGravity.y - acc.y;
    const gz = withGravity.z - acc.z;
    const gNorm = Math.sqrt(gx * gx + gy * gy + gz * gz);
    if (!Number.isFinite(gNorm) || gNorm < 1) return;

    const projected = (acc.x * gx + acc.y * gy + acc.z * gz) / gNorm;
    const smooth = smoothRef.current * 0.72 + projected * 0.28;
    smoothRef.current = smooth;

    const now = Date.now();
    const sinceStart = now - startedAtRef.current;
    if (sinceStart <= IGNORE_START_MS) return;

    const threshold = SENSITIVITY[sensitivityRef.current].threshold;
    if (phaseRef.current === 'neutral' && smooth > threshold) {
      phaseRef.current = 'positive';
      positiveAtRef.current = now;
      return;
    }

    if (phaseRef.current !== 'positive') return;
    const halfCycle = now - positiveAtRef.current;

    if (smooth < -threshold) {
      const sinceLast = now - lastCountAtRef.current;
      if (halfCycle <= MAX_HALF_CYCLE_MS && sinceLast >= MIN_REP_MS) {
        countRef.current += 1;
        lastCountAtRef.current = now;
        setSessionCount(countRef.current);
        animateRep();

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => finishSessionRef.current(true), AUTO_FINISH_MS);
      }
      phaseRef.current = 'neutral';
    } else if (halfCycle > MAX_HALF_CYCLE_MS) {
      phaseRef.current = 'neutral';
    }
  };

  const beginListening = async () => {
    try {
      await KeepAwake.activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    } catch {
      // A failed keep-awake request should not block counting.
    }

    DeviceMotion.setUpdateInterval(UPDATE_MS);
    startedAtRef.current = Date.now();
    lastCountAtRef.current = 0;
    positiveAtRef.current = 0;
    phaseRef.current = 'neutral';
    smoothRef.current = 0;
    countRef.current = 0;
    setSessionCount(0);
    setElapsed(0);
    setSessionStatus('running');

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    subscriptionRef.current = DeviceMotion.addListener(processMotion);
    maxTimerRef.current = setTimeout(() => finishSessionRef.current(true), MAX_SESSION_MS);
    elapsedTimerRef.current = setInterval(() => setElapsed(Date.now() - startedAtRef.current), 200);
  };

  const startPocket = async () => {
    clearSessionInfrastructure();
    finishingRef.current = false;
    countRef.current = 0;
    setSessionCount(0);
    setElapsed(0);
    setCountdown(3);

    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        Alert.alert('동작 센서를 사용할 수 없음', '실제 iPhone에서 Pocket Count를 다시 시도해 주세요.');
        return;
      }
      const permission = await DeviceMotion.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('동작 권한이 필요해요', '주머니 속 움직임으로 푸쉬업을 세려면 동작 및 피트니스 권한을 허용해 주세요.');
        return;
      }

      setScreen('session');
      setSessionStatus('countdown');
      [1, 2, 3].forEach((second) => {
        const timer = setTimeout(() => {
          const left = 3 - second;
          if (left > 0) setCountdown(left);
          else void beginListening();
        }, second * 1000);
        countdownTimersRef.current.push(timer);
      });
    } catch {
      Alert.alert('센서 시작 실패', '센서를 시작하지 못했어요. 앱을 다시 실행한 뒤 시도해 주세요.');
    }
  };

  const cancelSession = () => {
    if (sessionStatus === 'running' && countRef.current > 0) {
      Alert.alert('세트를 끝낼까요?', `${countRef.current}개를 저장하고 홈으로 돌아갑니다.`, [
        { text: '계속', style: 'cancel' },
        { text: '끝내기', onPress: () => finishSession(false) },
      ]);
      return;
    }
    clearSessionInfrastructure();
    setScreen('home');
  };

  const finishOnboarding = () => {
    const base = existingValue.trim() === '' ? 0 : parsePositiveInt(existingValue);
    if (existingValue.trim() !== '' && base === null) {
      Alert.alert('숫자를 확인해 주세요', '기존 누적 푸쉬업 개수를 숫자로 입력해 주세요.');
      return;
    }
    setState({ onboarded: true, baseTotal: base ?? 0, entries: [], sensitivity: 'medium' });
    setExistingValue('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };

  const deleteEntry = (entry: Entry) => {
    Alert.alert('기록 삭제', `${formatNumber(entry.amount)}개 기록을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => setState((current) => ({
          ...current,
          entries: current.entries.filter((item) => item.id !== entry.id),
        })),
      },
    ]);
  };

  const beginEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setEditingValue(String(entry.amount));
  };

  const saveEdit = () => {
    if (!editingId) return;
    const amount = parsePositiveInt(editingValue);
    if (!amount) {
      Alert.alert('숫자를 확인해 주세요', '1 이상의 개수를 입력해 주세요.');
      return;
    }
    setState((current) => ({
      ...current,
      entries: current.entries.map((entry) => entry.id === editingId ? { ...entry, amount } : entry),
    }));
    setEditingId(null);
    setEditingValue('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const exportData = async () => {
    const lines = ['created_at,date,pushups,source'];
    [...state.entries]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .forEach((item) => lines.push(`${item.createdAt},${item.date},${item.amount},${item.source}`));
    lines.push(`existing_total_before_app,,${state.baseTotal},base`);
    lines.push(`lifetime_total,,${lifetimeTotal},total`);
    try {
      await Share.share({ title: 'PUSH TOTAL 기록', message: lines.join('\n') });
    } catch {
      Alert.alert('내보내기 실패', '잠시 후 다시 시도해 주세요.');
    }
  };

  const resetAll = () => {
    Alert.alert('모든 기록 삭제', '이 기기에 저장된 PUSH TOTAL 기록을 모두 삭제합니다. 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '모두 삭제',
        style: 'destructive',
        onPress: () => {
          setState(initialState);
          setScreen('home');
          setPrivacyOpen(false);
          setEditingId(null);
        },
      },
    ]);
  };

  if (!loaded) {
    return <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" /></SafeAreaView>;
  }

  if (!state.onboarded) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View pointerEvents="none" style={styles.ambientBlue} />
        <View pointerEvents="none" style={styles.ambientMint} />
        <KeyboardAvoidingView style={styles.onboarding} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View>
            <Text style={styles.wordmark}>PUSH TOTAL</Text>
            <Text style={styles.onboardingKicker}>YOUR PUSH-UP PEDOMETER</Text>
            <Text style={styles.onboardingTitle}>푸쉬업도{`\n`}걸음처럼 쌓이게.</Text>
            <Text style={styles.onboardingBody}>세트를 시작하고 iPhone을 앞주머니에 넣으세요. 반복 움직임을 감지해 푸쉬업을 누적합니다.</Text>
          </View>

          <GlassSurface style={styles.onboardingCard}>
            <Text style={styles.cardLabel}>이미 해온 기록이 있다면</Text>
            <View style={styles.existingRow}>
              <TextInput
                value={existingValue}
                onChangeText={(value) => setExistingValue(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="예: 12,500"
                placeholderTextColor="#9C9992"
                style={styles.existingInput}
              />
              <Text style={styles.existingUnit}>개</Text>
            </View>
            <Pressable onPress={finishOnboarding} style={({ pressed }) => [styles.onboardingButton, pressed && styles.pressScale]}>
              <Text style={styles.onboardingButtonText}>시작하기</Text>
            </Pressable>
            <Text style={styles.microcopy}>입력하지 않으면 0부터 시작합니다. 모든 기록은 이 iPhone에만 저장됩니다.</Text>
          </GlassSurface>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (screen === 'session') {
    const pulseOpacity = livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });
    const pulseScale = livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] });
    return (
      <SafeAreaView style={styles.sessionSafe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.sessionWrap}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionWordmark}>PUSH TOTAL</Text>
            <Text style={styles.sessionStatusLabel}>{sessionStatus === 'countdown' ? 'READY' : 'POCKET COUNT'}</Text>
          </View>

          <View style={styles.sessionCenter}>
            {sessionStatus === 'countdown' ? (
              <>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.sessionTitle}>앞주머니에 넣으세요</Text>
                <Text style={styles.sessionBody}>진동이 한 번 오면 평소 속도로 시작하세요.</Text>
              </>
            ) : (
              <>
                <View style={styles.liveHaloWrap}>
                  <Animated.View style={[styles.liveHalo, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
                  <View style={styles.liveDot} />
                </View>
                <Text style={styles.listeningText}>LISTENING</Text>
                <Animated.Text style={[styles.sessionCount, { transform: [{ scale: repScale }] }]}>{sessionCount}</Animated.Text>
                <Text style={styles.sessionBody}>마지막 푸쉬업 뒤 7초 동안 새 반복이 없으면 자동 저장됩니다.</Text>
                <Text style={styles.elapsedText}>{(elapsed / 1000).toFixed(1)} SEC</Text>
              </>
            )}
          </View>

          <Pressable onPress={cancelSession} style={({ pressed }) => [styles.sessionStop, pressed && styles.sessionStopPressed]}>
            <Text style={styles.sessionStopText}>{sessionStatus === 'running' && sessionCount > 0 ? '지금 끝내기' : '취소'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'history') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View pointerEvents="none" style={styles.ambientBlueHistory} />
        <ScrollView contentContainerStyle={styles.historyContent} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <Pressable onPress={() => setScreen('home')} hitSlop={14}><Text style={styles.textButton}>← 홈</Text></Pressable>
            <Text style={styles.wordmark}>RECORD</Text>
          </View>

          <View style={styles.summaryGrid}>
            <GlassSurface style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>이번 주</Text>
              <Text style={styles.summaryValue}>{formatNumber(weekTotal)}</Text>
            </GlassSurface>
            <GlassSurface style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>이번 달</Text>
              <Text style={styles.summaryValue}>{formatNumber(monthTotal)}</Text>
            </GlassSurface>
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.sectionLabel}>최근 7일</Text>
            <View style={styles.chartRow}>
              {sevenDays.map((item) => {
                const height = item.amount === 0 ? 5 : Math.max(12, (item.amount / maxSeven) * 92);
                return (
                  <View key={item.key} style={styles.barColumn}>
                    <Text style={styles.barValue}>{item.amount > 0 ? formatNumber(item.amount) : ''}</Text>
                    <View style={styles.barTrack}><View style={[styles.barFill, { height }]} /></View>
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>최근 기록</Text>
            {recentEntries.length === 0 ? (
              <Text style={styles.emptyText}>아직 기록이 없어요.</Text>
            ) : recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                {editingId === entry.id ? (
                  <View style={styles.editRow}>
                    <TextInput
                      value={editingValue}
                      onChangeText={(value) => setEditingValue(value.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      style={styles.editInput}
                      autoFocus
                    />
                    <Text style={styles.editUnit}>개</Text>
                    <Pressable onPress={saveEdit}><Text style={styles.saveEdit}>저장</Text></Pressable>
                    <Pressable onPress={() => setEditingId(null)}><Text style={styles.cancelEdit}>취소</Text></Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.entryLeft}>
                      <View style={styles.sourcePill}><Text style={styles.sourcePillText}>{entry.source === 'pocket' ? 'POCKET' : 'MANUAL'}</Text></View>
                      <View>
                        <Text style={styles.entryAmount}>{formatNumber(entry.amount)}개</Text>
                        <Text style={styles.entryTime}>{entry.date} · {new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                    </View>
                    <View style={styles.entryActions}>
                      <Pressable onPress={() => beginEdit(entry)} hitSlop={10}><Text style={styles.entryEdit}>수정</Text></Pressable>
                      <Pressable onPress={() => deleteEntry(entry)} hitSlop={10}><Text style={styles.entryDelete}>삭제</Text></Pressable>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>Pocket Count 민감도</Text>
            <Text style={styles.settingsBody}>기본은 보통. 실제보다 적게 세면 민감, 많이 세면 둔감으로 조정하세요.</Text>
            <View style={styles.segmentRow}>
              {(Object.keys(SENSITIVITY) as SensitivityKey[]).map((key) => {
                const selected = state.sensitivity === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setState((current) => ({ ...current, sensitivity: key }))}
                    style={[styles.segment, selected && styles.segmentSelected]}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{SENSITIVITY[key].label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.dataSection}>
            <Pressable onPress={exportData} style={styles.outlineButton}><Text style={styles.outlineButtonText}>전체 기록 내보내기</Text></Pressable>
            <Pressable onPress={() => setPrivacyOpen((value) => !value)} hitSlop={10}><Text style={styles.privacyLink}>개인정보 처리방침 {privacyOpen ? '접기' : '보기'}</Text></Pressable>
            {privacyOpen && (
              <View style={styles.privacyBox}>
                <Text style={styles.privacyTitle}>PUSH TOTAL 개인정보 처리방침</Text>
                <Text style={styles.privacyText}>PUSH TOTAL은 계정을 만들지 않으며 이름, 이메일, 위치, 연락처 또는 광고 식별자를 수집하지 않습니다. 동작 센서 데이터는 푸쉬업 횟수를 계산하기 위해 기기에서 실시간 처리되며 서버로 전송하거나 저장하지 않습니다. 푸쉬업 기록은 이 iPhone의 로컬 저장소에만 저장됩니다. 기록은 이 화면에서 내보내거나 모두 삭제할 수 있습니다.</Text>
              </View>
            )}
            <Pressable onPress={resetAll} hitSlop={10}><Text style={styles.resetAll}>모든 기록 삭제</Text></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View pointerEvents="none" style={styles.ambientBlue} />
      <View pointerEvents="none" style={styles.ambientMintHome} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <Text style={styles.wordmark}>PUSH TOTAL</Text>
            <Pressable onPress={() => setScreen('history')} hitSlop={14}><Text style={styles.textButton}>기록</Text></Pressable>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroLabel}>LIFETIME PUSH-UPS</Text>
            <Animated.Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.48} style={[styles.heroNumber, { transform: [{ scale: totalScale }] }]}>
              {formatNumber(lifetimeTotal)}
            </Animated.Text>
            <View style={styles.todayRow}>
              <Text style={styles.todayStrong}>오늘 {formatNumber(todayTotal)}</Text>
              <Text style={styles.todayDot}>·</Text>
              <Text style={styles.todayMuted}>{todayEntries.length}세트</Text>
            </View>
          </View>

          <Pressable onPress={startPocket} style={({ pressed }) => [styles.pocketPressable, pressed && styles.pressScale]}>
            <GlassSurface style={styles.pocketCard} interactive>
              <View style={styles.pocketTop}>
                <View>
                  <Text style={styles.pocketKicker}>POCKET COUNT</Text>
                  <Text style={styles.pocketTitle}>주머니에 넣고{`\n`}자동으로 세기</Text>
                </View>
                <View style={styles.startOrb}><Text style={styles.startOrbText}>▶</Text></View>
              </View>
              <Text style={styles.pocketBody}>3초 뒤 시작 · 세트가 끝나면 자동 저장</Text>
            </GlassSurface>
          </Pressable>

          <Pressable onPress={() => setManualOpen((value) => !value)} style={styles.manualToggle}>
            <Text style={styles.manualToggleText}>{manualOpen ? '직접 기록 닫기' : '직접 기록'}</Text>
            <Text style={styles.manualToggleIcon}>{manualOpen ? '−' : '+'}</Text>
          </Pressable>

          {manualOpen && (
            <GlassSurface style={styles.manualPanel}>
              <Text style={styles.cardLabel}>방금 한 세트</Text>
              <View style={styles.quickRow}>
                {[10, 20, 30, 50].map((amount) => (
                  <Pressable key={amount} onPress={() => { addManual(amount); setManualOpen(false); }} style={({ pressed }) => [styles.quickButton, pressed && styles.pressScale]}>
                    <Text style={styles.quickButtonText}>{amount}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.customRow}>
                <TextInput
                  value={customValue}
                  onChangeText={(value) => setCustomValue(value.replace(/[^0-9]/g, ''))}
                  onSubmitEditing={submitCustom}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  placeholder="다른 개수"
                  placeholderTextColor="#98958E"
                  style={styles.customInput}
                />
                <Pressable onPress={submitCustom} style={({ pressed }) => [styles.customButton, pressed && styles.pressScale]}>
                  <Text style={styles.customButtonText}>기록</Text>
                </Pressable>
              </View>
            </GlassSurface>
          )}

          <Text style={styles.homeFootnote}>Pocket Count는 iPhone 동작 센서로 반복 움직임을 추정합니다. 기기 위치와 자세에 따라 오차가 생길 수 있으며 기록 화면에서 언제든 수정할 수 있어요.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {toast && (
        <Animated.View pointerEvents="none" style={[styles.toast, { transform: [{ translateY: toastY }] }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: BG, overflow: 'hidden' },
  sessionSafe: { flex: 1, backgroundColor: '#0C0C0D' },

  ambientBlue: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: ACCENT_SOFT, top: 70, right: -150, opacity: 0.82 },
  ambientBlueHistory: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: ACCENT_SOFT, top: 120, right: -155, opacity: 0.55 },
  ambientMint: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: MINT, bottom: -110, left: -130, opacity: 0.8 },
  ambientMintHome: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: MINT, bottom: 35, left: -150, opacity: 0.56 },

  glassBase: { overflow: 'hidden' },
  glassFallback: { backgroundColor: 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.86)' },
  pressScale: { transform: [{ scale: 0.985 }] },

  wordmark: { color: INK, fontSize: 13, lineHeight: 18, fontWeight: '900', letterSpacing: 1.7 },
  textButton: { color: ACCENT, fontSize: 15, fontWeight: '800' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  onboarding: { flex: 1, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24, justifyContent: 'space-between' },
  onboardingKicker: { marginTop: 58, color: ACCENT, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  onboardingTitle: { marginTop: 12, color: INK, fontSize: 48, lineHeight: 52, fontWeight: '900', letterSpacing: -2.5 },
  onboardingBody: { marginTop: 18, maxWidth: 340, color: MUTED, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  onboardingCard: { padding: 18, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' },
  cardLabel: { color: MUTED, fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  existingRow: { marginTop: 10, minHeight: 54, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center' },
  existingInput: { flex: 1, color: INK, fontSize: 25, fontWeight: '900', paddingVertical: 8 },
  existingUnit: { color: MUTED, fontSize: 14, fontWeight: '800' },
  onboardingButton: { marginTop: 16, minHeight: 58, borderRadius: 18, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  onboardingButtonText: { color: WHITE, fontSize: 17, fontWeight: '900' },
  microcopy: { marginTop: 12, color: MUTED, fontSize: 11, lineHeight: 17, fontWeight: '600' },

  homeContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 32 },
  hero: { marginTop: 52 },
  heroLabel: { color: MUTED, fontSize: 11, fontWeight: '900', letterSpacing: 1.35 },
  heroNumber: { marginTop: 1, color: INK, fontSize: 86, lineHeight: 98, fontWeight: '900', letterSpacing: -5, fontVariant: ['tabular-nums'] },
  todayRow: { marginTop: 7, flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  todayStrong: { color: INK, fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] },
  todayDot: { color: MUTED, fontSize: 14, fontWeight: '700' },
  todayMuted: { color: MUTED, fontSize: 14, fontWeight: '700' },

  pocketPressable: { marginTop: 42, borderRadius: 30 },
  pocketCard: { minHeight: 222, padding: 22, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', justifyContent: 'space-between' },
  pocketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pocketKicker: { color: ACCENT, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  pocketTitle: { marginTop: 10, color: INK, fontSize: 32, lineHeight: 37, fontWeight: '900', letterSpacing: -1.3 },
  pocketBody: { color: MUTED, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  startOrb: { width: 55, height: 55, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  startOrbText: { marginLeft: 3, color: WHITE, fontSize: 16, fontWeight: '900' },

  manualToggle: { marginTop: 18, minHeight: 54, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  manualToggleText: { color: INK, fontSize: 15, fontWeight: '800' },
  manualToggleIcon: { color: MUTED, fontSize: 24, fontWeight: '500' },
  manualPanel: { marginTop: 12, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.58)' },
  quickRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  quickButton: { flex: 1, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  quickButtonText: { color: INK, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  customRow: { marginTop: 9, flexDirection: 'row', gap: 8 },
  customInput: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: LINE, paddingHorizontal: 14, color: INK, fontSize: 17, fontWeight: '800' },
  customButton: { width: 78, minHeight: 52, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  customButtonText: { color: WHITE, fontSize: 15, fontWeight: '900' },
  homeFootnote: { marginTop: 20, color: MUTED, fontSize: 11, lineHeight: 17, fontWeight: '600' },

  toast: { position: 'absolute', top: 14, alignSelf: 'center', minHeight: 42, paddingHorizontal: 16, borderRadius: 21, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
  toastText: { color: WHITE, fontSize: 13, fontWeight: '900' },

  sessionWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 26 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionWordmark: { color: '#F7F7F5', fontSize: 13, fontWeight: '900', letterSpacing: 1.7 },
  sessionStatusLabel: { color: '#727276', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  sessionCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdownNumber: { color: WHITE, fontSize: 152, lineHeight: 166, fontWeight: '900', letterSpacing: -8, fontVariant: ['tabular-nums'] },
  sessionTitle: { marginTop: 12, color: WHITE, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -1 },
  sessionBody: { marginTop: 10, maxWidth: 310, color: '#8C8C91', fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  listeningText: { marginTop: 18, color: '#6E82FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  sessionCount: { marginTop: 6, color: WHITE, fontSize: 148, lineHeight: 162, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },
  elapsedText: { marginTop: 14, color: '#5E5E63', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  liveHaloWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  liveHalo: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#7187FF' },
  sessionStop: { minHeight: 58, borderRadius: 20, borderWidth: 1, borderColor: '#2D2D30', backgroundColor: '#18181A', alignItems: 'center', justifyContent: 'center' },
  sessionStopPressed: { transform: [{ scale: 0.985 }], backgroundColor: '#202023' },
  sessionStopText: { color: '#F4F4F3', fontSize: 16, fontWeight: '900' },

  historyContent: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 54 },
  summaryGrid: { flexDirection: 'row', gap: 10, marginTop: 28 },
  summaryCell: { flex: 1, minHeight: 112, padding: 17, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.58)', justifyContent: 'space-between' },
  summaryLabel: { color: MUTED, fontSize: 12, fontWeight: '800' },
  summaryValue: { color: INK, fontSize: 31, fontWeight: '900', letterSpacing: -1.1, fontVariant: ['tabular-nums'] },
  chartSection: { marginTop: 32 },
  sectionLabel: { color: MUTED, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  chartRow: { marginTop: 16, height: 146, flexDirection: 'row', gap: 7, alignItems: 'flex-end' },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { height: 16, color: MUTED, fontSize: 9, fontWeight: '800' },
  barTrack: { width: '72%', height: 96, borderRadius: 7, backgroundColor: '#E2DFD7', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 7, backgroundColor: ACCENT },
  barLabel: { marginTop: 7, color: MUTED, fontSize: 10, fontWeight: '800' },
  historySection: { marginTop: 34 },
  emptyText: { marginTop: 16, color: MUTED, fontSize: 14, fontWeight: '600' },
  entryRow: { minHeight: 72, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sourcePill: { minWidth: 62, height: 25, borderRadius: 13, backgroundColor: '#E7E4DC', alignItems: 'center', justifyContent: 'center' },
  sourcePillText: { color: MUTED, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  entryAmount: { color: INK, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  entryTime: { marginTop: 3, color: MUTED, fontSize: 10, fontWeight: '600' },
  entryActions: { flexDirection: 'row', gap: 14 },
  entryEdit: { color: ACCENT, fontSize: 12, fontWeight: '800' },
  entryDelete: { color: DANGER, fontSize: 12, fontWeight: '800' },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  editInput: { width: 90, height: 42, borderRadius: 12, borderWidth: 1, borderColor: LINE, backgroundColor: WHITE, paddingHorizontal: 12, color: INK, fontSize: 18, fontWeight: '900' },
  editUnit: { color: MUTED, fontSize: 13, fontWeight: '700' },
  saveEdit: { marginLeft: 'auto', color: ACCENT, fontSize: 13, fontWeight: '900' },
  cancelEdit: { color: MUTED, fontSize: 13, fontWeight: '800' },

  settingsSection: { marginTop: 36, paddingTop: 24, borderTopWidth: 1, borderColor: LINE },
  settingsBody: { marginTop: 7, color: MUTED, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  segmentRow: { marginTop: 14, flexDirection: 'row', padding: 4, borderRadius: 17, backgroundColor: '#E6E2DA' },
  segment: { flex: 1, minHeight: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: WHITE, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 7, shadowOffset: { width: 0, height: 2 } },
  segmentText: { color: MUTED, fontSize: 13, fontWeight: '800' },
  segmentTextSelected: { color: INK },

  dataSection: { marginTop: 36, gap: 18, alignItems: 'center' },
  outlineButton: { width: '100%', minHeight: 54, borderRadius: 17, borderWidth: 1, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText: { color: INK, fontSize: 14, fontWeight: '900' },
  privacyLink: { color: ACCENT, fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
  privacyBox: { width: '100%', padding: 16, borderRadius: 18, backgroundColor: '#EAE7DF' },
  privacyTitle: { color: INK, fontSize: 13, fontWeight: '900' },
  privacyText: { marginTop: 8, color: MUTED, fontSize: 11, lineHeight: 18, fontWeight: '600' },
  resetAll: { color: DANGER, fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
});
