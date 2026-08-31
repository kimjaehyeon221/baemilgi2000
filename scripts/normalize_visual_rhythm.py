from pathlib import Path
import re

styles_path = Path('src/styles.ts')
workout_path = Path('src/Workout.tsx')
design_path = Path('DESIGN.md')

styles = styles_path.read_text()
workout = workout_path.read_text()

# Mobile composition follows Stitch spacing tokens: seam 16, fold 32, stitch 2.
replacements = {
    "onboarding: { flex: 1, backgroundColor: C.gi, paddingHorizontal: 24, paddingBottom: 20 }":
        "onboarding: { flex: 1, backgroundColor: C.gi, paddingHorizontal: 16, paddingBottom: 16 }",
    "header: { height: 60, paddingHorizontal: 18,":
        "header: { height: 64, paddingHorizontal: 16,",
    "page: { flexGrow: 1, backgroundColor: C.gi, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 104 }":
        "page: { flexGrow: 1, backgroundColor: C.gi, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 104 }",
    "button: { minHeight: 60,":
        "button: { minHeight: 56,",
    "primaryActions: { gap: 12, marginTop: 18, width: '100%' }":
        "primaryActions: { gap: 12, marginTop: 16, width: '100%' }",
    "dojoMeta: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, paddingTop: 6, paddingBottom: 14 }":
        "dojoMeta: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: C.line, paddingTop: 8, paddingBottom: 16 }",
    "dojoHero: { alignItems: 'center', paddingTop: 24, paddingBottom: 18,":
        "dojoHero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24,",
    "questBandStage: { minHeight: 92, justifyContent: 'center', marginTop: 13, marginBottom: 5, position: 'relative' }":
        "questBandStage: { minHeight: 96, justifyContent: 'center', marginTop: 16, marginBottom: 8, position: 'relative' }",
    "archiveFooter: { marginTop: 31, paddingTop: 16, paddingBottom: 16,":
        "archiveFooter: { marginTop: 32, paddingTop: 16, paddingBottom: 16,",
    "archivePanel: { borderTopWidth: 4, borderTopColor: C.blue, paddingTop: 16 }":
        "archivePanel: { borderTopWidth: 4, borderTopColor: C.blue, paddingTop: 16 }",
    "stats: { flexDirection: 'row', marginTop: 7, marginBottom: 28,":
        "stats: { flexDirection: 'row', marginTop: 8, marginBottom: 32,",
    "storageCard: { backgroundColor: C.panelLift, borderLeftWidth: 5, borderColor: C.blue, paddingHorizontal: 15, paddingTop: 14, marginBottom: 28 }":
        "storageCard: { backgroundColor: C.panelLift, borderLeftWidth: 4, borderColor: C.blue, paddingHorizontal: 16, paddingTop: 16, marginBottom: 32 }",
}
for old, new in replacements.items():
    styles = styles.replace(old, new)

# Data objects stay mono; UI actions stay sans; archival pieces stay serif.
styles = styles.replace("questBandActiveText: { fontFamily: bodyFont, color: C.gi, fontSize: 11 }", "questBandActiveText: { fontFamily: labelFont, color: C.gi, fontSize: 11, fontWeight: '900' }")
styles = styles.replace("archiveQuoteText: { color: C.ink, fontFamily: bodyFont,", "archiveQuoteText: { color: C.ink, fontFamily: displayFont,")
styles = styles.replace("storageActionText: { fontFamily: bodyFont,", "storageActionText: { fontFamily: headlineFont,")
styles = styles.replace("historyMain: { fontFamily: bodyFont,", "historyMain: { fontFamily: headlineFont,")

# Make the Quest page hierarchy use the same active/data voices as Home instead of a separate editorial voice.
styles = styles.replace("questHeroLevel: { color: C.gi, fontSize: 25, lineHeight: 29, fontFamily: displayFont,", "questHeroLevel: { color: C.gi, fontSize: 25, lineHeight: 29, fontFamily: headlineFont,")
styles = styles.replace("questSectionLabel: { color: C.ink, fontSize: 14, fontFamily: labelFont,", "questSectionLabel: { color: C.ink, fontSize: 12, fontFamily: headlineFont,")

styles_path.write_text(styles)

# Active screens: same seam/fold rhythm and button heights as the rest of the product.
workout = workout.replace("activePage: { flex: 1, paddingHorizontal: 16, paddingBottom: 18,", "activePage: { flex: 1, paddingHorizontal: 16, paddingBottom: 16,")
workout = workout.replace("logPage: { flex: 1, paddingHorizontal: 16, paddingBottom: 18,", "logPage: { flex: 1, paddingHorizontal: 16, paddingBottom: 16,")
workout = workout.replace("matFrame: { flex: 1, maxHeight: 430, minHeight: 360, marginTop: 24,", "matFrame: { flex: 1, maxHeight: 430, minHeight: 360, marginTop: 32,")
workout = workout.replace("activeHint: { fontFamily: body, color: '#8D9192', fontSize: 11, lineHeight: 17, marginTop: 18,", "activeHint: { fontFamily: body, color: '#8D9192', fontSize: 12, lineHeight: 18, marginTop: 16,")
workout = workout.replace("activeActions: { gap: 10, marginTop: 18 }", "activeActions: { gap: 12, marginTop: 16 }")
workout = workout.replace("completeAction: { minHeight: 58,", "completeAction: { minHeight: 56,")
workout = workout.replace("stopAction: { minHeight: 56,", "stopAction: { minHeight: 56,")
workout = workout.replace("ledger: { flex: 1, marginTop: 18,", "ledger: { flex: 1, marginTop: 16,")
workout = workout.replace("logActions: { gap: 10, marginTop: 14 }", "logActions: { gap: 12, marginTop: 16 }")
workout = workout.replace("trainingBand: { minHeight: 62, marginTop: 18,", "trainingBand: { minHeight: 64, marginTop: 16,")
workout_path.write_text(workout)

design = design_path.read_text()
if '## 10.1 Spacing and stroke lock' not in design:
    anchor = 'Rule: **one dominant number per active screen.**'
    addition = '''\n\n### 10.1 Spacing and stroke lock\n\nThe mobile implementation follows the Stitch rhythm rather than screen-by-screen arbitrary spacing:\n\n- **Seam:** 16pt — default mobile edge and small vertical unit\n- **Fold:** 32pt — major section separation / entry into a focused canvas\n- **Stitch:** 2pt — reinforced active/structural line\n- **Hairline:** 1pt — ledger rules, ordinary separators\n- **Primary action height:** 56pt\n\nPrefer multiples of 8/16/32. Do not introduce one-off 18/22/27/31pt layout gaps unless a visual correction has a specific reason. Home, Quest, Archive, Challenge, Training and onboarding should feel cut from the same gi pattern.\n'''
    design = design.replace(anchor, anchor + addition)
design_path.write_text(design)

print('Normalized BAEMILGI spacing, strokes, and visual rhythm.')
