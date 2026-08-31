const fs = require('fs');

const path = 'App.tsx';
let s = fs.readFileSync(path, 'utf8');

function mustReplace(from, to, label) {
  if (!s.includes(from)) throw new Error(`Missing anchor: ${label}`);
  s = s.replace(from, to);
}

mustReplace(
  "type SessionStatus = 'countdown' | 'running';",
  "type SessionStatus = 'countdown' | 'running' | 'confirm';",
  'session status',
);

mustReplace(
`function BrickWall({ filledBricks, compact = false }: { filledBricks: number; compact?: boolean }) {
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
                key={\`${'${rowIndex}'}-${'${brickIndex}'}\`}
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
}`,
`function BrickWall({ filledBricks, compact = false }: { filledBricks: number; compact?: boolean }) {
  const visibleFilled = Math.min(Math.max(0, filledBricks), compact ? 16 : 160);
  const minimumSlots = compact ? 16 : 28;
  const capacity = Math.max(minimumSlots, Math.ceil((visibleFilled + (compact ? 4 : 12)) / 4) * 4);
  const rows = Math.ceil(capacity / 4);

  return (
    <View style={[styles.wallCanvas, compact && styles.wallCanvasCompact]}>
      {Array.from({ length: rows }, (_, visualRow) => {
        const rowFromBottom = rows - 1 - visualRow;
        return (
          <View key={visualRow} style={[styles.brickRow, rowFromBottom % 2 === 1 && styles.brickRowOffset]}>
            {Array.from({ length: 4 }, (_, brickIndex) => {
              const brickNumber = rowFromBottom * 4 + brickIndex;
              const filled = brickNumber < visibleFilled;
              return (
                <View
                  key={\`${'${visualRow}'}-${'${brickIndex}'}\`}
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
        );
      })}
    </View>
  );
}`,
  'brick wall direction',
);

mustReplace(
`  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [sessionCount, setSessionCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);`,
`  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('countdown');
  const [countdown, setCountdown] = useState(10);
  const [sessionCount, setSessionCount] = useState(0);
  const [detectedCount, setDetectedCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);`,
  'session state',
);

mustReplace(
`  const addManual = (amount: number) => {
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
  };`,
`  const finishSession = (automatic = false) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const finalCount = countRef.current;
    clearSessionInfrastructure();
    if (finalCount > 0) {
      setDetectedCount(finalCount);
      setConfirmedCount(finalCount);
      setSessionStatus('confirm');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } else {
      showToast('NO REPS DETECTED');
      setScreen('home');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    }
    setSessionCount(0);
    countRef.current = 0;
    setCountdown(10);
    setElapsed(0);
    setTimeout(() => { finishingRef.current = false; }, automatic ? 250 : 0);
  };

  const adjustConfirmedCount = (delta: number) => {
    const lower = Math.max(1, detectedCount - 10);
    const upper = detectedCount + 10;
    setConfirmedCount((current) => Math.min(upper, Math.max(lower, current + delta)));
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const confirmPocketCount = () => {
    if (confirmedCount <= 0) return;
    saveEntry(confirmedCount, 'pocket');
    setScreen('home');
    setSessionStatus('countdown');
    setDetectedCount(0);
    setConfirmedCount(0);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };

  const retryPocketCount = () => {
    setDetectedCount(0);
    setConfirmedCount(0);
    setSessionStatus('countdown');
    void startPocket();
  };`,
  'trusted session finish',
);

mustReplace(
`    setCountdown(3);

    try {`,
`    setCountdown(10);

    try {`,
  'start countdown reset',
);

mustReplace(
`      setScreen('session');
      setSessionStatus('countdown');
      [1, 2, 3].forEach((second) => {
        const timer = setTimeout(() => {
          const left = 3 - second;
          if (left > 0) setCountdown(left);
          else void beginListening();
        }, second * 1000);
        countdownTimersRef.current.push(timer);
      });`,
`      setScreen('session');
      setSessionStatus('countdown');
      [1,2,3,4,5,6,7,8,9,10].forEach((second) => {
        const timer = setTimeout(() => {
          const left = 10 - second;
          if (left > 0) setCountdown(left);
          else void beginListening();
        }, second * 1000);
        countdownTimersRef.current.push(timer);
      });`,
  '10 second countdown',
);

mustReplace(
`  const finishOnboarding = () => {
    const base = existingValue.trim() === '' ? 0 : parsePositiveInt(existingValue);
    if (existingValue.trim() !== '' && base === null) {
      Alert.alert('숫자를 확인해 주세요', '기존 누적 푸쉬업 개수를 숫자로 입력해 주세요.');
      return;
    }
    setState({ onboarded: true, baseTotal: base ?? 0, entries: [], sensitivity: 'medium' });
    setExistingValue('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };`,
`  const finishOnboarding = () => {
    setState({ onboarded: true, baseTotal: 0, entries: [], sensitivity: 'medium' });
    setOnboardingStep(0);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };`,
  'zero-start onboarding',
);

mustReplace(
`  const beginEdit = (entry: Entry) => {
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
`,
``,
  'remove free history edit',
);

const onboardingStart = `  if (!state.onboarded) {\n`;
const onboardingEnd = `\n  if (screen === 'session') {`;
const oi = s.indexOf(onboardingStart);
const oj = s.indexOf(onboardingEnd, oi);
if (oi < 0 || oj < 0) throw new Error('Missing onboarding render block');
const newOnboarding = `  if (!state.onboarded) {
    const steps = [
      {
        code: '01 / BUILD',
        title: '평생 한 푸쉬업을\\n벽으로 남깁니다.',
        body: '100 PUSHES = 1 BRICK. 벽돌은 아래에서 위로 쌓이고, 한 번 쌓인 기록은 당신의 실제 수행만으로 만들어집니다.',
      },
      {
        code: '02 / POCKET',
        title: '주머니에 넣고\\n자세부터 잡으세요.',
        body: 'POCKET COUNT를 누르면 10초가 주어집니다. 앞주머니에 iPhone을 넣고 시작 자세를 잡으세요. 신호 후의 움직임부터 셉니다.',
      },
      {
        code: '03 / TRUST',
        title: '기록은\\n직접 쌓은 것만.',
        body: '자유 수동 입력은 없습니다. 센서가 센 횟수를 마지막에 확인하고 ±10 안에서만 보정합니다. 과거 숫자도 가져오지 않고 오늘 0부터 시작합니다.',
      },
    ];
    const step = steps[onboardingStep];
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={onboardingStep === 0 ? 'light-content' : 'dark-content'} />
        <View style={styles.onboardingV2}>
          <View style={[styles.onboardingVisual, onboardingStep === 0 ? styles.onboardingVisualDark : styles.onboardingVisualLight]}>
            <View style={styles.introHeader}>
              <Text style={[styles.introWordmark, onboardingStep > 0 && styles.introWordmarkDark]}>PUSH TOTAL</Text>
              <Text style={styles.introCode}>{step.code}</Text>
            </View>
            {onboardingStep === 0 ? (
              <View style={styles.introWallWrap}><BrickWall filledBricks={9} compact /></View>
            ) : onboardingStep === 1 ? (
              <View style={styles.onboardingPocketCard}>
                <View style={styles.pocketIllustration}><View style={styles.phoneShape} /><View style={styles.pocketCurveLight} /></View>
                <Text style={styles.onboardingTen}>10</Text>
                <Text style={styles.onboardingTenLabel}>SECONDS TO GET READY</Text>
              </View>
            ) : (
              <View style={styles.trustMark}>
                <Text style={styles.trustMarkSmall}>SENSOR VERIFIED</Text>
                <Text style={styles.trustMarkBig}>±10</Text>
                <Text style={styles.trustMarkSmall}>MAX CORRECTION</Text>
              </View>
            )}
          </View>
          <View style={styles.onboardingCopy}>
            <Text style={styles.kicker}>YOUR PUSH-UP PEDOMETER</Text>
            <Text style={styles.onboardingTitle}>{step.title}</Text>
            <Text style={styles.onboardingBody}>{step.body}</Text>
            <View style={styles.onboardingProgress}>
              {[0,1,2].map(i => <View key={i} style={[styles.onboardingProgressBar, i === onboardingStep && styles.onboardingProgressBarActive]} />)}
            </View>
            {onboardingStep < 2 ? (
              <Pressable onPress={() => setOnboardingStep((current) => current + 1)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>CONTINUE</Text>
              </Pressable>
            ) : (
              <Pressable onPress={finishOnboarding} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>START AT ZERO</Text>
              </Pressable>
            )}
            {onboardingStep > 0 && <Pressable onPress={() => setOnboardingStep((current) => current - 1)}><Text style={styles.onboardingBack}>BACK</Text></Pressable>}
          </View>
        </View>
      </SafeAreaView>
    );
  }
`;
s = s.slice(0, oi) + newOnboarding + s.slice(oj);

mustReplace(
`            {sessionStatus === 'countdown' ? (
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
            )}`,
`            {sessionStatus === 'countdown' ? (
              <>
                <View style={styles.pocketIllustration}>
                  <View style={styles.phoneShape} />
                  <View style={styles.pocketCurve} />
                </View>
                <Text style={styles.sessionKicker}>GET INTO POSITION</Text>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.sessionTitle}>10초 안에 자세를 잡으세요.</Text>
                <Text style={styles.sessionBody}>카운트가 끝나면 강한 진동이 옵니다. 그때부터 첫 푸쉬업을 시작하세요.</Text>
              </>
            ) : sessionStatus === 'running' ? (
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
                <Text style={styles.sessionBody}>멈춘 뒤 7초 동안 반복 움직임이 없으면 확인 화면으로 넘어갑니다.</Text>
              </>
            ) : (
              <>
                <Text style={styles.sessionKicker}>VERIFY YOUR SET</Text>
                <Text style={styles.confirmQuestion}>{detectedCount}개 한 것 맞나요?</Text>
                <Text style={styles.confirmNumber}>{confirmedCount}</Text>
                <Text style={styles.sessionMetric}>CONFIRMED PUSHES</Text>
                <View style={styles.correctionRow}>
                  {[-10,-1,1,10].map(delta => (
                    <Pressable key={delta} onPress={() => adjustConfirmedCount(delta)} style={styles.correctionButton}>
                      <Text style={styles.correctionButtonText}>{delta > 0 ? '+' : ''}{delta}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.sessionBody}>센서값 {detectedCount}개 기준 ±10 안에서만 보정할 수 있습니다.</Text>
                <Pressable onPress={confirmPocketCount} style={styles.confirmButton}><Text style={styles.confirmButtonText}>YES · ADD TO LIFETIME</Text></Pressable>
                <Pressable onPress={retryPocketCount} style={styles.retryButton}><Text style={styles.retryButtonText}>COUNT AGAIN</Text></Pressable>
              </>
            )}`,
  'session confirmation UI',
);

mustReplace(
`            <Text style={styles.endSetText}>{sessionStatus === 'running' && sessionCount > 0 ? 'END SET' : 'CANCEL'}</Text>`,
`            <Text style={styles.endSetText}>{sessionStatus === 'running' && sessionCount > 0 ? 'END SET' : sessionStatus === 'confirm' ? 'DISCARD' : 'CANCEL'}</Text>`,
  'session header label',
);

mustReplace(
`  const cancelSession = () => {
    if (sessionStatus === 'running' && countRef.current > 0) {
      Alert.alert('세트를 끝낼까요?', \`${'${countRef.current}'}개를 저장하고 홈으로 돌아갑니다.\`, [
        { text: '계속', style: 'cancel' },
        { text: '끝내기', onPress: () => finishSession(false) },
      ]);
      return;
    }
    clearSessionInfrastructure();
    setScreen('home');
  };`,
`  const cancelSession = () => {
    if (sessionStatus === 'running' && countRef.current > 0) {
      Alert.alert('세트를 끝낼까요?', \`${'${countRef.current}'}개를 감지했습니다. 확인 화면으로 이동합니다.\`, [
        { text: '계속', style: 'cancel' },
        { text: '끝내기', onPress: () => finishSession(false) },
      ]);
      return;
    }
    if (sessionStatus === 'confirm') {
      Alert.alert('이번 세트를 버릴까요?', '확정하지 않은 기록은 LIFETIME에 들어가지 않습니다.', [
        { text: '계속 확인', style: 'cancel' },
        { text: '버리기', style: 'destructive', onPress: () => { setDetectedCount(0); setConfirmedCount(0); setSessionStatus('countdown'); setScreen('home'); } },
      ]);
      return;
    }
    clearSessionInfrastructure();
    setScreen('home');
  };`,
  'cancel session',
);

const manualStart = `          <View style={styles.manualSection}>`;
const manualEnd = `\n          <Text style={styles.homeFootnote}>`;
const mi = s.indexOf(manualStart);
const mj = s.indexOf(manualEnd, mi);
if (mi < 0 || mj < 0) throw new Error('Missing manual section');
s = s.slice(0, mi) + `          <View style={styles.trustedRecordNote}>\n            <Text style={styles.trustedRecordLabel}>TRUSTED RECORD</Text>\n            <Text style={styles.trustedRecordTitle}>직접 수행한 푸쉬업만 쌓입니다.</Text>\n            <Text style={styles.trustedRecordBody}>자유 수동 입력은 없습니다. Pocket Count가 감지한 세트만 확인 후 LIFETIME에 추가됩니다.</Text>\n          </View>\n` + s.slice(mj);

const historyOld = `            <View style={styles.sectionHeaderRow}>\n              <Text style={styles.sectionLabel}>RECENT LOG</Text>\n              <Text style={styles.sectionMeta}>EDITABLE</Text>\n            </View>`;
mustReplace(historyOld, `            <View style={styles.sectionHeaderRow}>\n              <Text style={styles.sectionLabel}>RECENT LOG</Text>\n              <Text style={styles.sectionMeta}>VERIFIED SETS</Text>\n            </View>`, 'history header');

const historyMapStart = `            {recentEntries.length === 0 ? (`;
const historyMapEnd = `\n          </View>\n\n          <View style={styles.settingsSection}>`;
const hi = s.indexOf(historyMapStart);
const hj = s.indexOf(historyMapEnd, hi);
if (hi < 0 || hj < 0) throw new Error('Missing history list');
const newHistory = `            {recentEntries.length === 0 ? (
              <Text style={styles.emptyText}>아직 기록이 없어요.</Text>
            ) : recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryLeft}>
                  <View style={[styles.entryBrick, entry.source === 'pocket' && styles.entryBrickSensor]} />
                  <View>
                    <Text style={styles.entryAmount}>{formatNumber(entry.amount)}</Text>
                    <Text style={styles.entryTime}>{entry.date} · {new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · {entry.source === 'pocket' ? 'POCKET VERIFIED' : 'LEGACY'}</Text>
                  </View>
                </View>
                <Pressable onPress={() => deleteEntry(entry)} hitSlop={10}><Text style={styles.entryDelete}>DELETE</Text></Pressable>
              </View>
            ))}`;
s = s.slice(0, hi) + newHistory + s.slice(hj);

mustReplace(
`          <Text style={styles.homeFootnote}>푸쉬업을 걸음처럼 누적하고, 100개마다 벽돌 하나를 쌓습니다. Pocket Count는 iPhone 동작 센서로 반복 움직임을 추정합니다.</Text>`,
`          <Text style={styles.homeFootnote}>100 PUSHES = 1 BRICK. 벽돌은 아래에서 위로 쌓입니다. Pocket Count는 준비 신호 이후의 반복 움직임을 추정하고, 마지막 확인을 거쳐 기록합니다.</Text>`,
  'home footnote',
);

const styleAnchor = `  // Dashboard\n`;
const extraStyles = `  onboardingV2: { flex: 1, backgroundColor: BG },
  onboardingVisual: { flex: 1.05, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  onboardingVisualDark: { backgroundColor: INK },
  onboardingVisualLight: { backgroundColor: SURFACE },
  introWordmarkDark: { color: BRICK_DARK },
  onboardingCopy: { flex: 0.95, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 22, justifyContent: 'center' },
  onboardingProgress: { marginTop: 24, flexDirection: 'row', gap: 6 },
  onboardingProgressBar: { flex: 1, height: 3, backgroundColor: SURFACE_HIGH },
  onboardingProgressBarActive: { backgroundColor: BRICK },
  onboardingBack: { marginTop: 15, color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center' },
  onboardingPocketCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pocketCurveLight: { position: 'absolute', bottom: -42, width: 170, height: 78, borderTopWidth: 2, borderColor: '#8C857D', borderRadius: 80, backgroundColor: SURFACE },
  onboardingTen: { marginTop: 14, color: INK, fontSize: 76, lineHeight: 80, fontWeight: '900', letterSpacing: -4 },
  onboardingTenLabel: { color: BRICK_DARK, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  trustMark: { flex: 1, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE },
  trustMarkSmall: { color: MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  trustMarkBig: { color: BRICK_DARK, fontSize: 92, lineHeight: 102, fontWeight: '900', letterSpacing: -5 },

`;
if (!s.includes(styleAnchor)) throw new Error('Missing style anchor');
s = s.replace(styleAnchor, extraStyles + styleAnchor);

const sessionStyleAnchor = `  // History\n`;
const confirmStyles = `  confirmQuestion: { marginBottom: 8, color: BG, fontSize: 24, lineHeight: 30, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  confirmNumber: { color: BG, fontSize: 122, lineHeight: 132, fontWeight: '900', letterSpacing: -6, fontVariant: ['tabular-nums'] },
  correctionRow: { marginTop: 22, flexDirection: 'row', gap: 8 },
  correctionButton: { width: 58, height: 46, borderWidth: 1, borderColor: '#5A5550', alignItems: 'center', justifyContent: 'center' },
  correctionButtonText: { color: BG, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] },
  confirmButton: { marginTop: 24, width: '100%', maxWidth: 320, minHeight: 56, backgroundColor: BRICK, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { color: BG, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  retryButton: { marginTop: 10, minHeight: 44, justifyContent: 'center' },
  retryButtonText: { color: '#918B85', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },

`;
if (!s.includes(sessionStyleAnchor)) throw new Error('Missing session style anchor');
s = s.replace(sessionStyleAnchor, confirmStyles + sessionStyleAnchor);

const homeFootStyle = `  homeFootnote: { marginTop: 17, color: MUTED, fontSize: 10, lineHeight: 16, fontWeight: '600' },`;
mustReplace(homeFootStyle, `${homeFootStyle}\n  trustedRecordNote: { marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderColor: LINE },\n  trustedRecordLabel: { color: BRICK_DARK, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },\n  trustedRecordTitle: { marginTop: 5, color: INK, fontSize: 18, lineHeight: 23, fontWeight: '900', letterSpacing: -0.5 },\n  trustedRecordBody: { marginTop: 6, color: MUTED, fontSize: 11, lineHeight: 17, fontWeight: '600' },`, 'trusted note styles');

fs.writeFileSync(path, s);
console.log('Applied PUSH TOTAL trusted session refinement.');
