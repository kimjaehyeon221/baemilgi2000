from pathlib import Path

onboarding_path = Path('src/Onboarding.tsx')
workout_path = Path('src/Workout.tsx')
styles_path = Path('src/styles.ts')

# Keep the dark baseline test dark through the iPhone safe-area inset.
onboarding = onboarding_path.read_text()
needle = """  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle=\"light-content\" />
      <View style={styles.workout}>
"""
replacement = """  return (
    <SafeAreaView style={[styles.root, { backgroundColor: '#121212' }]}>
      <StatusBar barStyle=\"light-content\" />
      <View style={styles.workout}>
"""
if needle not in onboarding:
    raise SystemExit('Calibration safe-area block not found')
onboarding = onboarding.replace(needle, replacement, 1)
onboarding_path.write_text(onboarding)

# Active workout controls and operational microcopy must remain readable and tappable.
workout = workout_path.read_text()
workout = workout.replace(
    '<Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">',
    '<Pressable onPress={onClose} hitSlop={6} accessibilityRole="button" accessibilityLabel="닫기" style={S.closeHit}>',
)
workout = workout.replace(
    '<Text style={S.activeHint}>현재 기록에 맞춘 배밀기 보조 훈련. 한 세트를 무리해서 끝내는 것보다 반복 가능한 리듬을 유지해.</Text>',
    '<Text style={S.activeHint}>반복 가능한 리듬을 유지해. 쉬는 동안 호흡을 정리해.</Text>',
)
workout = workout.replace(
    """        <Pressable
          style={({ pressed }) => [rest ? S.stopAction : S.completeAction, pressed && S.pressed]}
          onPress={() => (rest ? (setRest(false), setRestLeft(plan.rest)) : finishSet())}
        >""",
    """        <Pressable
          accessibilityRole=\"button\"
          accessibilityLabel={rest ? '휴식 건너뛰기' : setNumber >= plan.sets ? '훈련 완료 기록' : `${setNumber}세트 완료`}
          style={({ pressed }) => [rest ? S.stopAction : S.completeAction, pressed && S.pressed]}
          onPress={() => (rest ? (setRest(false), setRestLeft(plan.rest)) : finishSet())}
        >""",
)
workout = workout.replace(
    "  focusHeader: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },",
    "  focusHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },",
)
workout = workout.replace(
    "  close: { fontFamily: body, color: '#A8ADAE', fontSize: 34, lineHeight: 36, fontWeight: '300' },",
    "  closeHit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },\n  close: { fontFamily: body, color: '#A8ADAE', fontSize: 34, lineHeight: 36, fontWeight: '300' },",
)
for old, new in {
    "code: { color: '#A8ADAE', fontFamily: mono, fontSize: 10,": "code: { color: '#A8ADAE', fontFamily: mono, fontSize: 11,",
    "targetLabel: { color: '#8B9091', fontFamily: mono, fontSize: 10,": "targetLabel: { color: '#8B9091', fontFamily: mono, fontSize: 11,",
    "elapsed: { position: 'absolute', bottom: 16, right: 16, color: '#7E98BA', fontFamily: mono, fontSize: 10,": "elapsed: { position: 'absolute', bottom: 16, right: 16, color: '#A9B9CF', fontFamily: mono, fontSize: 11,",
    "ledgerCode: { color: '#686A68', fontFamily: mono, fontSize: 8,": "ledgerCode: { color: '#686A68', fontFamily: mono, fontSize: 10,",
    "ledgerLabel: { color: '#686A68', fontFamily: mono, fontSize: 10,": "ledgerLabel: { color: '#686A68', fontFamily: mono, fontSize: 11,",
    "stitchedActionText: { color: '#121212', fontFamily: headline, fontSize: 11,": "stitchedActionText: { color: '#121212', fontFamily: headline, fontSize: 12,",
    "returnActionText: { color: '#686A68', fontFamily: headline, fontSize: 10,": "returnActionText: { color: '#686A68', fontFamily: headline, fontSize: 11,",
    "flashMeta: { color: '#686A68', fontFamily: mono, fontSize: 9,": "flashMeta: { color: '#686A68', fontFamily: mono, fontSize: 11,",
    "trainingBandLabel: { color: '#D5DBE2', fontFamily: mono, fontSize: 10,": "trainingBandLabel: { color: '#D5DBE2', fontFamily: mono, fontSize: 11,",
    "trainingSession: { position: 'absolute', bottom: 14, right: 2, color: '#7E98BA', fontFamily: mono, fontSize: 9,": "trainingSession: { position: 'absolute', bottom: 14, right: 2, color: '#A9B9CF', fontFamily: mono, fontSize: 11,",
}.items():
    workout = workout.replace(old, new)
workout_path.write_text(workout)

# Remove remaining production-critical sub-10pt labels from primary flows.
styles = styles_path.read_text()
for old, new in {
    "introEyebrow: { color: C.stamp, fontSize: 10,": "introEyebrow: { color: C.stamp, fontSize: 11,",
    "heroCode: { color: C.blue, fontSize: 9,": "heroCode: { color: C.blue, fontSize: 11,",
    "heroStatus: { color: C.stamp, fontSize: 9,": "heroStatus: { color: C.stamp, fontSize: 11,",
    "mutedSmall: { color: C.faint, fontSize: 8,": "mutedSmall: { color: C.faint, fontSize: 10,",
    "sectionCode: { color: C.stamp, fontSize: 8,": "sectionCode: { color: C.stamp, fontSize: 10,",
    "milestoneCopy: { color: C.muted, fontSize: 9,": "milestoneCopy: { color: C.muted, fontSize: 10,",
    "historySub: { fontFamily: bodyFont, color: C.faint, fontSize: 10,": "historySub: { fontFamily: bodyFont, color: C.faint, fontSize: 11,",
    "historyEdit: { color: C.stamp, fontSize: 9,": "historyEdit: { color: C.stamp, fontSize: 10,",
}.items():
    styles = styles.replace(old, new)
styles_path.write_text(styles)

print('Applied release UX fine tune pass.')
