from pathlib import Path
import re

app_path = Path('App.tsx')
styles_path = Path('src/styles.ts')
workout_path = Path('src/Workout.tsx')

app = app_path.read_text()
styles = styles_path.read_text()
workout = workout_path.read_text()

# --- App shell: Home exactly follows the Stitch master hierarchy. ---
home_start = app.index("      {tab === 'home' && (")
home_end = app.index("      {tab === 'quests' && (", home_start)
new_home = r'''      {tab === 'home' && (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.homeCanvas}>
            <View style={styles.storageInline} accessibilityLiveRegion="polite">
              <View style={[styles.storageDot, saveStatus === 'error' && styles.storageDotError]} />
              <Text style={styles.storageInlineText}>
                {saveStatus === 'saving' ? '저장 중' : saveStatus === 'error' ? '저장 확인 필요' : 'LOCAL TRAINING RECORD'}
              </Text>
              <Text style={styles.storageInlineCode}>DOJO / ON</Text>
            </View>

            <View style={styles.dojoMeta}>
              <Text style={styles.dojoQuestCode}>QUEST / {String(nextLevel).padStart(3, '0')}</Text>
              <Text style={styles.dojoMetaRight}>{state.clearedLevel} / 200 CLEARED</Text>
            </View>

            <View style={styles.dojoHero}>
              <Text style={styles.dojoHeroNumber}>{nextTarget}</Text>
              <View style={styles.dojoCurrentBestRow}>
                <Text style={styles.dojoCurrentBestLabel}>CURRENT BEST:</Text>
                <Text style={styles.dojoCurrentBestValue}>{hasPersonalRecord ? currentReps : '—'}</Text>
              </View>
            </View>

            <View style={styles.questBandStage}>
              <View style={styles.questBandStitch} />
              <View style={styles.questBand}>
                {nearbyLevels.slice(0, 7).map((level) => {
                  const active = level === nextLevel;
                  const done = level <= state.clearedLevel;
                  return (
                    <View key={level} style={[styles.questBandItem, active && styles.questBandActive]}>
                      {active && <View style={styles.questBandTape} />}
                      <Text style={[
                        styles.questBandItemText,
                        done && styles.questBandDoneText,
                        active && styles.questBandActiveText,
                      ]}>{level}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.primaryActions}>
              <Button label="START CHALLENGE" onPress={() => setChallengeLevel(nextLevel)} />
              <Button label="TRAINING" secondary onPress={() => setTrainingLevel(nextLevel)} />
            </View>

            <Pressable
              style={styles.archiveFooter}
              onPress={() => setTab('records')}
              accessibilityRole="button"
              accessibilityLabel="수련 기록 보기"
            >
              <View>
                <Text style={styles.archiveFooterLabel}>DOJO TRAINING LOG</Text>
                <Text style={styles.archiveFooterValue}>
                  {history.length ? `${history.length} RECENT RECORDS` : 'NO RECORDS YET'}
                </Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

'''
app = app[:home_start] + new_home + app[home_end:]

# --- Archive: transform list into a dojo ledger/table, preserving editing behavior. ---
records_start = app.index("      {tab === 'records' && (")
records_end = app.index("      <View style={styles.nav}>", records_start)
new_records = r'''      {tab === 'records' && (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.archivePanel}>
            <Text style={styles.pageEyebrow}>PERSONAL ARCHIVE / LOCAL</Text>
            <Text style={styles.archiveTitle}>DOJO TRAINING LOG</Text>
            <Text style={styles.pageCopy}>영광의 목록보다 반복의 장부. 성공과 멈춘 지점을 같은 기록으로 남겨.</Text>

            <View style={styles.stats}>
              <Pressable style={styles.stat} onPress={editStartingRecord}>
                <Text style={styles.statLabel}>START / EDIT</Text>
                <Text style={styles.statValue}>{state.firstBaemilgiMax ?? '—'}</Text>
              </Pressable>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>CURRENT BEST</Text>
                <Text style={styles.statValue}>{hasPersonalRecord ? currentReps : '—'}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>CLEARED</Text>
                <Text style={styles.statValue}>{state.clearedLevel}</Text>
              </View>
            </View>

            <View style={styles.archiveTableHead}>
              <Text style={[styles.archiveHeadText, styles.archiveDateCol]}>DATE</Text>
              <Text style={[styles.archiveHeadText, styles.archiveCodeCol]}>CODE</Text>
              <Text style={[styles.archiveHeadText, styles.archiveRepsCol]}>REPS</Text>
              <Text style={[styles.archiveHeadText, styles.archiveStatusCol]}>STATUS</Text>
            </View>

            {history.length === 0 ? (
              <View style={styles.archiveEmpty}>
                <Text style={styles.archiveEmptyTitle}>NO RECORDS YET.</Text>
                <Text style={styles.archiveEmptyCopy}>첫 퀘스트를 시작하면 이곳에 수련 기록이 쌓여.</Text>
              </View>
            ) : (
              history.map(({ session, index }) => {
                const stopped = session.type === 'challenge' && !session.success;
                const reps = stopped ? (session.actualReps ?? 0) : session.target;
                return (
                  <Pressable key={`${session.at}-${index}`} style={styles.archiveEntry} onPress={() => editSession(index)}>
                    <Text style={[styles.archiveCell, styles.archiveDateCol]}>
                      {new Date(session.at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\.\s?/g, '.').replace(/\.$/, '')}
                    </Text>
                    <Text style={[styles.archiveCell, styles.archiveCodeCol]}>
                      {session.type === 'training' ? `D-${String(session.level).padStart(3, '0')}` : `Q-${String(session.level).padStart(3, '0')}`}
                    </Text>
                    <Text style={[styles.archiveReps, styles.archiveRepsCol]}>{reps}</Text>
                    <View style={styles.archiveStatusCol}>
                      {session.type === 'training' ? (
                        <View style={styles.drillTag}><Text style={styles.drillTagText}>DRILL</Text></View>
                      ) : stopped ? (
                        <View style={styles.stoppedTag}><Text style={styles.stoppedTagText}>STOPPED</Text></View>
                      ) : (
                        <View style={styles.stampSmall}><Text style={styles.stampSmallText}>CLEARED</Text></View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}

            <View style={styles.archiveQuote}>
              <Text style={styles.archiveQuoteText}>“THE ARCHIVE IS A LEDGER OF REPETITION.”</Text>
            </View>

            <View style={styles.storageCard}>
              <View style={styles.storageCardTop}>
                <View style={styles.storageDot} />
                <Text style={styles.storageTitle}>LOCAL RECORD</Text>
                <Text style={styles.storageInlineCode}>NO ACCOUNT</Text>
              </View>
              <Text style={styles.storageCopy}>앱 삭제나 기기 변경 전에는 백업이 필요해.</Text>
              <Pressable style={styles.storageAction} onPress={exportRecords}>
                <Text style={styles.storageActionText}>EXPORT ARCHIVE</Text>
                <Text style={styles.linkArrow}>→</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}

'''
app = app[:records_start] + new_records + app[records_end:]

# Ordinary challenge completion already has the physical stamp transition; avoid a second generic modal.
app = app.replace(
'''          } else if (success) {
            setMessage(`레벨 ${challengeLevel} 완료. 아래 단계도 함께 완료됐어.`);
          } else {
            setMessage(`레벨 ${challengeLevel} · ${actualReps}개에서 종료. 이 기록도 남겼어.`);
          }''',
'''          } else {
            setMessage(null);
          }'''
)
app = app.replace('<StatusBar barStyle="light-content" />', '<StatusBar barStyle="dark-content" />')

# --- Shared visual system: closer to the Stitch source, without adding native dependencies. ---
styles = styles.replace("const metricFont = 'Arial';", "const metricFont = 'Avenir Next Condensed';")
styles = styles.replace(
"  header: { height: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderBottomWidth: 1, borderColor: C.activeLine },",
"  header: { height: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.gi, borderBottomWidth: 1, borderColor: C.line },"
)
styles = styles.replace(
"  brand: { color: C.gi, fontSize: 13, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1.2 },",
"  brand: { color: C.ink, fontSize: 15, fontFamily: displayFont, fontWeight: '900', letterSpacing: 1.1 },"
)
styles = styles.replace(
"  brandMark: { color: C.gi, backgroundColor: C.blue, fontSize: 9, fontFamily: labelFont, fontWeight: '900', letterSpacing: 0.7, paddingHorizontal: 6, paddingVertical: 4 },",
"  brandMark: { color: C.gi, backgroundColor: C.blue, fontSize: 9, fontFamily: labelFont, fontWeight: '900', letterSpacing: 0.8, paddingHorizontal: 7, paddingVertical: 4 },"
)
styles = styles.replace(
"  circle: { minWidth: 44, height: 38, borderWidth: 1, borderColor: C.activeLine, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },",
"  circle: { minWidth: 44, height: 38, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },"
)
styles = styles.replace(
"  circleText: { color: '#C7CACB', fontSize: 8, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1 },",
"  circleText: { color: C.ink, fontSize: 8, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1 },"
)
styles = styles.replace(
"  page: { flexGrow: 1, backgroundColor: C.gi, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 106 },",
"  page: { flexGrow: 1, backgroundColor: C.gi, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 104 },"
)
styles = styles.replace(
"  primaryActions: { gap: 9, marginTop: 13 },",
"  primaryActions: { gap: 12, marginTop: 18, width: '100%' },"
)
styles = styles.replace(
"  button: { minHeight: 54, borderRadius: 0, backgroundColor: C.blue, borderWidth: 1, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },",
"  button: { minHeight: 60, borderRadius: 0, backgroundColor: C.blue, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },"
)
styles = styles.replace(
"  buttonSecondary: { backgroundColor: 'transparent', borderColor: C.line },",
"  buttonSecondary: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: C.muted },"
)
styles = styles.replace(
"  buttonText: { color: C.gi, fontSize: 12, fontFamily: labelFont, fontWeight: '900', letterSpacing: 0.8 },",
"  buttonText: { color: C.gi, fontSize: 15, fontFamily: metricFont, fontWeight: '900', letterSpacing: 1.1 },"
)
styles = styles.replace(
"  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 72, backgroundColor: '#121212F8', borderTopWidth: 1, borderColor: C.activeLine, flexDirection: 'row', paddingBottom: 7, paddingHorizontal: 12 },",
"  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 74, backgroundColor: '#FAF9F6FA', borderTopWidth: 2, borderColor: C.ink, flexDirection: 'row', paddingBottom: 7, paddingHorizontal: 10 },"
)
styles = styles.replace(
"  navButtonActive: { backgroundColor: '#1B365D33', borderColor: C.blue },",
"  navButtonActive: { backgroundColor: C.accentSoft, borderColor: C.blue },"
)
styles = styles.replace(
"  navText: { color: '#989B9C', fontSize: 9, fontFamily: labelFont, fontWeight: '900', letterSpacing: 0.3 },",
"  navText: { color: C.muted, fontSize: 9, fontFamily: labelFont, fontWeight: '900', letterSpacing: 0.4 },"
)
styles = styles.replace(
"  navTextActive: { color: C.gi },",
"  navTextActive: { color: C.ink },"
)

insert = r'''
  // Stitch master — Gi & Ink home / woven quest band
  homeCanvas: { flex: 1, width: '100%', alignItems: 'stretch' },
  dojoMeta: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, paddingTop: 6, paddingBottom: 14 },
  dojoQuestCode: { color: C.muted, fontSize: 10, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1.5 },
  dojoMetaRight: { color: C.blue, fontSize: 8, fontFamily: labelFont, fontWeight: '900', letterSpacing: 0.8 },
  dojoHero: { alignItems: 'center', paddingTop: 24, paddingBottom: 18, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line },
  dojoHeroNumber: { color: C.ink, fontFamily: metricFont, fontSize: 116, lineHeight: 120, fontWeight: '900', letterSpacing: -5, fontVariant: ['tabular-nums'] },
  dojoCurrentBestRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 8 },
  dojoCurrentBestLabel: { color: C.muted, fontSize: 9, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1.2 },
  dojoCurrentBestValue: { color: C.ink, fontSize: 13, fontFamily: labelFont, fontWeight: '900' },
  questBandStage: { minHeight: 92, justifyContent: 'center', marginTop: 13, marginBottom: 5, position: 'relative' },
  questBandStitch: { position: 'absolute', left: 0, right: 0, top: 45, borderTopWidth: 1, borderStyle: 'dashed', borderColor: C.line },
  questBand: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gi, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.blue, paddingHorizontal: 8, gap: 3 },
  questBandItem: { minWidth: 38, height: 34, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  questBandItemText: { color: C.faint, fontFamily: labelFont, fontSize: 10, fontWeight: '900' },
  questBandDoneText: { color: C.ink },
  questBandActive: { backgroundColor: C.ink, borderWidth: 2, borderColor: C.ink, minWidth: 44 },
  questBandActiveText: { color: C.gi, fontSize: 11 },
  questBandTape: { position: 'absolute', left: -4, top: -2, bottom: -2, width: 4, backgroundColor: C.blue },
  archiveFooter: { marginTop: 31, paddingTop: 16, paddingBottom: 16, borderTopWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  archiveFooterLabel: { color: C.ink, fontFamily: displayFont, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  archiveFooterValue: { color: C.faint, fontFamily: labelFont, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 5 },

  // Stitch master — dojo training ledger/archive
  archivePanel: { borderTopWidth: 4, borderTopColor: C.blue, paddingTop: 16 },
  archiveTitle: { color: C.ink, fontFamily: displayFont, fontSize: 32, lineHeight: 39, fontWeight: '900', letterSpacing: 0.6 },
  archiveTableHead: { flexDirection: 'row', alignItems: 'center', minHeight: 38, borderTopWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, marginTop: 6 },
  archiveHeadText: { color: C.muted, fontFamily: labelFont, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  archiveEntry: { minHeight: 76, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, position: 'relative' },
  archiveDateCol: { width: '23%' },
  archiveCodeCol: { width: '20%' },
  archiveRepsCol: { width: '18%', textAlign: 'right' },
  archiveStatusCol: { width: '39%', alignItems: 'flex-end' },
  archiveCell: { color: C.ink, fontFamily: labelFont, fontSize: 10, fontWeight: '800' },
  archiveReps: { color: C.ink, fontFamily: metricFont, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  stampSmall: { borderWidth: 2, borderColor: C.stamp, paddingHorizontal: 7, paddingVertical: 4, transform: [{ rotate: '-2deg' }] },
  stampSmallText: { color: C.stamp, fontFamily: displayFont, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  stoppedTag: { borderWidth: 1, borderColor: C.muted, paddingHorizontal: 7, paddingVertical: 4 },
  stoppedTagText: { color: C.muted, fontFamily: labelFont, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  drillTag: { borderWidth: 1, borderColor: C.blue, backgroundColor: C.accentSoft, paddingHorizontal: 7, paddingVertical: 4 },
  drillTagText: { color: C.blue, fontFamily: labelFont, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  archiveEmpty: { minHeight: 160, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line },
  archiveEmptyTitle: { color: C.ink, fontFamily: displayFont, fontSize: 22, fontWeight: '900' },
  archiveEmptyCopy: { color: C.muted, fontSize: 11, marginTop: 8 },
  archiveQuote: { marginTop: 24, marginBottom: 24, borderLeftWidth: 3, borderStyle: 'dashed', borderColor: C.blue, paddingVertical: 9, paddingLeft: 15 },
  archiveQuoteText: { color: C.ink, fontFamily: displayFont, fontSize: 13, lineHeight: 20, fontStyle: 'italic', opacity: 0.78 },
'''
styles = styles.rsplit('\n});', 1)[0] + insert + '\n});\n'

# Workout typography / tactile feedback without adding a native dependency.
workout = workout.replace("  View,\n} from 'react-native';", "  View,\n  Vibration,\n} from 'react-native';")
workout = workout.replace("const metric = 'Arial';", "const metric = 'Avenir Next Condensed';")
workout = workout.replace("    setFlash('cleared');\n    setTimeout", "    setFlash('cleared');\n    Vibration.vibrate(35);\n    setTimeout")
workout = workout.replace("    setFlash('recorded');\n    setTimeout", "    setFlash('recorded');\n    Vibration.vibrate(20);\n    setTimeout")

app_path.write_text(app)
styles_path.write_text(styles)
workout_path.write_text(workout)
