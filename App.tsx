import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  View,
} from 'react-native';

type Entry = {
  id: string;
  amount: number;
  date: string;
  createdAt: string;
};

type PersistedState = {
  onboarded: boolean;
  baseTotal: number;
  entries: Entry[];
};

type Tab = 'home' | 'history';

const STORAGE_KEY = 'push-total-state-v1';
const BG = '#F4F3EE';
const INK = '#11110F';
const MUTED = '#77756E';
const LINE = '#D8D6CF';
const ACCENT = '#315CFF';
const PANEL = '#FFFFFF';
const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

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
  const onlyDigits = value.replace(/[^0-9]/g, '');
  const number = Number(onlyDigits);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.floor(number);
}

function safeEntry(raw: any): Entry | null {
  const amount = Math.floor(Number(raw?.amount));
  const createdAt = typeof raw?.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : null;
  if (!createdAt || !Number.isFinite(amount) || amount <= 0) return null;
  const created = new Date(createdAt);
  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : `${created.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    amount,
    date: typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : localDateKey(created),
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
  return entries.reduce((sum, item) => new Date(item.createdAt).getTime() >= threshold ? sum + item.amount : sum, 0);
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
    return { key, label: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()], amount: grouped.get(key) ?? 0 };
  });
}

const initialState: PersistedState = { onboarded: false, baseTotal: 0, entries: [] };

export default function App() {
  const [state, setState] = useState<PersistedState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [customValue, setCustomValue] = useState('');
  const [existingValue, setExistingValue] = useState('');
  const storageWarningShown = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedState;
          const entries = Array.isArray(parsed.entries)
            ? parsed.entries.map(safeEntry).filter((item): item is Entry => item !== null)
            : [];
          setState({
            onboarded: Boolean(parsed.onboarded),
            baseTotal: Math.max(0, Math.floor(Number(parsed.baseTotal) || 0)),
            entries,
          });
        }
      } catch {
        Alert.alert('기록 불러오기 실패', '저장된 기록을 읽지 못했어. 새 기록을 만들기 전에 앱을 다시 실행해줘.');
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      if (storageWarningShown.current) return;
      storageWarningShown.current = true;
      Alert.alert('기록 저장 실패', '이 기기에 기록을 저장하지 못했어. 저장 공간을 확인한 뒤 다시 시도해줘.');
    });
  }, [state, loaded]);

  const todayKey = localDateKey();
  const entriesTotal = useMemo(() => state.entries.reduce((sum, entry) => sum + entry.amount, 0), [state.entries]);
  const lifetimeTotal = state.baseTotal + entriesTotal;
  const todayTotal = useMemo(
    () => state.entries.filter((entry) => entry.date === todayKey).reduce((sum, entry) => sum + entry.amount, 0),
    [state.entries, todayKey],
  );
  const weekTotal = useMemo(() => sumSince(state.entries, startOfWeek()), [state.entries]);
  const monthTotal = useMemo(() => sumSince(state.entries, startOfMonth()), [state.entries]);
  const dailyHistory = useMemo(() => groupByDay(state.entries), [state.entries]);
  const sevenDays = useMemo(() => lastSevenDays(state.entries), [state.entries]);
  const recentEntries = useMemo(
    () => [...state.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20),
    [state.entries],
  );
  const maxSeven = Math.max(1, ...sevenDays.map((item) => item.amount));
  const nextMilestone = MILESTONES.find((value) => value > lifetimeTotal) ?? null;
  const milestoneStart = nextMilestone ? [...MILESTONES].reverse().find((value) => value <= lifetimeTotal) ?? 0 : lifetimeTotal;
  const milestoneProgress = nextMilestone
    ? Math.min(1, (lifetimeTotal - milestoneStart) / Math.max(1, nextMilestone - milestoneStart))
    : 1;

  const addPushups = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const now = new Date();
    const entry: Entry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      amount: Math.floor(amount),
      date: localDateKey(now),
      createdAt: now.toISOString(),
    };
    setState((current) => ({ ...current, entries: [...current.entries, entry] }));
  };

  const submitCustom = () => {
    const amount = parsePositiveInt(customValue);
    if (!amount) {
      Alert.alert('숫자를 확인해 주세요', '1 이상의 푸쉬업 개수를 입력해 주세요.');
      return;
    }
    const record = () => {
      addPushups(amount);
      setCustomValue('');
    };
    const unusuallyLarge = amount >= 1000 || (todayTotal > 0 && amount >= Math.max(500, todayTotal * 5));
    if (unusuallyLarge) {
      Alert.alert('큰 기록 확인', `${formatNumber(amount)}개를 기록할까요? 잘못 입력한 숫자가 아닌지 한 번만 확인해줘.`, [
        { text: '취소', style: 'cancel' },
        { text: '기록', onPress: record },
      ]);
      return;
    }
    record();
  };

  const undoLast = () => {
    if (state.entries.length === 0) return;
    const last = state.entries[state.entries.length - 1];
    Alert.alert('마지막 기록 취소', `${formatNumber(last.amount)}개 기록을 지울까요?`, [
      { text: '아니요', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => setState((current) => ({ ...current, entries: current.entries.filter((entry) => entry.id !== last.id) })) },
    ]);
  };

  const deleteEntry = (entry: Entry) => {
    const time = new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    Alert.alert('입력 기록 삭제', `${entry.date} ${time}\n${formatNumber(entry.amount)}개 기록을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => setState((current) => ({ ...current, entries: current.entries.filter((item) => item.id !== entry.id) })) },
    ]);
  };

  const finishOnboarding = (baseTotal: number) => {
    setState({ onboarded: true, baseTotal: Math.max(0, Math.floor(baseTotal)), entries: [] });
  };

  const exportData = async () => {
    const lines = ['created_at,date,pushups'];
    [...state.entries]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .forEach((item) => lines.push(`${item.createdAt},${item.date},${item.amount}`));
    lines.push(`existing_total_before_app,,${state.baseTotal}`);
    lines.push(`lifetime_total,,${lifetimeTotal}`);
    try {
      await Share.share({ title: 'PUSH TOTAL 기록', message: lines.join('\n') });
    } catch {
      Alert.alert('내보내기 실패', '잠시 후 다시 시도해 주세요.');
    }
  };

  const resetAll = () => {
    Alert.alert('모든 기록 삭제', '누적 기록을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다. 먼저 기록을 내보낼 수 있어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '모두 삭제',
        style: 'destructive',
        onPress: () => {
          setState(initialState);
          setExistingValue('');
          setCustomValue('');
          setTab('home');
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
        <KeyboardAvoidingView style={styles.onboardingWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View>
            <Text style={styles.wordmark}>PUSH TOTAL</Text>
            <Text style={styles.onboardingTitle}>평생 푸쉬업,{`\n`}몇 개나 할 수 있을까요?</Text>
            <Text style={styles.onboardingBody}>오늘 한 만큼 기록하세요. 나머지는 계속 더해둘게요.</Text>
          </View>
          <View style={styles.onboardingActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="0에서 시작" style={styles.primaryButton} onPress={() => finishOnboarding(0)}>
              <Text style={styles.primaryButtonText}>0에서 시작</Text>
            </Pressable>
            <View style={styles.existingBox}>
              <Text style={styles.existingLabel}>이미 해온 기록이 있다면</Text>
              <View style={styles.existingRow}>
                <TextInput
                  value={existingValue}
                  onChangeText={setExistingValue}
                  keyboardType="number-pad"
                  placeholder="예: 12500"
                  placeholderTextColor="#A4A19A"
                  style={styles.existingInput}
                  accessibilityLabel="기존 누적 푸쉬업 입력"
                />
                <Pressable
                  accessibilityRole="button"
                  style={styles.existingStart}
                  onPress={() => {
                    const value = existingValue.trim() === '' ? 0 : parsePositiveInt(existingValue);
                    if (value === null) {
                      Alert.alert('숫자를 확인해 주세요', '1 이상의 푸쉬업 개수를 입력해 주세요.');
                      return;
                    }
                    finishOnboarding(value);
                  }}
                >
                  <Text style={styles.existingStartText}>이어서 시작</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {tab === 'home' ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
            <View style={styles.topRow}>
              <Text style={styles.wordmark}>PUSH TOTAL</Text>
              <Pressable accessibilityRole="button" onPress={() => setTab('history')} hitSlop={12}><Text style={styles.textButton}>기록</Text></Pressable>
            </View>
            <View style={styles.lifetimeBlock}>
              <Text style={styles.eyebrow}>지금까지</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.55} style={styles.lifetimeNumber}>{formatNumber(lifetimeTotal)}</Text>
              <Text style={styles.unit}>PUSH-UPS</Text>
            </View>
            <View style={styles.todayLine}>
              <Text style={styles.todayLabel}>오늘</Text>
              <Text style={styles.todayValue}>{formatNumber(todayTotal)}</Text>
            </View>
            <View style={styles.quickSection}>
              <Text style={styles.sectionLabel}>추가하기</Text>
              <View style={styles.quickRow}>
                {[10, 20, 50].map((amount) => (
                  <Pressable key={amount} accessibilityRole="button" accessibilityLabel={`${amount}개 추가`} style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]} onPress={() => addPushups(amount)}>
                    <Text style={styles.quickButtonText}>+{amount}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.customRow}>
                <TextInput
                  value={customValue}
                  onChangeText={setCustomValue}
                  onSubmitEditing={submitCustom}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  placeholder="직접 입력"
                  placeholderTextColor="#9C9992"
                  style={styles.customInput}
                  accessibilityLabel="푸쉬업 직접 입력"
                />
                <Pressable accessibilityRole="button" accessibilityLabel="직접 입력한 푸쉬업 기록" style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]} onPress={submitCustom}>
                  <Text style={styles.recordButtonText}>기록</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.bottomUtility}>
              {nextMilestone ? (
                <View style={styles.miniMilestone}><Text style={styles.miniMilestoneText}>{formatNumber(nextMilestone)}까지</Text><Text style={styles.miniMilestoneRemaining}>{formatNumber(nextMilestone - lifetimeTotal)}개</Text></View>
              ) : (
                <View style={styles.miniMilestone}><Text style={styles.miniMilestoneText}>1,000,000+</Text><Text style={styles.miniMilestoneRemaining}>계속 기록 중</Text></View>
              )}
              <Pressable accessibilityRole="button" disabled={state.entries.length === 0} onPress={undoLast}>
                <Text style={[styles.undoText, state.entries.length === 0 && styles.disabledText]}>마지막 입력 취소</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView contentContainerStyle={styles.historyContent}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" onPress={() => setTab('home')} hitSlop={12}><Text style={styles.textButton}>← 홈</Text></Pressable>
            <Text style={styles.wordmark}>RECORD</Text>
          </View>
          <View style={styles.storageNote}>
            <Text style={styles.storageTitle}>이 iPhone에 저장 중</Text>
            <Text style={styles.storageBody}>앱을 삭제하기 전에는 기록 내보내기를 권장해요. iCloud 동기화는 별도 단계로 추가할 예정입니다.</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>이번 주</Text><Text style={styles.summaryValue}>{formatNumber(weekTotal)}</Text></View>
            <View style={styles.summaryCell}><Text style={styles.summaryLabel}>이번 달</Text><Text style={styles.summaryValue}>{formatNumber(monthTotal)}</Text></View>
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.sectionLabel}>최근 7일</Text>
            <View style={styles.chartRow}>
              {sevenDays.map((item) => {
                const ratio = item.amount / maxSeven;
                return (
                  <View key={item.key} style={styles.barColumn}>
                    <Text style={styles.barValue}>{item.amount > 0 ? formatNumber(item.amount) : ''}</Text>
                    <View style={styles.barTrack}><View style={[styles.barFill, { height: `${Math.max(item.amount > 0 ? 10 : 0, ratio * 100)}%` }]} /></View>
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.milestoneCard}>
            <Text style={styles.sectionLabel}>다음 마일스톤</Text>
            {nextMilestone ? (
              <>
                <View style={styles.milestoneHeadlineRow}><Text style={styles.milestoneBig}>{formatNumber(nextMilestone)}</Text><Text style={styles.milestoneSmall}>{formatNumber(nextMilestone - lifetimeTotal)}개 남음</Text></View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(2, milestoneProgress * 100)}%` }]} /></View>
              </>
            ) : <Text style={styles.milestoneBig}>1,000,000+</Text>}
          </View>
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>일별 기록</Text>
            {dailyHistory.length === 0 ? <Text style={styles.emptyText}>아직 기록이 없습니다.</Text> : dailyHistory.slice(0, 30).map((item) => (
              <View key={item.date} style={styles.historyRow}><Text style={styles.historyDate}>{item.date}</Text><Text style={styles.historyAmount}>{formatNumber(item.amount)}</Text></View>
            ))}
          </View>
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>최근 입력 · 잘못 기록했다면 삭제</Text>
            {recentEntries.length === 0 ? <Text style={styles.emptyText}>아직 입력 기록이 없습니다.</Text> : recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View>
                  <Text style={styles.entryAmount}>+{formatNumber(entry.amount)}</Text>
                  <Text style={styles.entryTime}>{entry.date} · {new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => deleteEntry(entry)} hitSlop={10}><Text style={styles.entryDelete}>삭제</Text></Pressable>
              </View>
            ))}
          </View>
          <View style={styles.dataActions}>
            <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={exportData}><Text style={styles.secondaryButtonText}>전체 기록 내보내기</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={resetAll} hitSlop={10}><Text style={styles.deleteText}>모든 기록 삭제</Text></Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: BG },
  onboardingWrap: { flex: 1, paddingHorizontal: 24, paddingTop: 42, paddingBottom: 26, justifyContent: 'space-between', backgroundColor: BG },
  wordmark: { color: INK, fontSize: 14, lineHeight: 18, fontWeight: '800', letterSpacing: 1.5 },
  onboardingTitle: { marginTop: 54, color: INK, fontSize: 46, lineHeight: 52, fontWeight: '800', letterSpacing: -2.2 },
  onboardingBody: { marginTop: 18, color: MUTED, fontSize: 16, lineHeight: 24, fontWeight: '500' },
  onboardingActions: { gap: 14 },
  primaryButton: { minHeight: 58, borderRadius: 14, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  existingBox: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: LINE, backgroundColor: '#FAF9F5' },
  existingLabel: { color: MUTED, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  existingRow: { flexDirection: 'row', gap: 10 },
  existingInput: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: LINE, paddingHorizontal: 14, color: INK, backgroundColor: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  existingStart: { minHeight: 48, paddingHorizontal: 14, borderRadius: 10, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  existingStartText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  homeContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 32 },
  historyContent: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 50 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textButton: { color: ACCENT, fontSize: 15, fontWeight: '800' },
  lifetimeBlock: { marginTop: 68 },
  eyebrow: { color: MUTED, fontSize: 14, fontWeight: '700' },
  lifetimeNumber: { marginTop: 2, color: INK, fontSize: 92, lineHeight: 100, fontWeight: '900', letterSpacing: -5, fontVariant: ['tabular-nums'] },
  unit: { marginTop: -4, color: MUTED, fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  todayLine: { marginTop: 40, paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  todayLabel: { color: MUTED, fontSize: 15, fontWeight: '700' },
  todayValue: { color: INK, fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  quickSection: { marginTop: 34 },
  sectionLabel: { color: MUTED, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickButton: { flex: 1, minHeight: 64, backgroundColor: PANEL, borderWidth: 1, borderColor: LINE, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickButtonText: { color: INK, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.55 },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  customInput: { flex: 1, minHeight: 56, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', color: INK, fontSize: 18, fontWeight: '700' },
  recordButton: { width: 86, minHeight: 56, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  recordButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  bottomUtility: { marginTop: 34, gap: 18, paddingTop: 20, borderTopWidth: 1, borderColor: LINE },
  miniMilestone: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  miniMilestoneText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  miniMilestoneRemaining: { color: INK, fontSize: 15, fontWeight: '800' },
  undoText: { color: MUTED, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  disabledText: { opacity: 0.35 },
  storageNote: { marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: LINE, backgroundColor: '#FAF9F5' },
  storageTitle: { color: INK, fontSize: 13, fontWeight: '800' },
  storageBody: { marginTop: 5, color: MUTED, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  summaryGrid: { flexDirection: 'row', gap: 10, marginTop: 24 },
  summaryCell: { flex: 1, padding: 18, minHeight: 110, borderRadius: 14, backgroundColor: PANEL, borderWidth: 1, borderColor: LINE, justifyContent: 'space-between' },
  summaryLabel: { color: MUTED, fontSize: 13, fontWeight: '700' },
  summaryValue: { color: INK, fontSize: 30, fontWeight: '900', fontVariant: ['tabular-nums'] },
  chartCard: { marginTop: 28, paddingTop: 4 },
  chartRow: { flexDirection: 'row', gap: 7, height: 168, alignItems: 'flex-end', marginTop: 18 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { color: MUTED, fontSize: 10, fontWeight: '700', height: 16 },
  barTrack: { width: '72%', flex: 1, maxHeight: 118, minHeight: 54, backgroundColor: '#E6E4DE', borderRadius: 5, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: ACCENT, borderRadius: 5 },
  barLabel: { marginTop: 8, color: MUTED, fontSize: 11, fontWeight: '700' },
  milestoneCard: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderColor: LINE },
  milestoneHeadlineRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 },
  milestoneBig: { color: INK, fontSize: 38, fontWeight: '900', letterSpacing: -1.6, fontVariant: ['tabular-nums'] },
  milestoneSmall: { color: MUTED, fontSize: 13, fontWeight: '700' },
  progressTrack: { marginTop: 14, height: 7, borderRadius: 99, backgroundColor: '#DEDDD7', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: ACCENT },
  historySection: { marginTop: 34 },
  historyRow: { minHeight: 52, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyDate: { color: MUTED, fontSize: 14, fontWeight: '600' },
  historyAmount: { color: INK, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  entryRow: { minHeight: 66, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryAmount: { color: INK, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  entryTime: { marginTop: 3, color: MUTED, fontSize: 11, fontWeight: '600' },
  entryDelete: { color: '#A34036', fontSize: 13, fontWeight: '800' },
  emptyText: { marginTop: 18, color: MUTED, fontSize: 14 },
  dataActions: { marginTop: 34, gap: 24, alignItems: 'center' },
  secondaryButton: { width: '100%', minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: INK, fontSize: 15, fontWeight: '900' },
  deleteText: { color: '#A34036', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
