import AsyncStorage from '@react-native-async-storage/async-storage';
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
type Screen = 'home' | 'wall' | 'session' | 'history';
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

// PUSH TOTAL visual system: masonry / accumulated effort.
const BG = '#F9F7F2';
const SURFACE = '#F0EEE9';
const SURFACE_HIGH = '#E4E2DD';
const INK = '#121212';
const MUTED = '#5F5E5E';
const LINE = '#DCC1BA';
const BRICK = '#A64B35';
const BRICK_DARK = '#873420';
const BRICK_LIGHT = '#B45A42';
const SENSOR = '#00E5FF';
const WHITE = '#FFFFFF';
const DANGER = '#9B342F';
const DARK_LINE = '#343434';
const BRICK_REPS = 100;

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

function BrickWall({ filledBricks, compact = false }: { filledBricks: number; compact?: boolean }) {
  const visibleFilled = Math.min(Math.max(0, filledBricks), compact ? 16 : 160);
  const minimumSlots = compact ? 16 : 28;
  const capacity = Math.max(minimumSlots, Math.ceil((visibleFilled + (compact ? 4 : 12)) / 4) * 4);
  const rows = Math.ceil(capacity / 4);
  let index = 0;

  return (
    <View style={[styles.wallCanvas, compact && styles.wallCanvasCompact]}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <View key={rowIndex} style={[styles.brickRow, rowIndex % 2 === 1 && styles.brickRowOffset]}>
          {Array.from({ length: 4 }, (_, brickIndex) => {
            const filled = index < visibleFilled;
            const brickNumber = index;
            index += 1;
            return (
              <View
                key={`${rowIndex}-${brickIndex}`}
                style={[
                  styles.brick,
                  compact && styles.brickCompact,
                  filled ? styles.brickFilled : styles.brickEmpty,
                  filled && brickNumber % 3 === 1 && styles.brickFilledAlt,
                  filled && brickNumber % 5 === 2 && styles.brickFilledDark,
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function BottomNav({ active, onNavigate }: { active: 'home' | 'wall' | 'history'; onNavigate: (screen: Screen) => void }) {
  const item = (key: 'home' | 'wall' | 'history', label: string, glyph: string) => {
    const selected = active === key;
    return (
      <Pressable key={key} onPress={() => onNavigate(key)} style={[styles.navItem, selected && styles.navItemActive]}>
        <Text style={[styles.navGlyph, selected && styles.navTextActive]}>{glyph}</Text>
        <Text style={[styles.navText, selected && styles.navTextActive]}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <View style={styles.bottomNav}>
      {item('home', 'DASHBOARD', '▦')}
      {item('wall', 'THE WALL', '▤')}
      {item('history', 'HISTORY', '↺')}
    </View>
  );
}

export default function App() {
  const [state, setState] = useState<PersistedState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
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
  const sevenDays = useMemo(() => lastSevenDays(state.entries), [state.entries]);
  const maxSeven = Math.max(1, ...sevenDays.map((item) => item.amount));
  const recentEntries = useMemo(
    () => [...state.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
    [state.entries],
  );
  const lastEntry = recentEntries[0];
  const brickCount = Math.floor(lifetimeTotal / BRICK_REPS);
  const brickProgress = lifetimeTotal % BRICK_REPS;
  const toNextBrick = brickProgress === 0 ? BRICK_REPS : BRICK_REPS - brickProgress;
  const bestSet = useMemo(() => state.entries.reduce((max, entry) => Math.max(max, entry.amount), 0), [state.entries]);

  const animateTotal = () => {
    totalScale.setValue(1);
    Animated.sequence([
      Animated.spring(totalScale, { toValue: 1.035, useNativeDriver: true, speed: 28, bounciness: 7 }),
      Animated.spring(totalScale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 5 }),
    ]).start();
  };

  const animateRep = () => {
    repScale.setValue(1);
    Animated.sequence([
      Animated.spring(repScale, { toValue: 1.08, useNativeDriver: true, speed: 34, bounciness: 7 }),
      Animated.spring(repScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5 }),
    ]).start();
    livePulse.setValue(0);
    Animated.timing(livePulse, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  };

  const showToast = (message: string) => {
    setToast(message);
    toastY.setValue(-18);
    Animated.sequence([
      Animated.spring(toastY, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 7 }),
      Animated.delay(1500),
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
    showToast(`+${formatNumber(amount)} RECORDED`);
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
      showToast('NO REPS DETECTED');
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
      // Counting should continue even if keep-awake is unavailable.
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
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={styles.onboarding} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.introHero}>
            <View style={styles.introHeader}>
              <Text style={styles.introWordmark}>PUSH TOTAL</Text>
              <Text style={styles.introCode}>PT / 001</Text>
            </View>
            <View style={styles.introWallWrap}>
              <BrickWall filledBricks={12} compact />
            </View>
            <Text style={styles.introTitle}>BUILD IT.</Text>
            <Text style={styles.introTagline}>ONE REP AT A TIME.</Text>
          </View>

          <View style={styles.onboardingForm}>
            <Text style={styles.kicker}>YOUR PUSH-UP PEDOMETER</Text>
            <Text style={styles.onboardingTitle}>푸쉬업을 쌓아{`\n`}나만의 벽을 만드세요.</Text>
            <Text style={styles.onboardingBody}>100개의 푸쉬업이 벽돌 하나가 됩니다. 지금까지 해온 푸쉬업이 있다면 시작 숫자로 가져올 수 있어요.</Text>
            <Text style={styles.fieldLabel}>EXISTING TOTAL / OPTIONAL</Text>
            <View style={styles.existingRow}>
              <TextInput
                value={existingValue}
                onChangeText={(value) => setExistingValue(value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#8E8B86"
                style={styles.existingInput}
              />
              <Text style={styles.existingUnit}>PUSHES</Text>
            </View>
            <Pressable onPress={finishOnboarding} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>START BUILDING</Text>
            </Pressable>
            <Text style={styles.microcopy}>기록과 센서 처리는 이 iPhone 안에서만 이루어집니다.</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (screen === 'session') {
    const pulseOpacity = livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
    const pulseScale = livePulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.4] });
    return (
      <SafeAreaView style={styles.sessionSafe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.sessionWrap}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionWordmark}>PUSH TOTAL</Text>
            <Pressable onPress={cancelSession} hitSlop={12}>
              <Text style={styles.endSetText}>{sessionStatus === 'running' && sessionCount > 0 ? 'END SET' : 'CANCEL'}</Text>
            </Pressable>
          </View>

          <View style={styles.sessionCenter}>
            {sessionStatus === 'countdown' ? (
              <>
                <View style={styles.pocketIllustration}>
                  <View style={styles.phoneShape} />
                  <View style={styles.pocketCurve} />
                </View>
                <Text style={styles.sessionKicker}>POCKET READY</Text>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.sessionTitle}>앞주머니에 넣으세요.</Text>
                <Text style={styles.sessionBody}>진동이 한 번 오면 평소 속도로 푸쉬업을 시작하세요.</Text>
              </>
            ) : (
              <>
                <View style={styles.sensorStatus}>
                  <View style={styles.liveMarker}>
                    <Animated.View style={[styles.liveHalo, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
                    <View style={styles.liveDot} />
                  </View>
                  <Text style={styles.sensorText}>SENSOR ACTIVE</Text>
                </View>
                <Animated.Text style={[styles.sessionCount, { transform: [{ scale: repScale }] }]}>{sessionCount}</Animated.Text>
                <Text style={styles.sessionMetric}>CURRENT SET</Text>
                <Text style={styles.sessionBody}>마지막 반복 뒤 7초 동안 새 움직임이 없으면 자동 저장됩니다.</Text>
              </>
            )}
          </View>

          <View style={styles.sessionBottomStats}>
            <View>
              <Text style={styles.sessionStatLabel}>TODAY</Text>
              <Text style={styles.sessionStatValue}>{formatNumber(todayTotal)}</Text>
            </View>
            <View style={styles.sessionStatRight}>
              <Text style={styles.sessionStatLabel}>LIFETIME</Text>
              <Text style={styles.sessionStatValue}>{formatNumber(lifetimeTotal)}</Text>
            </View>
          </View>
          {sessionStatus === 'running' && <Text style={styles.elapsedText}>{(elapsed / 1000).toFixed(1)} SEC</Text>}
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'wall') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.wallScreenContent}>
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageKicker}>ARCHITECTURAL RECORD</Text>
              <Text style={styles.pageTitle}>THE WALL</Text>
            </View>
            <Text style={styles.headerCode}>100 : 1</Text>
          </View>

          <View style={styles.wallMetricBlock}>
            <Text style={styles.wallMetricLabel}>TOTAL VOLUME</Text>
            <Text style={styles.wallMetricNumber}>{formatNumber(brickCount)}</Text>
            <Text style={styles.wallMetricUnit}>BRICKS</Text>
            <View style={styles.pushCountChip}><Text style={styles.pushCountChipText}>{formatNumber(lifetimeTotal)} PUSHES</Text></View>
          </View>

          <View style={styles.wallFrame}>
            <BrickWall filledBricks={brickCount} />
          </View>
          {brickCount > 160 && <Text style={styles.wallNote}>최근 160개 벽돌을 표시합니다. 전체 벽돌 수는 위 숫자에 반영되어 있어요.</Text>}
          <Text style={styles.wallLegend}>1 BRICK = 100 PUSHES · 빈 칸은 다음에 쌓일 자리입니다.</Text>
        </ScrollView>
        <BottomNav active="wall" onNavigate={setScreen} />
      </SafeAreaView>
    );
  }

  if (screen === 'history') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.historyContent} keyboardShouldPersistTaps="handled">
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageKicker}>MASONRY LOG</Text>
              <Text style={styles.pageTitle}>HISTORY</Text>
            </View>
            <Text style={styles.headerCode}>{recentEntries.length} LOGS</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCell, styles.summaryCellBrick]}>
              <Text style={styles.summaryLabelLight}>THIS WEEK</Text>
              <Text style={styles.summaryValueLight}>{formatNumber(weekTotal)}</Text>
            </View>
            <View style={styles.summaryCell}>
              <Text style={styles.summaryLabel}>THIS MONTH</Text>
              <Text style={styles.summaryValue}>{formatNumber(monthTotal)}</Text>
            </View>
          </View>

          <View style={styles.chartSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>LAST 7 DAYS</Text>
              <Text style={styles.sectionMeta}>DAILY PUSHES</Text>
            </View>
            <View style={styles.chartRow}>
              {sevenDays.map((item) => {
                const height = item.amount === 0 ? 4 : Math.max(10, (item.amount / maxSeven) * 92);
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>RECENT LOG</Text>
              <Text style={styles.sectionMeta}>EDITABLE</Text>
            </View>
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
                    <Text style={styles.editUnit}>PUSHES</Text>
                    <Pressable onPress={saveEdit}><Text style={styles.saveEdit}>SAVE</Text></Pressable>
                    <Pressable onPress={() => setEditingId(null)}><Text style={styles.cancelEdit}>CANCEL</Text></Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.entryLeft}>
                      <View style={[styles.entryBrick, entry.source === 'pocket' && styles.entryBrickSensor]} />
                      <View>
                        <Text style={styles.entryAmount}>{formatNumber(entry.amount)}</Text>
                        <Text style={styles.entryTime}>{entry.date} · {new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · {entry.source === 'pocket' ? 'POCKET' : 'MANUAL'}</Text>
                      </View>
                    </View>
                    <View style={styles.entryActions}>
                      <Pressable onPress={() => beginEdit(entry)} hitSlop={10}><Text style={styles.entryEdit}>EDIT</Text></Pressable>
                      <Pressable onPress={() => deleteEntry(entry)} hitSlop={10}><Text style={styles.entryDelete}>DELETE</Text></Pressable>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>POCKET SENSITIVITY</Text>
            <Text style={styles.settingsBody}>실제보다 적게 세면 민감, 많이 세면 둔감으로 조정하세요.</Text>
            <View style={styles.segmentRow}>
              {(Object.keys(SENSITIVITY) as SensitivityKey[]).map((key) => {
                const selected = state.sensitivity === key;
                return (
                  <Pressable key={key} onPress={() => setState((current) => ({ ...current, sensitivity: key }))} style={[styles.segment, selected && styles.segmentSelected]}>
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{SENSITIVITY[key].label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.dataSection}>
            <Pressable onPress={exportData} style={styles.outlineButton}><Text style={styles.outlineButtonText}>EXPORT ALL RECORDS</Text></Pressable>
            <Pressable onPress={() => setPrivacyOpen((value) => !value)} hitSlop={10}><Text style={styles.privacyLink}>개인정보 처리방침 {privacyOpen ? '접기' : '보기'}</Text></Pressable>
            {privacyOpen && (
              <View style={styles.privacyBox}>
                <Text style={styles.privacyTitle}>PUSH TOTAL 개인정보 처리방침</Text>
                <Text style={styles.privacyText}>PUSH TOTAL은 계정을 만들지 않으며 이름, 이메일, 위치, 연락처 또는 광고 식별자를 수집하지 않습니다. 동작 센서 데이터는 푸쉬업 횟수를 계산하기 위해 기기에서 실시간 처리되며 서버로 전송하거나 저장하지 않습니다. 푸쉬업 기록은 이 iPhone의 로컬 저장소에만 저장됩니다.</Text>
              </View>
            )}
            <Pressable onPress={resetAll} hitSlop={10}><Text style={styles.resetAll}>모든 기록 삭제</Text></Pressable>
          </View>
        </ScrollView>
        <BottomNav active="history" onNavigate={setScreen} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
          <View style={styles.homeHeader}>
            <Text style={styles.wordmark}>PUSH TOTAL</Text>
            <Text style={styles.headerCode}>BUILD / {String(brickCount).padStart(3, '0')}</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>LIFETIME PUSHES</Text>
            <Animated.Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.42} style={[styles.heroNumber, { transform: [{ scale: totalScale }] }]}>
              {formatNumber(lifetimeTotal)}
            </Animated.Text>
            <Text style={styles.heroSub}>BUILD IT. ONE REP AT A TIME.</Text>
          </View>

          <View style={styles.bentoGrid}>
            <Pressable onPress={() => setScreen('wall')} style={[styles.metricTile, styles.metricTileBrick]}>
              <Text style={styles.metricLabelLight}>BRICKS</Text>
              <Text style={styles.metricValueLight}>{formatNumber(brickCount)}</Text>
              <Text style={styles.metricHintLight}>VIEW WALL →</Text>
            </Pressable>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>TO NEXT BRICK</Text>
              <Text style={styles.metricValue}>{toNextBrick}</Text>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${brickProgress}%` }]} /></View>
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>BEST SET</Text>
              <Text style={styles.metricValue}>{bestSet || '—'}</Text>
              <Text style={styles.metricHint}>{bestSet ? `${bestSet}/100` : 'NO SET YET'}</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricLabel}>TODAY · {todayEntries.length} SETS</Text>
              <Text style={styles.metricValue}>{formatNumber(todayTotal)}</Text>
              <Text style={styles.metricHint}>PUSHES</Text>
            </View>
          </View>

          <Pressable onPress={startPocket} style={({ pressed }) => [styles.pocketButton, pressed && styles.pressed]}>
            <View>
              <Text style={styles.pocketButtonKicker}>SENSOR MODE</Text>
              <Text style={styles.pocketButtonText}>POCKET COUNT</Text>
            </View>
            <View style={styles.sensorOrb}><View style={styles.sensorOrbDot} /></View>
          </Pressable>

          <View style={styles.manualSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>MANUAL LOG</Text>
              <Text style={styles.sectionMeta}>FAST INPUT</Text>
            </View>
            <View style={styles.quickRow}>
              {[10, 20, 30, 50].map((amount) => (
                <Pressable key={amount} onPress={() => addManual(amount)} style={({ pressed }) => [styles.quickButton, pressed && styles.quickButtonPressed]}>
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
                placeholderTextColor="#827D78"
                style={styles.customInput}
              />
              <Pressable onPress={submitCustom} style={({ pressed }) => [styles.customButton, pressed && styles.pressed]}>
                <Text style={styles.customButtonText}>LOG</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.homeFootnote}>푸쉬업을 걸음처럼 누적하고, 100개마다 벽돌 하나를 쌓습니다. Pocket Count는 iPhone 동작 센서로 반복 움직임을 추정합니다.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav active="home" onNavigate={setScreen} />

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
  safe: { flex: 1, backgroundColor: BG },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },

  // Brick wall primitives
  wallCanvas: { width: '100%', backgroundColor: '#CBC4BB', paddingVertical: 2, overflow: 'hidden', gap: 2 },
  wallCanvasCompact: { backgroundColor: '#2A2927', paddingVertical: 3, opacity: 0.95 },
  brickRow: { width: '100%', flexDirection: 'row', gap: 2, paddingHorizontal: 2 },
  brickRowOffset: { paddingHorizontal: 24 },
  brick: { flex: 1, height: 40, borderRadius: 2, borderWidth: 1, borderColor: '#7D3526' },
  brickCompact: { height: 24, borderColor: '#652B20' },
  brickFilled: { backgroundColor: BRICK },
  brickFilledAlt: { backgroundColor: BRICK_LIGHT },
  brickFilledDark: { backgroundColor: BRICK_DARK },
  brickEmpty: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: '#9F958A' },

  // Shared shell
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 2, borderColor: INK },
  wordmark: { color: BRICK_DARK, fontSize: 21, fontWeight: '900', letterSpacing: -0.8 },
  headerCode: { color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 18, borderBottomWidth: 3, borderColor: INK },
  pageKicker: { color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  pageTitle: { marginTop: 4, color: INK, fontSize: 40, lineHeight: 42, fontWeight: '900', letterSpacing: -2.2 },

  // Onboarding / rebuild
  onboarding: { flex: 1, backgroundColor: BG },
  introHero: { flex: 1.05, backgroundColor: INK, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 22, justifyContent: 'space-between', overflow: 'hidden' },
  introHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  introWordmark: { color: BRICK, fontSize: 16, fontWeight: '900', letterSpacing: 0.8 },
  introCode: { color: '#77716D', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  introWallWrap: { marginVertical: 18, borderWidth: 1, borderColor: '#3A3734', overflow: 'hidden' },
  introTitle: { color: BG, fontSize: 55, lineHeight: 55, fontWeight: '900', letterSpacing: -3.2 },
  introTagline: { marginTop: 4, alignSelf: 'flex-start', color: BRICK, fontSize: 11, fontWeight: '900', letterSpacing: 2.0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: BRICK, paddingVertical: 5 },
  onboardingForm: { flex: 1, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 20, justifyContent: 'center' },
  kicker: { color: BRICK_DARK, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  onboardingTitle: { marginTop: 7, color: INK, fontSize: 30, lineHeight: 34, fontWeight: '900', letterSpacing: -1.3 },
  onboardingBody: { marginTop: 10, color: MUTED, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  fieldLabel: { marginTop: 17, color: MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  existingRow: { marginTop: 5, minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: INK },
  existingInput: { flex: 1, color: INK, fontSize: 27, fontWeight: '900', paddingVertical: 6 },
  existingUnit: { color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1.0 },
  primaryButton: { marginTop: 14, minHeight: 52, backgroundColor: INK, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: BG, fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  microcopy: { marginTop: 9, color: MUTED, fontSize: 9, lineHeight: 14, fontWeight: '600' },

  // Dashboard
  homeContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 118 },
  heroCard: { marginTop: 18, minHeight: 196, backgroundColor: INK, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  heroLabel: { color: '#9A9690', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  heroNumber: { marginTop: 2, color: BG, fontSize: 86, lineHeight: 94, fontWeight: '900', letterSpacing: -5.5, fontVariant: ['tabular-nums'] },
  heroSub: { marginTop: 4, color: BRICK, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  bentoGrid: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricTile: { width: '48.5%', minHeight: 126, backgroundColor: BG, borderWidth: 2, borderColor: INK, padding: 13, justifyContent: 'space-between' },
  metricTileBrick: { backgroundColor: BRICK },
  metricLabel: { color: MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 1.0 },
  metricLabelLight: { color: '#F6DCD5', fontSize: 9, fontWeight: '900', letterSpacing: 1.0 },
  metricValue: { color: INK, fontSize: 37, lineHeight: 40, fontWeight: '900', letterSpacing: -1.8, fontVariant: ['tabular-nums'] },
  metricValueLight: { color: BG, fontSize: 37, lineHeight: 40, fontWeight: '900', letterSpacing: -1.8, fontVariant: ['tabular-nums'] },
  metricHint: { color: MUTED, fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  metricHintLight: { color: '#F6DCD5', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  progressTrack: { height: 10, borderWidth: 2, borderColor: INK, backgroundColor: SURFACE_HIGH, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: BRICK, borderRightWidth: 1, borderColor: INK },
  pocketButton: { marginTop: 18, minHeight: 86, paddingHorizontal: 18, backgroundColor: INK, borderWidth: 2, borderColor: INK, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pocketButtonKicker: { color: SENSOR, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  pocketButtonText: { marginTop: 3, color: BG, fontSize: 21, fontWeight: '900', letterSpacing: 0.7 },
  sensorOrb: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: SENSOR, alignItems: 'center', justifyContent: 'center' },
  sensorOrbDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: SENSOR },
  manualSection: { marginTop: 20, borderTopWidth: 2, borderColor: INK, paddingTop: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { color: INK, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sectionMeta: { color: MUTED, fontSize: 8, fontWeight: '800', letterSpacing: 1.0 },
  quickRow: { marginTop: 11, flexDirection: 'row', gap: 7 },
  quickButton: { flex: 1, height: 48, backgroundColor: BG, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  quickButtonPressed: { backgroundColor: BRICK },
  quickButtonText: { color: INK, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  customRow: { marginTop: 8, flexDirection: 'row', gap: 8 },
  customInput: { flex: 1, minHeight: 48, borderWidth: 2, borderColor: INK, backgroundColor: BG, paddingHorizontal: 12, color: INK, fontSize: 16, fontWeight: '800' },
  customButton: { width: 78, minHeight: 48, backgroundColor: BRICK, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  customButtonText: { color: BG, fontSize: 11, fontWeight: '900', letterSpacing: 1.0 },
  homeFootnote: { marginTop: 17, color: MUTED, fontSize: 10, lineHeight: 16, fontWeight: '600' },

  // Bottom navigation
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 82, paddingBottom: 8, backgroundColor: INK, borderTopWidth: 4, borderColor: BRICK, flexDirection: 'row' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navItemActive: { backgroundColor: BRICK },
  navGlyph: { color: '#AAA49D', fontSize: 20, fontWeight: '900' },
  navText: { marginTop: 3, color: '#AAA49D', fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  navTextActive: { color: BG },

  // The wall
  wallScreenContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 116 },
  wallMetricBlock: { paddingTop: 24, paddingBottom: 22 },
  wallMetricLabel: { color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  wallMetricNumber: { marginTop: 2, color: INK, fontSize: 88, lineHeight: 88, fontWeight: '900', letterSpacing: -5, fontVariant: ['tabular-nums'] },
  wallMetricUnit: { color: BRICK, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2 },
  pushCountChip: { marginTop: 14, alignSelf: 'flex-start', borderWidth: 1, borderColor: INK, paddingHorizontal: 11, paddingVertical: 7 },
  pushCountChipText: { color: INK, fontSize: 11, fontWeight: '900', letterSpacing: 1.0 },
  wallFrame: { backgroundColor: INK, borderWidth: 3, borderColor: INK, padding: 6, maxHeight: 540, overflow: 'hidden' },
  wallLegend: { marginTop: 12, color: MUTED, fontSize: 9, lineHeight: 14, fontWeight: '700', letterSpacing: 0.3 },
  wallNote: { marginTop: 9, color: BRICK_DARK, fontSize: 9, lineHeight: 14, fontWeight: '800' },

  // Session
  sessionSafe: { flex: 1, backgroundColor: INK },
  sessionWrap: { flex: 1, paddingHorizontal: 22, paddingTop: 17, paddingBottom: 24 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderColor: DARK_LINE },
  sessionWordmark: { color: BRICK, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 },
  endSetText: { color: '#8B8782', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sessionCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pocketIllustration: { width: 130, height: 142, borderWidth: 2, borderColor: '#6F6A65', borderTopWidth: 0, borderBottomLeftRadius: 38, borderBottomRightRadius: 38, alignItems: 'center', overflow: 'hidden', marginBottom: 18 },
  phoneShape: { marginTop: 8, width: 62, height: 112, borderWidth: 2, borderColor: BG, borderRadius: 14, backgroundColor: '#292929' },
  pocketCurve: { position: 'absolute', bottom: -42, width: 170, height: 78, borderTopWidth: 2, borderColor: '#6F6A65', borderRadius: 80, backgroundColor: INK },
  sessionKicker: { color: SENSOR, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  countdownNumber: { marginTop: 4, color: BG, fontSize: 118, lineHeight: 126, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },
  sessionTitle: { color: BG, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.8 },
  sessionBody: { marginTop: 8, maxWidth: 300, color: '#8E8984', fontSize: 11, lineHeight: 17, fontWeight: '600', textAlign: 'center' },
  sensorStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  liveMarker: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  liveHalo: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: SENSOR },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: SENSOR },
  sensorText: { color: SENSOR, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  sessionCount: { color: BG, fontSize: 160, lineHeight: 170, fontWeight: '900', letterSpacing: -8, fontVariant: ['tabular-nums'] },
  sessionMetric: { color: '#77726E', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  sessionBottomStats: { borderTopWidth: 1, borderColor: DARK_LINE, paddingTop: 13, flexDirection: 'row', justifyContent: 'space-between' },
  sessionStatRight: { alignItems: 'flex-end' },
  sessionStatLabel: { color: '#77726E', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  sessionStatValue: { marginTop: 2, color: BG, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  elapsedText: { marginTop: 8, color: '#5E5A56', fontSize: 8, fontWeight: '900', letterSpacing: 1.0, textAlign: 'center' },

  // History
  historyContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  summaryGrid: { marginTop: 20, flexDirection: 'row', gap: 10 },
  summaryCell: { flex: 1, minHeight: 116, backgroundColor: BG, borderWidth: 2, borderColor: INK, padding: 13, justifyContent: 'space-between' },
  summaryCellBrick: { backgroundColor: BRICK },
  summaryLabel: { color: MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 1.0 },
  summaryLabelLight: { color: '#F6DCD5', fontSize: 9, fontWeight: '900', letterSpacing: 1.0 },
  summaryValue: { color: INK, fontSize: 31, fontWeight: '900', letterSpacing: -1.4, fontVariant: ['tabular-nums'] },
  summaryValueLight: { color: BG, fontSize: 31, fontWeight: '900', letterSpacing: -1.4, fontVariant: ['tabular-nums'] },
  chartSection: { marginTop: 27, paddingTop: 15, borderTopWidth: 2, borderColor: INK },
  chartRow: { marginTop: 14, height: 140, flexDirection: 'row', gap: 6, alignItems: 'flex-end' },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { height: 15, color: MUTED, fontSize: 8, fontWeight: '800' },
  barTrack: { width: '70%', height: 94, backgroundColor: SURFACE_HIGH, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1, borderColor: INK },
  barFill: { width: '100%', backgroundColor: BRICK },
  barLabel: { marginTop: 6, color: MUTED, fontSize: 9, fontWeight: '900' },
  historySection: { marginTop: 28, paddingTop: 15, borderTopWidth: 2, borderColor: INK },
  emptyText: { marginTop: 14, color: MUTED, fontSize: 12, fontWeight: '600' },
  entryRow: { minHeight: 68, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  entryBrick: { width: 30, height: 15, backgroundColor: BRICK, borderWidth: 1, borderColor: BRICK_DARK },
  entryBrickSensor: { borderColor: SENSOR, borderWidth: 2 },
  entryAmount: { color: INK, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  entryTime: { marginTop: 2, color: MUTED, fontSize: 8, fontWeight: '600' },
  entryActions: { flexDirection: 'row', gap: 10 },
  entryEdit: { color: BRICK_DARK, fontSize: 9, fontWeight: '900' },
  entryDelete: { color: DANGER, fontSize: 9, fontWeight: '900' },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  editInput: { width: 80, height: 40, borderWidth: 2, borderColor: INK, backgroundColor: BG, paddingHorizontal: 10, color: INK, fontSize: 17, fontWeight: '900' },
  editUnit: { color: MUTED, fontSize: 9, fontWeight: '800' },
  saveEdit: { marginLeft: 'auto', color: BRICK_DARK, fontSize: 9, fontWeight: '900' },
  cancelEdit: { color: MUTED, fontSize: 9, fontWeight: '900' },
  settingsSection: { marginTop: 28, paddingTop: 15, borderTopWidth: 2, borderColor: INK },
  settingsBody: { marginTop: 6, color: MUTED, fontSize: 10, lineHeight: 16, fontWeight: '600' },
  segmentRow: { marginTop: 11, flexDirection: 'row', borderWidth: 2, borderColor: INK },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: INK },
  segmentSelected: { backgroundColor: BRICK },
  segmentText: { color: MUTED, fontSize: 10, fontWeight: '900' },
  segmentTextSelected: { color: BG },
  dataSection: { marginTop: 28, gap: 15, alignItems: 'center' },
  outlineButton: { width: '100%', minHeight: 50, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText: { color: INK, fontSize: 10, fontWeight: '900', letterSpacing: 1.0 },
  privacyLink: { color: BRICK_DARK, fontSize: 10, fontWeight: '800', textDecorationLine: 'underline' },
  privacyBox: { width: '100%', padding: 14, backgroundColor: SURFACE, borderLeftWidth: 4, borderColor: BRICK },
  privacyTitle: { color: INK, fontSize: 11, fontWeight: '900' },
  privacyText: { marginTop: 7, color: MUTED, fontSize: 9, lineHeight: 15, fontWeight: '600' },
  resetAll: { color: DANGER, fontSize: 10, fontWeight: '800', textDecorationLine: 'underline' },

  // Toast
  toast: { position: 'absolute', top: 12, alignSelf: 'center', minHeight: 40, paddingHorizontal: 15, backgroundColor: INK, borderBottomWidth: 3, borderColor: BRICK, alignItems: 'center', justifyContent: 'center' },
  toastText: { color: BG, fontSize: 10, fontWeight: '900', letterSpacing: 1.0 },
});
