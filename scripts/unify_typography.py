from pathlib import Path
import re

# Apply the Stitch typography roles consistently across every native screen.
styles_path = Path('src/styles.ts')
workout_path = Path('src/Workout.tsx')
design_path = Path('DESIGN.md')
typography_path = Path('src/typography.ts')

FONT_FILE = '''export const FONT = {\n  // Native iOS analogues for the Stitch typography roles.\n  // Stitch: Anton / Hanken Grotesk / JetBrains Mono / Source Serif 4.\n  display: 'Avenir Next Condensed',\n  headline: 'Avenir Next',\n  body: 'Avenir Next',\n  data: 'Menlo',\n  archival: 'Georgia',\n} as const;\n'''

typography_path.write_text(FONT_FILE)

styles = styles_path.read_text()
if "import { FONT } from './typography';" not in styles:
    styles = styles.replace("import { StyleSheet } from 'react-native';\n", "import { StyleSheet } from 'react-native';\nimport { FONT } from './typography';\n")
styles = re.sub(
    r"const labelFont = '.*?';\nconst displayFont = '.*?';\nconst metricFont = '.*?';",
    "const labelFont = FONT.data;\nconst displayFont = FONT.archival;\nconst metricFont = FONT.display;\nconst bodyFont = FONT.body;\nconst headlineFont = FONT.headline;",
    styles,
)

lines = styles.splitlines()
for i, line in enumerate(lines):
    if 'fontSize:' in line and 'fontFamily:' not in line and re.match(r'^\s{2}[A-Za-z0-9_]+: \{', line):
        lines[i] = line.replace('{ ', '{ fontFamily: bodyFont, ', 1)
styles = '\n'.join(lines) + ('\n' if styles.endswith('\n') else '')

def force_family(text, style_name, family):
    pattern = rf"(  {re.escape(style_name)}: \{{[^\n]*?)fontFamily: [A-Za-z]+Font"
    return re.sub(pattern, rf"\1fontFamily: {family}", text)

for name in [
    'introTitle', 'bigInput', 'recommendInput', 'heroNumber', 'currentValue', 'currentLevel',
    'questHeroTarget', 'milestoneTitle', 'statValue', 'historyTarget', 'dojoHeroNumber',
    'dojoCurrentBestValue', 'archiveReps',
]:
    styles = force_family(styles, name, 'metricFont')

for name in ['question', 'pageTitle', 'questHeroLevel', 'brand', 'archiveTitle', 'archiveEmptyTitle', 'messageText']:
    styles = force_family(styles, name, 'displayFont')

for name in ['buttonText', 'choiceTitle', 'formTitle', 'sectionTitle', 'linkText', 'archiveFooterLabel']:
    styles = force_family(styles, name, 'headlineFont')

for name in [
    'introCopy', 'introMeta', 'introSub', 'copy', 'choiceBody', 'formBody', 'note', 'inputHint',
    'recommendCopy', 'storageInlineText', 'heroUnit', 'currentUnit', 'sectionBody', 'pageCopy',
    'questHeroCopy', 'storageTitle', 'storageCopy', 'archiveEmptyCopy', 'archiveQuoteText',
]:
    styles = force_family(styles, name, 'bodyFont')

styles = styles.replace('buttonText: { color: C.gi, fontSize: 15, fontFamily: metricFont,', 'buttonText: { color: C.gi, fontSize: 15, fontFamily: headlineFont,')
styles = styles.replace('introTitle: { color: C.ink, fontSize: 86, lineHeight: 91, fontFamily: displayFont,', 'introTitle: { color: C.ink, fontSize: 86, lineHeight: 86, fontFamily: metricFont,')
styles_path.write_text(styles)

workout = workout_path.read_text()
if "import { FONT } from './typography';" not in workout:
    workout = workout.replace("import { C } from './styles';\n", "import { C } from './styles';\nimport { FONT } from './typography';\n")
workout = re.sub(
    r"const mono = '.*?';\nconst serif = '.*?';\nconst metric = '.*?';",
    "const mono = FONT.data;\nconst serif = FONT.archival;\nconst metric = FONT.display;\nconst body = FONT.body;\nconst headline = FONT.headline;",
    workout,
)

lines = workout.splitlines()
for i, line in enumerate(lines):
    if 'fontSize:' in line and 'fontFamily:' not in line and re.match(r'^\s{2}[A-Za-z0-9_]+: \{', line):
        lines[i] = line.replace('{ ', '{ fontFamily: body, ', 1)
workout = '\n'.join(lines) + ('\n' if workout.endswith('\n') else '')

def force_workout_family(text, style_name, family):
    pattern = rf"(  {re.escape(style_name)}: \{{[^\n]*?)fontFamily: (?:body|mono|serif|metric|headline)"
    return re.sub(pattern, rf"\1fontFamily: {family}", text)

for name in ['target', 'trainingNumber', 'flashValue', 'stopInput', 'ledgerValue']:
    workout = force_workout_family(workout, name, 'metric')
for name in ['code', 'targetLabel', 'elapsed', 'ledgerCode', 'ledgerLabel', 'trainingBandLabel', 'trainingUnit', 'trainingSession', 'flashMeta']:
    workout = force_workout_family(workout, name, 'mono')
for name in ['ledgerTitle', 'ledgerPrompt', 'stampText']:
    workout = force_workout_family(workout, name, 'serif')
for name in ['completeActionText', 'stopActionText', 'stitchedActionText', 'returnActionText']:
    workout = force_workout_family(workout, name, 'headline')
workout_path.write_text(workout)

design = design_path.read_text()
old = '''## 10. Typography and hierarchy\n\nThe design direction may draw from the Stitch handoff using:\n\n- large condensed/display numerals for active metrics\n- clean grotesk/sans for primary UI\n- monospaced/data typography for quest codes and metadata\n- restrained serif usage for archive/history moments\n\nIn React Native implementation, exact web fonts are optional if they create unnecessary native complexity. Preserve hierarchy and character first.\n\nRule: **one dominant number per active screen.**'''
new = '''## 10. Typography and hierarchy\n\nThe Stitch master uses four deliberate roles, and the app must preserve those roles consistently across every screen:\n\n- **Display metric** — Stitch `Anton` → iOS QA build `Avenir Next Condensed`: hero targets, reps, timers when dominant, large numeric inputs.\n- **UI / action** — Stitch `Hanken Grotesk` → iOS QA build `Avenir Next`: body copy, buttons, navigation, ordinary interface headings.\n- **Data / metadata** — Stitch `JetBrains Mono` → iOS QA build `Menlo`: QUEST codes, dates, labels, statuses, set counters, archive columns.\n- **Archival** — Stitch `Source Serif 4` → iOS QA build `Georgia`: training-log titles, recorded-result headlines, restrained editorial moments.\n\nDo not introduce an unassigned system/default font inside designed screens. A text element must belong to one of these four roles. Do not use the condensed display face for buttons or body copy, and do not use the archival serif for active workout metrics.\n\nRule: **one dominant number per active screen.**'''
if old in design:
    design = design.replace(old, new)
elif '## 10. Typography and hierarchy' in design and 'Avenir Next Condensed' not in design:
    design += '\n\n### Native typography lock\n\nAvenir Next Condensed = metric; Avenir Next = UI/body; Menlo = data; Georgia = archival.\n'
design_path.write_text(design)

print('Unified BAEMILGI typography roles.')
