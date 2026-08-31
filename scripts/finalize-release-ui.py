from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing patch target: {label}')
    return text.replace(old, new, 1)


app_path = Path('App.tsx')
app = app_path.read_text()

app = replace_once(
    app,
    "import { Challenge, Training } from './src/Workout';\n",
    "import { Challenge, Training } from './src/Workout';\nimport { BAEMILGI_MARTIAL_COPY, CHAPTER_GUIDE_COPY, TRAINING_CHAPTERS, chapterForLevel } from './src/chapters';\n",
    'chapter import',
)

app = replace_once(
    app,
    "  const milestoneLevels = [50, 100, 130, 150, 175, 200];\n",
    "  const milestoneLevels = [50, 100, 130, 150, 175, 200];\n  const currentChapter = chapterForLevel(nextLevel);\n",
    'current chapter',
)

old_storage = '''            <View style={styles.storageInline} accessibilityLiveRegion="polite">
              <View style={[styles.storageDot, saveStatus === 'error' && styles.storageDotError]} />
              <Text style={styles.storageInlineText}>
                {saveStatus === 'saving' ? '저장 중' : saveStatus === 'error' ? '저장 확인 필요' : 'LOCAL TRAINING RECORD'}
              </Text>
              <Text style={styles.storageInlineCode}>DOJO / ON</Text>
            </View>
'''
new_storage = '''            {saveStatus !== 'saved' ? (
              <View style={styles.storageInline} accessibilityLiveRegion="polite">
                <View style={[styles.storageDot, saveStatus === 'error' && styles.storageDotError]} />
                <Text style={styles.storageInlineText}>
                  {saveStatus === 'saving' ? '기록 저장 중' : '저장을 확인해줘'}
                </Text>
              </View>
            ) : null}
'''
app = replace_once(app, old_storage, new_storage, 'quiet storage status')

app = replace_once(
    app,
    "              <Text style={styles.dojoMetaRight}>{state.clearedLevel} / 200 CLEARED</Text>\n",
    "              <Text style={[styles.dojoMetaRight, { color: currentChapter.id === 'white' ? '#686A68' : currentChapter.color }]}>{currentChapter.name} CHAPTER</Text>\n",
    'chapter meta',
)

hero_end = '''            </View>

            <View style={styles.questBandStage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
'''
hero_insert = '''            </View>

            <View style={[styles.chapterRibbon, { backgroundColor: currentChapter.color }]} accessible accessibilityLabel={`${currentChapter.name} 훈련 챕터, 퀘스트 ${currentChapter.startLevel}부터 ${currentChapter.endLevel}`}>
              <Text style={[styles.chapterRibbonName, { color: currentChapter.textColor }]}>{currentChapter.name}</Text>
              <Text style={[styles.chapterRibbonMeta, { color: currentChapter.textColor }]}>{currentChapter.label} · Q{String(currentChapter.startLevel).padStart(3, '0')}—{String(currentChapter.endLevel).padStart(3, '0')}</Text>
            </View>

            <View style={styles.questBandStage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
'''
app = replace_once(app, hero_end, hero_insert, 'home chapter ribbon')

app = replace_once(
    app,
    "                    <View key={level} style={[styles.questBandItem, active && styles.questBandActive]}>\n",
    "                    <View key={level} style={[styles.questBandItem, active && styles.questBandActive, active && { borderBottomColor: currentChapter.color }]}>\n",
    'active band color',
)

quest_intro = '''          <Text style={styles.pageCopy}>200개 칸을 훑는 대신, 지금 필요한 단계와 앞으로 만날 관문만 보여줄게.</Text>

          <View style={styles.questHero}>
'''
quest_intro_new = '''          <Text style={styles.pageCopy}>200개를 다 펼쳐놓지 않고, 지금의 훈련 챕터와 가까운 퀘스트만 보여줘.</Text>

          <Pressable
            style={styles.chapterGuide}
            onPress={() => Alert.alert('5색 훈련 챕터', CHAPTER_GUIDE_COPY)}
            accessibilityRole="button"
            accessibilityLabel="5색 훈련 챕터 안내"
          >
            <View style={styles.chapterGuideHeader}>
              <Text style={styles.chapterGuideTitle}>TRAINING CHAPTERS</Text>
              <Text style={styles.chapterGuideHint}>공식 띠 등급 아님 · 안내 →</Text>
            </View>
            <View style={styles.chapterSwatches}>
              {TRAINING_CHAPTERS.map((chapter) => {
                const active = chapter.id === currentChapter.id;
                return (
                  <View key={chapter.id} style={styles.chapterSwatchItem}>
                    <View style={[styles.chapterSwatch, { backgroundColor: chapter.color }, active && styles.chapterSwatchActive]} />
                    <Text style={[styles.chapterSwatchLabel, active && styles.chapterSwatchLabelActive]}>{chapter.name}</Text>
                  </View>
                );
              })}
            </View>
          </Pressable>

          <View style={styles.questHero}>
'''
app = replace_once(app, quest_intro, quest_intro_new, 'quest chapter guide')

app = replace_once(
    app,
    "              <Button label=\"공식 자세 다시 보기\" secondary onPress={() => { setInfoOpen(false); setFormOpen(true); }} />\n",
    "              <Button label=\"배밀기와 무도\" secondary onPress={() => Alert.alert('배밀기와 무도', BAEMILGI_MARTIAL_COPY)} />\n              <Button label=\"5색 훈련 챕터\" secondary onPress={() => Alert.alert('5색 훈련 챕터', CHAPTER_GUIDE_COPY)} />\n              <Button label=\"배밀기 자세 다시 보기\" secondary onPress={() => { setInfoOpen(false); setFormOpen(true); }} />\n",
    'info guide actions',
)

app = replace_once(
    app,
    "            <Text style={styles.sheetTitle}>공식 배밀기 자세</Text>\n",
    "            <Text style={styles.sheetTitle}>배밀기 자세</Text>\n            <Text style={styles.sheetCopy}>힌두 푸시업이라고도 불리는 동작이야. 유도 훈련에서도 기초 체력 동작으로 쓰이지만, 아래 안내는 특정 협회의 공식 기술 규정이 아니라 안전한 동작 이해를 위한 앱 가이드야.</Text>\n",
    'form context',
)

app_path.write_text(app)


styles_path = Path('src/styles.ts')
styles = styles_path.read_text()
replacements = [
    ("  button: { minHeight: 56, borderRadius: 0, backgroundColor: C.blue, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },",
     "  button: { minHeight: 56, borderRadius: 0, backgroundColor: C.blue, borderWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },"),
    ("  buttonSecondary: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: C.muted },",
     "  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },"),
    ("  circle: { minWidth: 44, minHeight: 44, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },",
     "  circle: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },"),
    ("  questHero: { backgroundColor: C.blue, borderRadius: 0, padding: 17, marginBottom: 26 },",
     "  questHero: { backgroundColor: 'transparent', paddingVertical: 24, marginBottom: 28, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },"),
    ("  questHeroLevel: { color: C.gi, fontSize: 25, lineHeight: 29, fontFamily: headlineFont, fontWeight: '900', letterSpacing: -0.8 },",
     "  questHeroLevel: { color: C.ink, fontSize: 20, lineHeight: 25, fontFamily: headlineFont, fontWeight: '800', letterSpacing: -0.3 },"),
    ("  questHeroCopy: { fontFamily: bodyFont, color: '#D7DFEA', fontSize: 11, fontWeight: '900', marginTop: 3 },",
     "  questHeroCopy: { fontFamily: bodyFont, color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },"),
    ("  questHeroTarget: { color: C.gi, fontSize: 46, lineHeight: 49, fontFamily: metricFont, fontWeight: '900', letterSpacing: -2.2, fontVariant: ['tabular-nums'] },",
     "  questHeroTarget: { color: C.ink, fontSize: 68, lineHeight: 80, fontFamily: metricFont, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },"),
    ("  questHeroUnit: { fontFamily: bodyFont, color: C.gi, fontSize: 12, fontWeight: '900' },",
     "  questHeroUnit: { fontFamily: bodyFont, color: C.muted, fontSize: 12, fontWeight: '800' },"),
    ("  questProgressCopy: { color: '#D7DFEA', fontSize: 10, fontFamily: labelFont, fontWeight: '900', marginTop: 8 },",
     "  questProgressCopy: { color: C.muted, fontSize: 10, fontFamily: labelFont, fontWeight: '800', marginTop: 8 },"),
    ("  cell: { width: '23%', minHeight: 67, borderWidth: 1, borderColor: C.line, backgroundColor: C.gi, borderRadius: 0, padding: 8, justifyContent: 'space-between' },",
     "  cell: { width: '23%', minHeight: 58, borderWidth: 0, borderBottomWidth: 1, borderColor: C.line, backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 3, justifyContent: 'space-between' },"),
    ("  cellDone: { backgroundColor: C.blue, borderColor: C.blue },",
     "  cellDone: { backgroundColor: C.panelLift, borderColor: C.line },"),
    ("  cellSelected: { backgroundColor: C.ink, borderColor: C.ink },",
     "  cellSelected: { backgroundColor: 'transparent', borderBottomWidth: 3, borderColor: C.blue },"),
    ("  cellTextInverse: { color: C.gi },",
     "  cellTextInverse: { color: C.ink },"),
    ("  stats: { flexDirection: 'row', marginTop: 8, marginBottom: 32, borderWidth: 1, borderColor: C.line },",
     "  stats: { flexDirection: 'row', marginTop: 8, marginBottom: 32, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },"),
    ("  stat: { flex: 1, minHeight: 86, justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 10, borderRightWidth: 1, borderColor: C.line },",
     "  stat: { flex: 1, minHeight: 82, justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 4 },"),
    ("  storageCard: { backgroundColor: C.panelLift, borderLeftWidth: 4, borderColor: C.blue, paddingHorizontal: 16, paddingTop: 16, marginBottom: 32 },",
     "  storageCard: { backgroundColor: 'transparent', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingVertical: 16, marginBottom: 32 },"),
    ("  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 80, backgroundColor: '#FAF9F6FA', borderTopWidth: 2, borderColor: C.ink, flexDirection: 'row', paddingBottom: 7, paddingHorizontal: 10 },",
     "  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 76, backgroundColor: '#FAF9F6FA', borderTopWidth: 1, borderColor: C.line, flexDirection: 'row', paddingBottom: 7, paddingHorizontal: 10 },"),
    ("  navButtonActive: { backgroundColor: C.accentSoft, borderColor: C.blue },",
     "  navButtonActive: { backgroundColor: 'transparent', borderColor: C.blue },"),
    ("  dojoMeta: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, paddingTop: 8, paddingBottom: 16 },",
     "  dojoMeta: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 8 },"),
    ("  dojoHero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line },",
     "  dojoHero: { alignItems: 'center', paddingTop: 28, paddingBottom: 24 },"),
    ("  dojoHeroNumber: { color: C.ink, fontFamily: metricFont, fontSize: 116, lineHeight: 120, fontWeight: '900', letterSpacing: -5, fontVariant: ['tabular-nums'] },",
     "  dojoHeroNumber: { color: C.ink, fontFamily: metricFont, fontSize: 108, lineHeight: 126, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },"),
    ("  questBandStage: { minHeight: 96, justifyContent: 'center', marginTop: 16, marginBottom: 8, position: 'relative' },",
     "  questBandStage: { minHeight: 66, justifyContent: 'center', marginTop: 10, marginBottom: 10, position: 'relative' },"),
    ("  questBandStitch: { position: 'absolute', left: 0, right: 0, top: 45, borderTopWidth: 1, borderStyle: 'dashed', borderColor: C.line },",
     "  questBandStitch: { position: 'absolute', left: 0, right: 0, top: 33, borderTopWidth: 1, borderColor: C.line },"),
    ("  questBand: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gi, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.blue, paddingHorizontal: 8, gap: 3 },",
     "  questBand: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', paddingHorizontal: 4, gap: 3 },"),
    ("  questBandItem: { minWidth: 38, height: 34, alignItems: 'center', justifyContent: 'center', position: 'relative' },",
     "  questBandItem: { minWidth: 38, height: 34, alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 3, borderBottomColor: 'transparent' },"),
    ("  questBandActive: { backgroundColor: C.ink, borderWidth: 2, borderColor: C.ink, minWidth: 44 },",
     "  questBandActive: { backgroundColor: 'transparent', minWidth: 44 },"),
    ("  questBandActiveText: { fontFamily: labelFont, color: C.gi, fontSize: 11, fontWeight: '900' },",
     "  questBandActiveText: { fontFamily: labelFont, color: C.ink, fontSize: 12, fontWeight: '900' },"),
    ("  questBandTape: { position: 'absolute', left: -4, top: -2, bottom: -2, width: 4, backgroundColor: C.blue },",
     "  questBandTape: { display: 'none' },"),
    ("  archiveFooter: { marginTop: 32, paddingTop: 16, paddingBottom: 16, borderTopWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },",
     "  archiveFooter: { marginTop: 28, paddingTop: 16, paddingBottom: 16, borderTopWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },"),
    ("  archivePanel: { borderTopWidth: 4, borderTopColor: C.blue, paddingTop: 16 },",
     "  archivePanel: { paddingTop: 8 },"),
    ("  archiveTitle: { color: C.ink, fontFamily: displayFont, fontSize: 32, lineHeight: 39, fontWeight: '900', letterSpacing: 0.6 },",
     "  archiveTitle: { color: C.ink, fontFamily: displayFont, fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -0.6 },"),
    ("  archiveTableHead: { flexDirection: 'row', alignItems: 'center', minHeight: 38, borderTopWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, marginTop: 6 },",
     "  archiveTableHead: { flexDirection: 'row', alignItems: 'center', minHeight: 38, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, marginTop: 6 },"),
    ("  archiveEntry: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, position: 'relative' },",
     "  archiveEntry: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: C.line, position: 'relative' },"),
]
for old, new in replacements:
    styles = replace_once(styles, old, new, old[:36])

anchor = "  archiveFooterValue: { color: C.faint, fontFamily: labelFont, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 5 },\n\n"
chapter_styles = """  archiveFooterValue: { color: C.faint, fontFamily: labelFont, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 5 },
  chapterRibbon: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 2 },
  chapterRibbonName: { fontFamily: headlineFont, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  chapterRibbonMeta: { fontFamily: labelFont, fontSize: 9, fontWeight: '900', letterSpacing: 0.6, opacity: 0.88 },
  chapterGuide: { marginBottom: 24, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  chapterGuideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  chapterGuideTitle: { color: C.ink, fontFamily: headlineFont, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  chapterGuideHint: { color: C.faint, fontFamily: bodyFont, fontSize: 10, fontWeight: '700' },
  chapterSwatches: { flexDirection: 'row', gap: 8 },
  chapterSwatchItem: { flex: 1, gap: 6 },
  chapterSwatch: { height: 8, borderWidth: 1, borderColor: '#12121222' },
  chapterSwatchActive: { height: 12, marginTop: -2, borderColor: C.ink },
  chapterSwatchLabel: { color: C.faint, fontFamily: labelFont, fontSize: 8, fontWeight: '900', textAlign: 'center' },
  chapterSwatchLabelActive: { color: C.ink },

"""
styles = replace_once(styles, anchor, chapter_styles, 'chapter styles')
styles_path.write_text(styles)


workout_path = Path('src/Workout.tsx')
workout = workout_path.read_text()
workout_replacements = [
    ("  matFrame: { flex: 1, maxHeight: 430, minHeight: 360, marginTop: 32, borderWidth: 2, borderColor: '#354B69', backgroundColor: '#151515', position: 'relative', justifyContent: 'center', alignItems: 'center' },",
     "  matFrame: { flex: 1, maxHeight: 460, minHeight: 360, marginTop: 16, backgroundColor: 'transparent', position: 'relative', justifyContent: 'center', alignItems: 'center' },"),
    ("  matDots: { position: 'absolute', top: 15, left: 15, flexDirection: 'row', gap: 5 },",
     "  matDots: { display: 'none' },"),
    ("  target: { color: '#FAF9F6', fontFamily: metric, fontSize: 116, lineHeight: 124, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },",
     "  target: { color: '#FAF9F6', fontFamily: metric, fontSize: 110, lineHeight: 138, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },"),
    ("  ledger: { flex: 1, marginTop: 16, borderWidth: 2, borderColor: '#1B365D', backgroundColor: '#FAF9F6', padding: 22, position: 'relative' },",
     "  ledger: { flex: 1, marginTop: 8, backgroundColor: '#FAF9F6', paddingHorizontal: 0, paddingVertical: 20, position: 'relative' },"),
    ("  ledgerBlueTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: '#1B365D' },",
     "  ledgerBlueTop: { width: 56, height: 4, backgroundColor: '#1B365D', marginBottom: 18 },"),
    ("  ledgerTitle: { color: '#121212', fontFamily: serif, fontSize: 30, lineHeight: 35, fontWeight: '900' },",
     "  ledgerTitle: { color: '#121212', fontFamily: headline, fontSize: 30, lineHeight: 38, fontWeight: '800' },"),
    ("  ledgerPrompt: { color: '#686A68', fontFamily: serif, fontStyle: 'italic', fontSize: 13, lineHeight: 20, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: '#1B365D', marginTop: 20, marginBottom: 28 },",
     "  ledgerPrompt: { color: '#686A68', fontFamily: body, fontSize: 13, lineHeight: 20, marginTop: 18, marginBottom: 28 },"),
    ("  flashValue: { color: '#121212', fontFamily: metric, fontSize: 116, lineHeight: 122, fontWeight: '900', letterSpacing: -7, fontVariant: ['tabular-nums'] },",
     "  flashValue: { color: '#121212', fontFamily: metric, fontSize: 110, lineHeight: 136, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },"),
    ("  stampText: { color: '#B22222', fontFamily: serif, fontSize: 25, fontWeight: '900', letterSpacing: 3 },",
     "  stampText: { color: '#B22222', fontFamily: headline, fontSize: 23, fontWeight: '900', letterSpacing: 2.4 },"),
    ("  trainingNumber: { color: '#FAF9F6', fontFamily: metric, fontSize: 112, lineHeight: 120, fontWeight: '900', letterSpacing: -6, fontVariant: ['tabular-nums'] },",
     "  trainingNumber: { color: '#FAF9F6', fontFamily: metric, fontSize: 106, lineHeight: 134, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },"),
]
for old, new in workout_replacements:
    workout = replace_once(workout, old, new, old[:36])
workout_path.write_text(workout)

print('Final release UI patch applied')
