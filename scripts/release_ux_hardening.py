from pathlib import Path
import re

app_path = Path('App.tsx')
onboarding_path = Path('src/Onboarding.tsx')
workout_path = Path('src/Workout.tsx')
ui_path = Path('src/ui.tsx')
styles_path = Path('src/styles.ts')
core_path = Path('src/core.ts')
app_json_path = Path('app.json')
design_path = Path('DESIGN.md')
qa_path = Path('RELEASE_QA.md')

# ---------- App.tsx: data safety, archive continuity, accessibility ----------
app = app_path.read_text()
app = app.replace("import * as Updates from 'expo-updates';\n", "")
app = app.replace("  const { isUpdatePending } = Updates.useUpdates();\n", "")
app = re.sub(
    r"\n  useEffect\(\(\) => \{\n    if \(isUpdatePending\) Updates\.reloadAsync\(\)\.catch\(\(\) => \{\}\);\n  \}, \[isUpdatePending\]\);\n",
    "\n",
    app,
)
app = app.replace(
    "  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');\n",
    "  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');\n"
    "  const [loadError, setLoadError] = useState(false);\n"
    "  const [historyLimit, setHistoryLimit] = useState(30);\n",
)
old_load = """  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setState(raw ? safeState(JSON.parse(raw)) : initialState))
      .catch(() => {
        Alert.alert('기록을 읽지 못했어', '기존 기록을 덮어쓰지 않도록 앱을 다시 실행해줘.');
        setState(initialState);
      });
  }, []);
"""
new_load = """  const loadStoredState = () => {
    setLoadError(false);
    setState(null);
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setState(raw ? safeState(JSON.parse(raw)) : initialState))
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    loadStoredState();
  }, []);
"""
if old_load not in app:
    raise SystemExit('App load block not found')
app = app.replace(old_load, new_load)
app = app.replace(
    "  if (!state) return <SafeAreaView style={styles.root} />;\n",
    """  if (loadError) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle=\"dark-content\" />
        <View style={styles.onboarding}>
          <View style={styles.setupBody}>
            <Text style={styles.pageEyebrow}>LOCAL RECORD / READ ERROR</Text>
            <Text style={styles.question}>기록을 열지 못했어.</Text>
            <Text style={styles.copy}>기존 기록을 덮어쓰지 않도록 새 기록을 시작하지 않을게. 앱을 다시 읽어본 뒤에도 계속되면 지원으로 알려줘.</Text>
          </View>
          <Button label=\"다시 시도\" onPress={loadStoredState} />
        </View>
      </SafeAreaView>
    );
  }
  if (!state) return <SafeAreaView style={styles.root} />;
""",
)
old_history = """  const history = state.sessions
    .map((session, index) => ({ session, index }))
    .reverse()
    .slice(0, 30);
"""
new_history = """  const allHistory = state.sessions
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
"""
if old_history not in app:
    raise SystemExit('history block not found')
app = app.replace(old_history, new_history)
app = app.replace(
    "            const actualReps = Math.max(0, Math.floor(Number(value) || 0));\n            saveEditedSession(index, { success: false, actualReps });",
    """            const actualReps = Math.max(0, Math.floor(Number(value) || 0));
            if (actualReps >= session.target) {
              Alert.alert('목표 이상을 기록했어', `${session.target}개를 완료했다면 ‘성공으로 수정’을 선택해줘.`);
              return;
            }
            saveEditedSession(index, { success: false, actualReps });""",
)
app = app.replace(
    "            <View style={styles.dojoHero}>",
    """            <View
              style={styles.dojoHero}
              accessible
              accessibilityLabel={`다음 목표 ${nextTarget}개. 현재 최고 기록 ${hasPersonalRecord ? `${currentReps}개` : '없음'}`}
            >""",
)
app = app.replace(
    "            <View style={styles.questBandStage}>",
    "            <View style={styles.questBandStage} accessibilityElementsHidden importantForAccessibility=\"no-hide-descendants\">",
)
app = app.replace(
    "                  {history.length ? `${history.length} RECENT RECORDS` : 'NO RECORDS YET'}",
    "                  {state.sessions.length ? `${state.sessions.length} TOTAL RECORDS` : 'NO RECORDS YET'}",
)
app = app.replace(
    "              <Pressable style={styles.stat} onPress={editStartingRecord}>",
    """              <Pressable
                style={styles.stat}
                onPress={editStartingRecord}
                accessibilityRole=\"button\"
                accessibilityLabel={`시작 기록 ${state.firstBaemilgiMax ?? '없음'}. 수정`}
                accessibilityHint=\"두 번 탭하여 처음 입력한 최고 기록을 수정합니다\"
              >""",
)
app = app.replace(
    "                  <Pressable key={`${session.at}-${index}`} style={styles.archiveEntry} onPress={() => editSession(index)}>",
    """                  <Pressable
                    key={`${session.at}-${index}`}
                    style={styles.archiveEntry}
                    onPress={() => editSession(index)}
                    accessibilityRole=\"button\"
                    accessibilityLabel={`${session.type === 'training' ? '훈련' : '퀘스트'} 레벨 ${session.level}, ${reps}개, ${session.type === 'training' ? '훈련 완료' : stopped ? '중단 기록' : '성공 기록'}`}
                    accessibilityHint=\"두 번 탭하여 기록을 편집합니다\"
                  >""",
)
app = app.replace(
    "            <View style={styles.archiveQuote}>",
    """            {history.length < allHistory.length ? (
              <View style={{ marginTop: 16 }}>
                <Button
                  label={`이전 기록 더 보기 · ${allHistory.length - history.length}개 남음`}
                  secondary
                  onPress={() => setHistoryLimit((value) => Math.min(allHistory.length, value + 30))}
                />
              </View>
            ) : null}

            <View style={styles.archiveQuote}>""",
)
app = app.replace(
    "            accessibilityRole=\"tab\"\n            accessibilityState={{ selected: tab === name }}",
    """            accessibilityRole=\"tab\"
            accessibilityLabel={name === 'home' ? '홈' : name === 'quests' ? '퀘스트' : '기록'}
            accessibilityState={{ selected: tab === name }}""",
)
app = app.replace("Linking.openURL(PRIVACY_URL)", "openExternal(PRIVACY_URL, '개인정보 처리방침')")
app = app.replace("Linking.openURL(SUPPORT_URL)", "openExternal(SUPPORT_URL, '지원 페이지')")
app = app.replace("Linking.openURL(GAMA_SOURCE_URL)", "openExternal(GAMA_SOURCE_URL, '역사적 기록')")
app = app.replace(
    "              style={styles.restoreInput}\n            />",
    "              style={styles.restoreInput}\n              accessibilityLabel=\"백업 JSON 입력\"\n            />",
)
app_path.write_text(app)

# ---------- UI primitives: remove stray fonts and lock touch targets ----------
ui = ui_path.read_text()
ui = ui.replace("import { C, styles } from './styles';\n", "import { C, styles } from './styles';\nimport { FONT } from './typography';\n")
ui = ui.replace(
    "  dark = false,\n}: {",
    "  dark = false,\n  accessibilityHint,\n}: {",
)
ui = ui.replace(
    "  dark?: boolean;\n}) {",
    "  dark?: boolean;\n  accessibilityHint?: string;\n}) {",
)
ui = ui.replace(
    "      accessibilityRole=\"button\"\n      accessibilityState={{ disabled }}",
    "      accessibilityRole=\"button\"\n      accessibilityLabel={label}\n      accessibilityHint={accessibilityHint}\n      accessibilityState={{ disabled }}",
)
header_pattern = re.compile(r"export function Header\(\{ onInfo \}: \{ onInfo: \(\) => void \}\) \{.*?\n\}\n\nexport function FormStep", re.S)
header_replacement = """export function Header({ onInfo }: { onInfo: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandLockup} accessibilityRole=\"header\">
        <View style={{ width: 20, height: 4, backgroundColor: C.blue }} />
        <View>
          <Text style={styles.brand}>BAEMILGI 2000</Text>
          <Text style={{ color: C.faint, fontSize: 10, fontFamily: FONT.data, fontWeight: '800', letterSpacing: 1, marginTop: 1 }}>
            DOJO TRAINING LOG
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onInfo}
        accessibilityRole=\"button\"
        accessibilityLabel=\"정보 및 설정\"
        hitSlop={6}
        style={({ pressed }) => [styles.circle, pressed && { opacity: 0.62, transform: [{ scale: 0.97 }] }]}
      >
        <Text style={[styles.circleText, { fontFamily: FONT.data }]}>INFO</Text>
      </Pressable>
    </View>
  );
}

export function FormStep"""
ui, count = header_pattern.subn(header_replacement, ui)
if count != 1:
    raise SystemExit(f'Header replacement count={count}')
ui_path.write_text(ui)

# ---------- Onboarding: truthful history label, back navigation, link errors ----------
onboarding = onboarding_path.read_text()
onboarding = onboarding.replace("  Keyboard,\n", "  Alert,\n  Keyboard,\n")
onboarding = onboarding.replace("  ScrollView,\n", "  ScrollView,\n  StatusBar,\n")
setup_pattern = re.compile(r"function SetupTop\(\{ step, total \}: \{ step: number; total: number \}\) \{.*?\n\}\n", re.S)
setup_replacement = """function SetupTop({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <View style={styles.setupTop}>
      <View style={{ flex: 1 }}>
        <Text style={styles.setupBrand}>BAEMILGI / 2000</Text>
      </View>
      <Text style={styles.setupCount}>SETUP / {String(step).padStart(2, '0')}</Text>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole=\"button\"
          accessibilityLabel=\"이전 단계\"
          hitSlop={6}
          style={styles.setupBack}
        >
          <Text style={styles.setupBackText}>←</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
"""
onboarding, count = setup_pattern.subn(setup_replacement, onboarding)
if count != 1:
    raise SystemExit(f'SetupTop replacement count={count}')
onboarding = onboarding.replace("<SetupTop step={1} total={4} />", "<SetupTop step={1} onBack={() => setStep('intro')} />")
onboarding = onboarding.replace("<SetupTop step={2} total={4} />", "<SetupTop step={2} onBack={() => setStep('experience')} />")
onboarding = onboarding.replace("<SetupTop step={3} total={4} />", "<SetupTop step={3} onBack={() => setStep('form')} />")
onboarding = onboarding.replace("<SetupTop step={2} total={2} />", "<SetupTop step={2} onBack={() => setStep('experience')} />")
onboarding = onboarding.replace("<SetupTop step={4} total={4} />", "<SetupTop step={4} onBack={() => setStep('measureIntro')} />")
onboarding = onboarding.replace("<Text style={styles.introYear}>EST. 1911</Text>", "<Text style={styles.introYear}>GAMA / 1911 ARCHIVE</Text>")
if "const openReference =" not in onboarding:
    onboarding = onboarding.replace(
        "export function Onboarding({ onDone }: { onDone: (next: AppState) => void }) {",
        """const openReference = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('링크를 열 수 없어', '네트워크 연결을 확인한 뒤 다시 시도해줘.');
  }
};

export function Onboarding({ onDone }: { onDone: (next: AppState) => void }) {""",
    )
onboarding = onboarding.replace("Linking.openURL(FORM_VIDEO_URL)", "openReference(FORM_VIDEO_URL)")
onboarding = onboarding.replace(
    "    <SafeAreaView style={styles.root}>\n      <View style={styles.workout}>",
    "    <SafeAreaView style={styles.root}>\n      <StatusBar barStyle=\"light-content\" />\n      <View style={styles.workout}>",
)
onboarding_path.write_text(onboarding)

# ---------- Workout: explicit status-bar modes, clearer focus copy, accessibility ----------
workout = workout_path.read_text()
workout = workout.replace("  StyleSheet,\n", "  StyleSheet,\n  StatusBar,\n")
workout = workout.replace(
    "    <View style={[S.flash, cleared ? S.flashLight : S.flashLight]} pointerEvents=\"none\">",
    """    <View
      style={[S.flash, S.flashLight]}
      pointerEvents=\"none\"
      accessible
      accessibilityLiveRegion=\"assertive\"
      accessibilityLabel={`${value}개, ${cleared ? '성공 기록' : '중단 기록'} 저장 중`}
    >
      <StatusBar barStyle=\"dark-content\" />""",
)
workout = workout.replace("setTimeout(() => onFinish(true, seconds, target), 720);", "setTimeout(() => onFinish(true, seconds, target), 950);")
workout = workout.replace("setTimeout(() => onFinish(false, seconds, reps), 620);", "setTimeout(() => onFinish(false, seconds, reps), 850);")
workout = workout.replace(
    "      <SafeAreaView style={S.logRoot}>\n        <KeyboardAvoidingView",
    "      <SafeAreaView style={S.logRoot}>\n        <StatusBar barStyle=\"dark-content\" />\n        <KeyboardAvoidingView",
)
# Challenge and Training each use the dark active root. Replace both occurrences.
workout = workout.replace(
    "    <SafeAreaView style={S.activeRoot}>\n      <View style={S.activePage}>",
    "    <SafeAreaView style={S.activeRoot}>\n      <StatusBar barStyle=\"light-content\" />\n      <View style={S.activePage}>",
)
workout = workout.replace(
    "        <Text style={S.activeHint}>직접 횟수를 세고, 자세가 무너지면 STOP HERE. 이 화면은 목표와 시간만 잡아준다.</Text>",
    "        <Text style={S.activeHint}>직접 세어. 자세가 무너지거나 불편하면 STOP HERE.</Text>",
)
workout = workout.replace(
    "          <Pressable style={({ pressed }) => [S.completeAction, pressed && S.pressed]} onPress={finishCleared}>",
    "          <Pressable accessibilityRole=\"button\" accessibilityLabel=\"퀘스트 완료 기록\" style={({ pressed }) => [S.completeAction, pressed && S.pressed]} onPress={finishCleared}>",
)
workout = workout.replace(
    "          <Pressable style={({ pressed }) => [S.stopAction, pressed && S.pressed]} onPress={() => setRecordFailure(true)}>",
    "          <Pressable accessibilityRole=\"button\" accessibilityLabel=\"여기까지 기록\" style={({ pressed }) => [S.stopAction, pressed && S.pressed]} onPress={() => setRecordFailure(true)}>",
)
workout_path.write_text(workout)

# ---------- Core: sanitize restored/edited records ----------
core = core_path.read_text()
old_actual = """  const actualReps = type === 'challenge'
    ? (Number.isFinite(parsedActual) ? Math.max(0, Math.floor(parsedActual)) : success ? target : undefined)
    : undefined;
"""
new_actual = """  const actualReps = type === 'challenge'
    ? success
      ? target
      : Number.isFinite(parsedActual)
        ? Math.min(Math.max(0, target - 1), Math.max(0, Math.floor(parsedActual)))
        : undefined
    : undefined;
"""
if old_actual not in core:
    raise SystemExit('safeSession actualReps block not found')
core = core.replace(old_actual, new_actual)
old_safe_return = """  return {
    onboarded: Boolean(raw?.onboarded),
    pushupMax: Number.isFinite(raw?.pushupMax) ? Math.max(0, Math.floor(raw.pushupMax)) : null,
    firstBaemilgiMax: Number.isFinite(raw?.firstBaemilgiMax) ? Math.max(0, Math.floor(raw.firstBaemilgiMax)) : null,
    clearedLevel,
    selectedLevel: Math.max(minimumSelected, Math.min(200, Number(raw?.selectedLevel) || 1)),
    sessions,
  };
"""
new_safe_return = """  const candidate: AppState = {
    onboarded: Boolean(raw?.onboarded),
    pushupMax: Number.isFinite(raw?.pushupMax) ? Math.min(2000, Math.max(0, Math.floor(raw.pushupMax))) : null,
    firstBaemilgiMax: Number.isFinite(raw?.firstBaemilgiMax) ? Math.min(2000, Math.max(0, Math.floor(raw.firstBaemilgiMax))) : null,
    clearedLevel,
    selectedLevel: Math.max(minimumSelected, Math.min(200, Number(raw?.selectedLevel) || 1)),
    sessions,
  };
  return recomputeProgress(candidate);
"""
if old_safe_return not in core:
    raise SystemExit('safeState return block not found')
core = core.replace(old_safe_return, new_safe_return)
core_path.write_text(core)

# ---------- Styles: real mobile legibility + one spacing system ----------
styles = styles_path.read_text()
replacements = {
    "root: { flex: 1, backgroundColor: C.bg }": "root: { flex: 1, backgroundColor: C.gi }",
    "introTop: { height: 62,": "introTop: { height: 64,",
    "introSignalText: { color: C.gi, fontSize: 9,": "introSignalText: { color: C.gi, fontSize: 10,",
    "introMeta: { fontFamily: bodyFont, color: C.faint, fontSize: 10, lineHeight: 16,": "introMeta: { fontFamily: bodyFont, color: C.faint, fontSize: 11, lineHeight: 17,",
    "setupTop: { height: 62,": "setupTop: { height: 64,",
    "setupCount: { color: C.blue, fontSize: 9,": "setupCount: { color: C.blue, fontSize: 10,",
    "recommendLabel: { alignSelf: 'flex-start', color: C.gi, backgroundColor: C.blue, fontSize: 9,": "recommendLabel: { alignSelf: 'flex-start', color: C.gi, backgroundColor: C.blue, fontSize: 10,",
    "kicker: { color: C.blue, fontSize: 9,": "kicker: { color: C.blue, fontSize: 10,",
    "circle: { minWidth: 44, height: 38,": "circle: { minWidth: 44, minHeight: 44,",
    "circleText: { color: C.ink, fontSize: 8,": "circleText: { color: C.ink, fontSize: 10,",
    "storageInline: { minHeight: 34,": "storageInline: { minHeight: 44,",
    "storageInlineText: { fontFamily: bodyFont, flex: 1, color: C.muted, fontSize: 10,": "storageInlineText: { fontFamily: bodyFont, flex: 1, color: C.muted, fontSize: 11,",
    "storageInlineCode: { color: C.faint, fontSize: 8,": "storageInlineCode: { color: C.faint, fontSize: 10,",
    "currentLabel: { color: C.blue, fontSize: 9,": "currentLabel: { color: C.blue, fontSize: 10,",
    "pageEyebrow: { color: C.stamp, fontSize: 9,": "pageEyebrow: { color: C.stamp, fontSize: 10,",
    "questHeroCopy: { fontFamily: bodyFont, color: '#D7DFEA', fontSize: 10,": "questHeroCopy: { fontFamily: bodyFont, color: '#D7DFEA', fontSize: 11,",
    "questProgressCopy: { color: '#D7DFEA', fontSize: 9,": "questProgressCopy: { color: '#D7DFEA', fontSize: 10,",
    "cellLevel: { color: C.ink, fontSize: 10,": "cellLevel: { color: C.ink, fontSize: 11,",
    "cellReps: { color: C.muted, fontSize: 9, lineHeight: 12,": "cellReps: { color: C.muted, fontSize: 10, lineHeight: 14,",
    "statLabel: { color: C.blue, fontSize: 8,": "statLabel: { color: C.blue, fontSize: 10,",
    "nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 74,": "nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 80,",
    "navText: { color: C.muted, fontSize: 9,": "navText: { color: C.muted, fontSize: 11,",
    "dojoQuestCode: { color: C.muted, fontSize: 10,": "dojoQuestCode: { color: C.muted, fontSize: 11,",
    "dojoMetaRight: { color: C.blue, fontSize: 8,": "dojoMetaRight: { color: C.blue, fontSize: 10,",
    "dojoCurrentBestLabel: { color: C.muted, fontSize: 9,": "dojoCurrentBestLabel: { color: C.muted, fontSize: 10,",
    "questBandItemText: { color: C.faint, fontFamily: labelFont, fontSize: 10,": "questBandItemText: { color: C.faint, fontFamily: labelFont, fontSize: 11,",
    "archiveFooterValue: { color: C.faint, fontFamily: labelFont, fontSize: 8,": "archiveFooterValue: { color: C.faint, fontFamily: labelFont, fontSize: 10,",
    "archiveHeadText: { color: C.muted, fontFamily: labelFont, fontSize: 8,": "archiveHeadText: { color: C.muted, fontFamily: labelFont, fontSize: 10,",
    "archiveCell: { color: C.ink, fontFamily: labelFont, fontSize: 10,": "archiveCell: { color: C.ink, fontFamily: labelFont, fontSize: 11,",
    "stampSmallText: { color: C.stamp, fontFamily: displayFont, fontSize: 11,": "stampSmallText: { color: C.stamp, fontFamily: displayFont, fontSize: 12,",
    "stoppedTagText: { color: C.muted, fontFamily: labelFont, fontSize: 8,": "stoppedTagText: { color: C.muted, fontFamily: labelFont, fontSize: 10,",
    "drillTagText: { color: C.blue, fontFamily: labelFont, fontSize: 8,": "drillTagText: { color: C.blue, fontFamily: labelFont, fontSize: 10,",
}
for old, new in replacements.items():
    styles = styles.replace(old, new)
if "setupBack:" not in styles:
    styles = styles.replace(
        "  setupCount: { color: C.blue, fontSize: 10, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1 },\n",
        "  setupCount: { color: C.blue, fontSize: 10, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1 },\n"
        "  setupBack: { minWidth: 44, minHeight: 44, marginLeft: 8, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderStyle: 'dashed', borderColor: C.line },\n"
        "  setupBackText: { color: C.ink, fontSize: 20, lineHeight: 22, fontFamily: headlineFont, fontWeight: '800' },\n",
    )
styles_path.write_text(styles)

# ---------- Native release appearance ----------
import json
app_json = json.loads(app_json_path.read_text())
expo = app_json['expo']
expo['userInterfaceStyle'] = 'light'
expo['backgroundColor'] = '#FAF9F6'
expo.setdefault('splash', {})['backgroundColor'] = '#FAF9F6'
expo.setdefault('ios', {})['backgroundColor'] = '#FAF9F6'
app_json_path.write_text(json.dumps(app_json, ensure_ascii=False, indent=2) + '\n')

# ---------- Design rules / release checklist ----------
design = design_path.read_text()
if '## 13. Release-grade interaction rules' not in design:
    design += """

## 13. Release-grade interaction rules

- Functional information must be true. Never copy fake `STREAK`, calories, heart rate, calibration, percentage, unrelated drills or other prototype-only metrics into production.
- Primary controls should provide at least a 44×44pt hit region; primary workout actions target 56pt height.
- Long-term records must remain reachable. The archive loads older entries in batches instead of silently truncating history.
- A storage read failure must never fall through into a fresh state that can overwrite an existing archive.
- OTA updates must never force an in-session reload. Updates may download on launch and become active on a later launch.
- Onboarding must support going backward before committing the baseline.
- Historical references must be labeled as historical references. Never imply that BAEMILGI 2000 was established in 1911.
- Decorative progression bands and micro-labels must not create noisy VoiceOver output. Group meaningful metrics and label editable archive rows as actions.
- The visual language may be technical, but important operational text should remain readable on a real iPhone. Tiny prototype labels are not production UI.
"""
design_path.write_text(design)

qa_path.write_text("""# BAEMILGI 2000 — Release QA

This checklist treats BAEMILGI 2000 as a real iOS product, not a design prototype.

## P0 — Block release if any fail

- [ ] Existing local records survive update, force quit, and normal relaunch.
- [ ] Simulated AsyncStorage read failure never opens an empty writable profile.
- [ ] Challenge complete saves exactly one record.
- [ ] STOP HERE never stores a stopped count equal to or above the target.
- [ ] Training completes the intended set count and stores one training record.
- [ ] Delete/edit recalculates progression correctly.
- [ ] No OTA-triggered reload occurs while a challenge/training session is active.
- [ ] Privacy and support pages open from the shipping build.
- [ ] App launches without a blank screen on the oldest supported iPhone size.

## P1 — UX / accessibility

- [ ] Home communicates next target, current best, Challenge and Training within ~2 seconds.
- [ ] Every actionable control has at least a 44pt hit region.
- [ ] VoiceOver reads Home hero as one meaningful metric, not disconnected numbers.
- [ ] Archive rows announce type, level, reps and status and are identified as editable buttons.
- [ ] Bottom tabs have readable labels and selected state.
- [ ] Large Text / Bold Text does not hide primary actions or critical instructions.
- [ ] Dark active screens explicitly use a light status bar; light screens use a dark status bar.
- [ ] Color is never the only carrier of cleared/stopped state.
- [ ] Pressed states are visible on custom buttons.

## P1 — Long-term product behavior

- [ ] More than 30 sessions remain reachable through “older records”.
- [ ] Export and restore round-trip the same record count and progression.
- [ ] App deletion risk is clearly communicated before the user relies on local-only history.
- [ ] A user can correct an accidental result from the archive.

## P2 — Brand consistency

- [ ] Gi White / Ink / Judo Blue / Stamp Red palette is consistent.
- [ ] Display metric, UI sans, data mono and archival serif roles are not mixed.
- [ ] `1911` is presented only as a historical Gama reference, never as BAEMILGI’s founding date.
- [ ] Challenge/Training use the dark Tatami focus state; Archive uses the training-ledger state.
- [ ] No prototype-only content survives: STREAK, fake percentages, fake exercise types, calories, BPM, auto rep count, calibration.

## Device pass before App Store submission

- [ ] Small iPhone (SE-class width)
- [ ] Standard iPhone
- [ ] Large/Max iPhone
- [ ] Light appearance and system Bold Text
- [ ] Larger Accessibility Text
- [ ] VoiceOver
- [ ] Airplane/offline mode for core local flows
- [ ] Incoming call / background / foreground during active workout
""")

print('Applied release UX hardening pass.')
