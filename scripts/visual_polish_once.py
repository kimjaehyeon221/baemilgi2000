from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    p.write_text(text.replace(old, new, 1))


# First screen: make the primary action obvious instead of presenting a dead-looking disabled CTA.
replace_once(
    "src/Onboarding.tsx",
    """        <Button
          label={opened ? '내 기록으로 시작' : '먼저 화면을 눌러'}
          disabled={!opened}
          onPress={onContinue}
        />""",
    """        <Button
          label={opened ? '내 기록으로 시작' : '첫 퀘스트 열기'}
          onPress={opened ? onContinue : openQuest}
          accessibilityHint={opened ? '시작 방식 선택으로 이동합니다' : '첫 퀘스트를 열고 시작 기록 준비 상태로 전환합니다'}
        />""",
)

replace_once(
    "src/Onboarding.tsx",
    """  launchTop: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  launchBrand: { color: '#121212', fontFamily: 'Menlo', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  launchMeta: { color: '#1B365D', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  launchStage: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center' },
  launchPressed: { opacity: 0.82 },
  launchMark: { width: 218, height: 218, marginBottom: 8, borderRadius: 48, overflow: 'hidden' },
  launchIcon: { width: '100%', height: '100%' },
  launchCounter: { color: '#121212', fontFamily: 'Avenir Next', fontSize: 62, lineHeight: 70, fontWeight: '800', letterSpacing: -1.8, fontVariant: ['tabular-nums'] },
  launchPrompt: { color: '#686A68', fontSize: 12, fontWeight: '800', letterSpacing: -0.1, marginTop: 2 },
  launchCopyArea: { minHeight: 104, justifyContent: 'flex-end', paddingBottom: 18 },""",
    """  launchTop: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#D7D3CA' },
  launchBrand: { color: '#121212', fontFamily: 'Menlo', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  launchMeta: { color: '#1B365D', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  launchStage: { flex: 1, minHeight: 390, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#D7D3CA' },
  launchPressed: { opacity: 0.82 },
  launchMark: { width: 184, height: 184, marginBottom: 14, borderRadius: 42, overflow: 'hidden' },
  launchIcon: { width: '100%', height: '100%' },
  launchCounter: { color: '#121212', fontFamily: 'Avenir Next', fontSize: 72, lineHeight: 80, fontWeight: '800', letterSpacing: -2.2, fontVariant: ['tabular-nums'] },
  launchPrompt: { color: '#1B365D', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1.05, marginTop: 3 },
  launchCopyArea: { minHeight: 104, justifyContent: 'center', paddingVertical: 16 },""",
)

# Rendered audit exposed this as white text on the white quest hero.
replace_once(
    "App.tsx",
    "            <Text style={[styles.kicker, styles.kickerOnAccent]}>현재 위치</Text>",
    "            <Text style={styles.kicker}>현재 위치</Text>",
)

old_info = '''      <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>배밀기 2000</Text>
            <Text style={styles.sheetCopy}>2,000은 운동 권장량이 아니라 20세기 초 레슬러 Great Gama의 역사적 Dand 고반복 기록에서 가져온 마지막 퀘스트야.</Text>
            <Text style={styles.sheetCopy}>현재 기록은 이 iPhone에 저장돼. 기기를 바꿀 때는 백업을 내보낸 뒤 새 기기에서 복원할 수 있어.</Text>
            <View style={{ gap: 9 }}>
              <Button label="전체 기록 백업" secondary onPress={exportRecords} />
              <Button label="백업 복원" secondary onPress={() => { setInfoOpen(false); setRestoreOpen(true); }} />
              <Button label="배밀기와 무도" secondary onPress={() => Alert.alert('배밀기와 무도', BAEMILGI_MARTIAL_COPY)} />
              <Button label="5색 훈련 챕터" secondary onPress={() => Alert.alert('5색 훈련 챕터', CHAPTER_GUIDE_COPY)} />
              <Button label="배밀기 자세 다시 보기" secondary onPress={() => { setInfoOpen(false); setFormOpen(true); }} />
              <Button label="왜 2,000?" secondary onPress={() => { setInfoOpen(false); setWhyOpen(true); }} />
              <Button label="개인정보 처리방침" secondary onPress={() => openExternal(PRIVACY_URL, '개인정보 처리방침')} />
              <Button label="지원" secondary onPress={() => openExternal(SUPPORT_URL, '지원 페이지')} />
              <Button label="기록 초기화" danger onPress={reset} />
              <Button label="닫기" onPress={() => setInfoOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>'''

new_info = '''      <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.infoSheet}>
            <View style={styles.infoSheetHeader}>
              <View>
                <Text style={styles.infoSheetEyebrow}>ABOUT / LOCAL</Text>
                <Text style={styles.sheetTitle}>배밀기 2000</Text>
              </View>
              <Pressable
                onPress={() => setInfoOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="정보 닫기"
                style={({ pressed }) => [styles.infoSheetClose, pressed && { opacity: 0.55 }]}
              >
                <Text style={styles.infoSheetCloseText}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.infoSheetScrollView}
              contentContainerStyle={styles.infoSheetScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sheetCopy}>2,000은 운동 권장량이 아니라 20세기 초 레슬러 Great Gama의 역사적 Dand 고반복 기록에서 가져온 마지막 퀘스트야.</Text>
              <Text style={styles.sheetCopy}>현재 기록은 이 iPhone에 저장돼. 기기를 바꿀 때는 백업을 내보낸 뒤 새 기기에서 복원할 수 있어.</Text>
              <Text style={styles.infoSheetSectionLabel}>DATA</Text>
              <View style={{ gap: 9 }}>
                <Button label="전체 기록 백업" secondary onPress={exportRecords} />
                <Button label="백업 복원" secondary onPress={() => { setInfoOpen(false); setRestoreOpen(true); }} />
              </View>
              <Text style={styles.infoSheetSectionLabel}>GUIDE</Text>
              <View style={{ gap: 9 }}>
                <Button label="배밀기와 무도" secondary onPress={() => Alert.alert('배밀기와 무도', BAEMILGI_MARTIAL_COPY)} />
                <Button label="5색 훈련 챕터" secondary onPress={() => Alert.alert('5색 훈련 챕터', CHAPTER_GUIDE_COPY)} />
                <Button label="배밀기 자세 다시 보기" secondary onPress={() => { setInfoOpen(false); setFormOpen(true); }} />
                <Button label="왜 2,000?" secondary onPress={() => { setInfoOpen(false); setWhyOpen(true); }} />
              </View>
              <Text style={styles.infoSheetSectionLabel}>SUPPORT</Text>
              <View style={{ gap: 9 }}>
                <Button label="개인정보 처리방침" secondary onPress={() => openExternal(PRIVACY_URL, '개인정보 처리방침')} />
                <Button label="지원" secondary onPress={() => openExternal(SUPPORT_URL, '지원 페이지')} />
                <Button label="기록 초기화" danger onPress={reset} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>'''
replace_once("App.tsx", old_info, new_info)

marker = "  sheet: { backgroundColor: C.gi, borderTopWidth: 5, borderColor: C.blue, padding: 22, maxHeight: '90%' },\n"
addition = marker + (
    "  infoSheet: { height: '88%', maxHeight: '88%', backgroundColor: C.gi, borderTopWidth: 5, borderColor: C.blue, overflow: 'hidden' },\n"
    "  infoSheetHeader: { minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, borderBottomWidth: 1, borderColor: C.line },\n"
    "  infoSheetEyebrow: { color: C.stamp, fontSize: 9, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },\n"
    "  infoSheetClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },\n"
    "  infoSheetCloseText: { color: C.ink, fontSize: 32, lineHeight: 34, fontFamily: headlineFont, fontWeight: '500' },\n"
    "  infoSheetScrollView: { flex: 1 },\n"
    "  infoSheetScroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 40 },\n"
    "  infoSheetSectionLabel: { color: C.blue, fontSize: 9, fontFamily: labelFont, fontWeight: '900', letterSpacing: 1.2, marginTop: 10, marginBottom: 8 },\n"
)
replace_once("src/styles.ts", marker, addition)

print("Baemilgi visual polish applied")
