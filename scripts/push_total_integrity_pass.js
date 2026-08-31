const fs = require('fs');

let s = fs.readFileSync('App.tsx', 'utf8');

function mustReplace(search, replacement, label) {
  const before = s;
  s = s.replace(search, replacement);
  if (s === before) throw new Error(`Patch failed: ${label}`);
}

// Native cadence audio.
mustReplace(
  "import * as KeepAwake from 'expo-keep-awake';",
  "import * as KeepAwake from 'expo-keep-awake';\nimport { useAudioPlayer } from 'expo-audio';",
  'audio import',
);

mustReplace(
  "type SessionStatus = 'countdown' | 'running';",
  "type SessionStatus = 'countdown' | 'running' | 'review';",
  'review status',
);
mustReplace(
  "  source: EntrySource;\n  date: string;",
  "  source: EntrySource;\n  detectedAmount?: number;\n  date: string;",
  'detected provenance',
);

mustReplace(
  "const AUTO_FINISH_MS = 7_000;\nconst IGNORE_START_MS = 1_100;\nconst MIN_REP_MS = 480;\nconst MAX_HALF_CYCLE_MS = 2_300;",
  "const PREP_SECONDS = 10;\nconst CORRECTION_LIMIT = 10;\nconst CADENCE_HALF_MS = 1_500;\nconst CADENCE_REP_MS = CADENCE_HALF_MS * 2;\nconst AUTO_FINISH_MS = 4_000;\nconst IGNORE_START_MS = 300;\nconst MIN_REP_MS = 1_900;\nconst MAX_HALF_CYCLE_MS = 2_100;",
  'cadence constants',
);

mustReplace(
  "    source: raw?.source === 'pocket' ? 'pocket' : 'manual',\n    date:",
  "    source: raw?.source === 'pocket' ? 'pocket' : 'manual',\n    detectedAmount: Number.isFinite(Number(raw?.detectedAmount)) ? Math.max(0, Math.floor(Number(raw.detectedAmount))) : undefined,\n    date:",
  'load provenance',
);

// Masonry grows from the ground upward.
mustReplace(
  /function BrickWall\([\s\S]*?\n}\n\nfunction BottomNav/,
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
}

function BottomNav`,
  'bottom-up wall',
);

mustReplace(
  "  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('countdown');\n  const [countdown, setCountdown] = useState(3);\n  const [sessionCount, setSessionCount] = useState(0);",
  "  const [onboardingStep, setOnboardingStep] = useState(0);\n  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('countdown');\n  const [countdown, setCountdown] = useState(PREP_SECONDS);\n  const [sessionCount, setSessionCount] = useState(0);\n  const [reviewBaseline, setReviewBaseline] = useState(0);\n  const [reviewCount, setReviewCount] = useState(0);",
  'new states',
);

mustReplace(
  "  const finishSessionRef = useRef<(automatic?: boolean) => void>(() => undefined);",
  "  const finishSessionRef = useRef<(automatic?: boolean) => void>(() => undefined);\n  const cadenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);\n  const cadencePhaseRef = useRef(0);\n\n  const startPlayer = useAudioPlayer(require('./assets/cadence-start.wav'));\n  const downPlayer = useAudioPlayer(require('./assets/cadence-down.wav'));\n  const upPlayer = useAudioPlayer(require('./assets/cadence-up.wav'));",
  'audio players',
);

mustReplace(
  "    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);\n    maxTimerRef.current = null;",
  "    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);\n    if (cadenceTimerRef.current) clearInterval(cadenceTimerRef.current);\n    maxTimerRef.current = null;",
  'clear cadence timer',
);
mustReplace(
  "    elapsedTimerRef.current = null;\n    void KeepAwake.deactivateKeepAwake",
  "    elapsedTimerRef.current = null;\n    cadenceTimerRef.current = null;\n    cadencePhaseRef.current = 0;\n    void KeepAwake.deactivateKeepAwake",
  'reset cadence timer',
);

mustReplace(
  "  const saveEntry = (amount: number, source: EntrySource) => {",
  "  const saveEntry = (amount: number, source: EntrySource, detectedAmount?: number) => {",
  'save signature',
);
mustReplace(
  "      source,\n      date: localDateKey(now),",
  "      source,\n      detectedAmount: source === 'pocket' && Number.isFinite(detectedAmount) ? Math.max(0, Math.floor(Number(detectedAmount))) : undefined,\n      date: localDateKey(now),",
  'save provenance',
);

// A new user starts at zero; legacy baseTotal remains only for existing installs.
mustReplace(
  /  const finishOnboarding = \(\) => \{[\s\S]*?\n  \};\n\n  const deleteEntry/,
`  const finishOnboarding = () => {
    setState((current) => ({ ...current, onboarded: true, sensitivity: current.sensitivity || 'medium' }));
    setOnboardingStep(0);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };

  const deleteEntry`,
  'onboarding finish',
);

// Pocket sessions are reviewed before they enter the lifetime record.
mustReplace(
  /  const finishSession = \(automatic = false\) => \{[\s\S]*?\n  finishSessionRef\.current = finishSession;/,
`  const finishSession = (automatic = false) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const finalCount = countRef.current;
    clearSessionInfrastructure();

    if (finalCount > 0) {
      setReviewBaseline(finalCount);
      setReviewCount(finalCount);
      setSessionCount(finalCount);
      setSessionStatus('review');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      finishingRef.current = false;
      return;
    }

    showToast('NO REPS DETECTED');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    setScreen('home');
    setSessionCount(0);
    countRef.current = 0;
    setCountdown(PREP_SECONDS);
    setElapsed(0);
    setTimeout(() => { finishingRef.current = false; }, automatic ? 250 : 0);
  };
  finishSessionRef.current = finishSession;

  const adjustReview = (delta: number) => {
    const minimum = Math.max(1, reviewBaseline - CORRECTION_LIMIT);
    const maximum = reviewBaseline + CORRECTION_LIMIT;
    setReviewCount((current) => Math.min(maximum, Math.max(minimum, current + delta)));
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const confirmReviewedSession = () => {
    if (reviewBaseline <= 0 || reviewCount <= 0) return;
    saveEntry(reviewCount, 'pocket', reviewBaseline);
    setScreen('home');
    setSessionStatus('countdown');
    setSessionCount(0);
    countRef.current = 0;
    setReviewBaseline(0);
    setReviewCount(0);
    setCountdown(PREP_SECONDS);
    setElapsed(0);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };`,
  'session review',
);

// Start cue then DOWN/UP cadence every 1.5s; one full repetition every 3s.
mustReplace(
  "    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);\n    subscriptionRef.current = DeviceMotion.addListener(processMotion);\n    maxTimerRef.current = setTimeout(() => finishSessionRef.current(true), MAX_SESSION_MS);",
  `    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    void startPlayer.seekTo(0).then(() => startPlayer.play()).catch(() => undefined);
    subscriptionRef.current = DeviceMotion.addListener(processMotion);

    const playCadenceCue = () => {
      const player = cadencePhaseRef.current % 2 === 0 ? downPlayer : upPlayer;
      void player.seekTo(0).then(() => player.play()).catch(() => undefined);
      cadencePhaseRef.current += 1;
    };
    cadencePhaseRef.current = 0;
    const firstCue = setTimeout(playCadenceCue, 650);
    countdownTimersRef.current.push(firstCue);
    cadenceTimerRef.current = setInterval(playCadenceCue, CADENCE_HALF_MS);
    maxTimerRef.current = setTimeout(() => finishSessionRef.current(true), MAX_SESSION_MS);`,
  'cadence cues',
);

mustReplace("    setCountdown(3);", "    setCountdown(PREP_SECONDS);", 'prep reset');
mustReplace(
  "      setScreen('session');\n      setSessionStatus('countdown');\n      [1, 2, 3].forEach((second) => {\n        const timer = setTimeout(() => {\n          const left = 3 - second;\n          if (left > 0) setCountdown(left);\n          else void beginListening();\n        }, second * 1000);\n        countdownTimersRef.current.push(timer);\n      });",
  "      setScreen('session');\n      setSessionStatus('countdown');\n      Array.from({ length: PREP_SECONDS }, (_, index) => index + 1).forEach((second) => {\n        const timer = setTimeout(() => {\n          const left = PREP_SECONDS - second;\n          if (left > 0) setCountdown(left);\n          else void beginListening();\n        }, second * 1000);\n        countdownTimersRef.current.push(timer);\n      });",
  '10 second prep',
);

// Strong first-run onboarding: promise, masonry, pocket ritual, integrity.
mustReplace(
  /  if \(!state\.onboarded\) \{[\s\S]*?\n  if \(screen === 'session'\) \{/,
`  if (!state.onboarded) {
    const steps = [
      {
        eyebrow: 'YOUR PUSH-UP PEDOMETER',
        title: '평생 한 푸쉬업을\\n쌓아갑니다.',
        body: '오늘 운동을 체크하는 앱이 아닙니다. PUSH TOTAL은 이 앱과 함께 실제로 한 푸쉬업을 평생 누적하는 기록입니다.',
      },
      {
        eyebrow: '100 PUSHES = 1 BRICK',
        title: '노력은 벽이 됩니다.',
        body: '100개마다 벽돌 하나. 첫 벽돌은 바닥에서 시작하고, 기록이 늘어날수록 벽은 위로 자랍니다.',
      },
      {
        eyebrow: 'CADENCE POCKET COUNT',
        title: '넣고. 10초 준비.\\n신호에 맞춰 움직이세요.',
        body: 'iPhone을 앞주머니에 넣고 시작 자세를 잡습니다. 시작음 뒤에는 DOWN / UP 신호가 1.5초 간격으로 이어집니다.',
      },
      {
        eyebrow: 'A WITNESSED RECORD',
        title: '입력하지 않습니다.\\n확인하고 쌓습니다.',
        body: '새 기록은 Pocket Count에서만 만들어집니다. 세션이 끝나면 센서값을 ±10 안에서 확인한 뒤 확정해야 Lifetime에 들어갑니다.',
      },
    ];
    const step = steps[onboardingStep];
    return (
      <SafeAreaView style={styles.onboardingSafe}>
        <StatusBar barStyle={onboardingStep === 0 ? 'light-content' : 'dark-content'} />
        <View style={[styles.onboardingPage, onboardingStep === 0 && styles.onboardingPageDark]}>
          <View style={styles.onboardingTopline}>
            <Text style={[styles.onboardingBrand, onboardingStep === 0 && styles.onboardingBrandDark]}>PUSH TOTAL</Text>
            <Text style={[styles.onboardingIndex, onboardingStep === 0 && styles.onboardingIndexDark]}>0{onboardingStep + 1} / 04</Text>
          </View>

          <View style={styles.onboardingVisual}>
            {onboardingStep === 1 ? (
              <View style={styles.onboardingWall}><BrickWall filledBricks={11} compact /></View>
            ) : onboardingStep === 2 ? (
              <View style={styles.onboardingPocketMark}>
                <View style={styles.onboardingPhone} />
                <Text style={styles.onboardingTen}>10</Text>
                <Text style={styles.onboardingSeconds}>SECONDS TO POSITION</Text>
              </View>
            ) : onboardingStep === 3 ? (
              <View style={styles.onboardingSeal}>
                <Text style={styles.onboardingSealSmall}>WITNESSED</Text>
                <Text style={styles.onboardingSealBig}>ONLY</Text>
              </View>
            ) : (
              <View style={styles.onboardingHeroBrick}>
                <View style={styles.onboardingHeroBrickTop} />
                <View style={styles.onboardingHeroBrickFace} />
              </View>
            )}
          </View>

          <View>
            <Text style={[styles.onboardingEyebrow, onboardingStep === 0 && styles.onboardingEyebrowDark]}>{step.eyebrow}</Text>
            <Text style={[styles.onboardingHeadline, onboardingStep === 0 && styles.onboardingHeadlineDark]}>{step.title}</Text>
            <Text style={[styles.onboardingCopy, onboardingStep === 0 && styles.onboardingCopyDark]}>{step.body}</Text>
          </View>

          <View>
            <View style={styles.onboardingDots}>
              {steps.map((_, index) => <View key={index} style={[styles.onboardingDot, index === onboardingStep && styles.onboardingDotActive]} />)}
            </View>
            <Pressable
              onPress={() => onboardingStep === steps.length - 1 ? finishOnboarding() : setOnboardingStep((value) => value + 1)}
              style={({ pressed }) => [styles.onboardingButton, pressed && styles.pressed]}
            >
              <Text style={styles.onboardingButtonText}>{onboardingStep === steps.length - 1 ? 'START MY WALL' : 'CONTINUE'}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'session') {`,
  'onboarding replacement',
);

// Session review lives in the same ritual, before any save.
mustReplace(
  "          <View style={styles.sessionCenter}>\n            {sessionStatus === 'countdown' ? (",
  "          <View style={styles.sessionCenter}>\n            {sessionStatus === 'review' ? (\n              <>\n                <Text style={styles.sessionKicker}>SENSOR REVIEW</Text>\n                <Text style={styles.reviewQuestion}>{reviewBaseline}개로 측정했어요.\\n맞습니까?</Text>\n                <Text style={styles.reviewCount}>{reviewCount}</Text>\n                <View style={styles.reviewControls}>\n                  {[-10, -1, 1, 10].map((delta) => (\n                    <Pressable key={delta} onPress={() => adjustReview(delta)} style={({ pressed }) => [styles.reviewAdjust, pressed && styles.pressed]}>\n                      <Text style={styles.reviewAdjustText}>{delta > 0 ? `+${delta}` : delta}</Text>\n                    </Pressable>\n                  ))}\n                </View>\n                <Text style={styles.reviewLimit}>센서값 기준 ±10까지만 보정할 수 있습니다.</Text>\n                <Pressable onPress={confirmReviewedSession} style={({ pressed }) => [styles.reviewConfirm, pressed && styles.pressed]}>\n                  <Text style={styles.reviewConfirmText}>CONFIRM {reviewCount}</Text>\n                </Pressable>\n              </>\n            ) : sessionStatus === 'countdown' ? (",
  'session review UI',
);
mustReplace(
  "                <Text style={styles.sessionBody}>진동이 한 번 오면 평소 속도로 푸쉬업을 시작하세요.</Text>",
  "                <Text style={styles.sessionBody}>시작음이 울릴 때까지 자세를 잡으세요. 이후 DOWN / UP 신호에 맞춰 움직입니다.</Text>",
  'prep copy',
);
mustReplace(
  "                <Text style={styles.sessionBody}>마지막 반복 뒤 7초 동안 새 움직임이 없으면 자동 저장됩니다.</Text>",
  "                <Text style={styles.sessionBody}>3초에 1회 리듬 · 마지막 유효 반복 뒤 4초 동안 새 카운트가 없으면 측정을 끝냅니다.</Text>",
  'running copy',
);

// Remove free-form logging from Home; preserve legacy entries but no new manual records.
mustReplace(
  /          <View style=\{styles\.manualSection\}>[\s\S]*?          <Text style=\{styles\.homeFootnote\}>/,
`          <View style={styles.integrityCard}>
            <Text style={styles.integrityKicker}>WITNESSED RECORD</Text>
            <Text style={styles.integrityTitle}>Lifetime에는 Pocket Count만 들어갑니다.</Text>
            <Text style={styles.integrityBody}>자유 입력은 없습니다. 센서가 본 횟수를 세션 직후 확인해 확정합니다.</Text>
          </View>

          <Text style={styles.homeFootnote}>`,
  'remove manual home input',
);

// Remove arbitrary history editing. Deletion stays for genuine mistakes or unwanted legacy data.
mustReplace(
  "              <Text style={styles.sectionMeta}>EDITABLE</Text>",
  "              <Text style={styles.sectionMeta}>WITNESSED SETS</Text>",
  'history label',
);
mustReplace(
  /                \{editingId === entry\.id \? \([\s\S]*?                \)\}\n              <\/View>/,
`                <>
                  <View style={styles.entryMain}>
                    <View style={styles.entrySourceMark}><Text style={styles.entrySourceText}>{entry.source === 'pocket' ? 'P' : 'L'}</Text></View>
                    <View>
                      <Text style={styles.entryAmount}>{formatNumber(entry.amount)}</Text>
                      <Text style={styles.entryTime}>
                        {entry.date} · {new Date(entry.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · {entry.source === 'pocket' ? 'POCKET' : 'LEGACY'}
                        {entry.source === 'pocket' && Number.isFinite(entry.detectedAmount) && entry.detectedAmount !== entry.amount ? ` · SENSOR ${entry.detectedAmount}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.entryActions}>
                    <Pressable onPress={() => deleteEntry(entry)} hitSlop={10}><Text style={styles.entryDelete}>DELETE</Text></Pressable>
                  </View>
                </>
              </View>`,
  'remove history edit',
);

// Append new visual vocabulary without disturbing existing styles.
mustReplace(
  "const styles = StyleSheet.create({",
  `const styles = StyleSheet.create({
  onboardingSafe: { flex: 1, backgroundColor: BG },
  onboardingPage: { flex: 1, backgroundColor: BG, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, justifyContent: 'space-between' },
  onboardingPageDark: { backgroundColor: INK },
  onboardingTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  onboardingBrand: { color: INK, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 },
  onboardingBrandDark: { color: BRICK_LIGHT },
  onboardingIndex: { color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  onboardingIndexDark: { color: '#8D8984' },
  onboardingVisual: { minHeight: 265, alignItems: 'center', justifyContent: 'center' },
  onboardingWall: { width: '100%', maxWidth: 330 },
  onboardingHeroBrick: { width: 230, height: 138, transform: [{ rotate: '-5deg' }] },
  onboardingHeroBrickTop: { position: 'absolute', left: 18, right: -18, top: -18, height: 25, backgroundColor: BRICK_LIGHT, transform: [{ skewX: '-42deg' }] },
  onboardingHeroBrickFace: { flex: 1, backgroundColor: BRICK, borderWidth: 2, borderColor: BRICK_DARK },
  onboardingPocketMark: { width: 230, height: 230, borderRadius: 115, borderWidth: 2, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  onboardingPhone: { width: 62, height: 110, borderRadius: 14, borderWidth: 3, borderColor: INK, transform: [{ rotate: '8deg' }] },
  onboardingTen: { marginTop: -2, color: BRICK, fontSize: 48, lineHeight: 50, fontWeight: '900', fontVariant: ['tabular-nums'] },
  onboardingSeconds: { color: MUTED, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  onboardingSeal: { width: 190, height: 190, borderRadius: 95, borderWidth: 5, borderColor: BRICK, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  onboardingSealSmall: { color: BRICK, fontSize: 11, fontWeight: '900', letterSpacing: 2.2 },
  onboardingSealBig: { color: BRICK, fontSize: 42, lineHeight: 44, fontWeight: '900', letterSpacing: -1 },
  onboardingEyebrow: { color: BRICK_DARK, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  onboardingEyebrowDark: { color: BRICK_LIGHT },
  onboardingHeadline: { marginTop: 10, color: INK, fontSize: 39, lineHeight: 42, fontWeight: '900', letterSpacing: -2 },
  onboardingHeadlineDark: { color: BG },
  onboardingCopy: { marginTop: 14, color: MUTED, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  onboardingCopyDark: { color: '#B7B2AC' },
  onboardingDots: { marginBottom: 14, flexDirection: 'row', gap: 7 },
  onboardingDot: { width: 22, height: 3, backgroundColor: SURFACE_HIGH },
  onboardingDotActive: { backgroundColor: BRICK },
  onboardingButton: { minHeight: 58, backgroundColor: BRICK, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: BRICK_DARK },
  onboardingButtonText: { color: BG, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  integrityCard: { marginTop: 20, borderTopWidth: 2, borderColor: INK, paddingTop: 14 },
  integrityKicker: { color: BRICK_DARK, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  integrityTitle: { marginTop: 7, color: INK, fontSize: 17, lineHeight: 22, fontWeight: '900' },
  integrityBody: { marginTop: 5, color: MUTED, fontSize: 11, lineHeight: 17, fontWeight: '600' },
  reviewQuestion: { marginTop: 14, color: BG, fontSize: 22, lineHeight: 29, fontWeight: '800', textAlign: 'center' },
  reviewCount: { marginTop: 14, color: BG, fontSize: 104, lineHeight: 110, fontWeight: '900', fontVariant: ['tabular-nums'] },
  reviewControls: { marginTop: 18, flexDirection: 'row', gap: 8 },
  reviewAdjust: { minWidth: 58, minHeight: 48, paddingHorizontal: 10, borderWidth: 1, borderColor: '#666', alignItems: 'center', justifyContent: 'center' },
  reviewAdjustText: { color: BG, fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'] },
  reviewLimit: { marginTop: 12, color: '#898989', fontSize: 10, lineHeight: 15, fontWeight: '700', textAlign: 'center' },
  reviewConfirm: { marginTop: 18, width: '100%', minHeight: 58, backgroundColor: BRICK, alignItems: 'center', justifyContent: 'center' },
  reviewConfirmText: { color: BG, fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },`,
  'new styles',
);

fs.writeFileSync('App.tsx', s);
console.log(`PUSH TOTAL integrity pass applied: ${original.length} -> ${s.length}`);
