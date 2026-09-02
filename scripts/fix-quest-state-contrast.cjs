const fs = require('fs');

function replaceOnce(file, before, after, label) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${label} anchor not found`);
  fs.writeFileSync(file, current.replace(before, after));
}

replaceOnce(
  'App.tsx',
  `              const reps = targetForLevel(level);\n              const inverse = done || selected;\n              return (\n`,
  `              const reps = targetForLevel(level);\n              const upcoming = !done && !selected;\n              return (\n`,
  'quest state declaration',
);

replaceOnce(
  'App.tsx',
  `                  style={[\n                    styles.cell,\n                    done && styles.cellDone,\n                    selected && styles.cellSelected,\n                    selected && {\n                      backgroundColor: currentChapter.color,\n                      borderColor: currentChapter.id === 'white' ? C.line : currentChapter.color,\n                    },\n                  ]}\n                >\n                  {done ? (\n                    <View style={styles.cellStamp} pointerEvents="none">\n                      <Text style={styles.cellStampText}>CLEAR</Text>\n                    </View>\n                  ) : null}\n                  <Text style={[\n                    styles.cellLevel,\n                    inverse && styles.cellTextInverse,\n                    selected && { color: currentChapter.textColor },\n                  ]}>{done ? '완료' : \`L\${level}\`}</Text>\n                  <Text style={[\n                    styles.cellReps,\n                    inverse && styles.cellTextInverse,\n                    selected && { color: currentChapter.textColor },\n                  ]}>{reps}개</Text>\n`,
  `                  style={[\n                    styles.cell,\n                    upcoming && styles.cellUpcoming,\n                    done && styles.cellDone,\n                    selected && styles.cellSelected,\n                  ]}\n                >\n                  {done ? (\n                    <View style={styles.cellStamp} pointerEvents="none">\n                      <Text style={styles.cellStampText}>CLEAR</Text>\n                    </View>\n                  ) : null}\n                  {selected ? (\n                    <View style={styles.cellCurrentBadge} pointerEvents="none">\n                      <Text style={styles.cellCurrentBadgeText}>CURRENT</Text>\n                    </View>\n                  ) : null}\n                  <Text style={[\n                    styles.cellLevel,\n                    done && styles.cellTextDone,\n                    selected && styles.cellTextCurrent,\n                    upcoming && styles.cellTextUpcoming,\n                  ]}>{done ? '완료' : \`L\${level}\`}</Text>\n                  <Text style={[\n                    styles.cellReps,\n                    done && styles.cellTextDone,\n                    selected && styles.cellTextCurrent,\n                    upcoming && styles.cellTextUpcoming,\n                  ]}>{reps}개</Text>\n`,
  'quest cell rendering',
);

replaceOnce(
  'src/styles.ts',
  `  cell: { width: '23%', minHeight: 64, borderWidth: 0, backgroundColor: C.panelLift, paddingVertical: 9, paddingHorizontal: 8, justifyContent: 'space-between', position: 'relative', overflow: 'hidden' },\n  cellDone: { backgroundColor: '#FFF8F6', borderWidth: 1, borderColor: '#D8A6A6' },\n  cellStamp: { position: 'absolute', right: -5, top: 8, borderWidth: 2, borderColor: C.stamp, paddingHorizontal: 5, paddingVertical: 2, transform: [{ rotate: '-8deg' }], opacity: 0.92 },\n  cellStampText: { color: C.stamp, fontFamily: displayFont, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },\n  cellSelected: { borderWidth: 1 },\n  cellLevel: { color: C.ink, fontSize: 11, fontFamily: labelFont, fontWeight: '900' },\n  cellReps: { color: C.muted, fontSize: 10, lineHeight: 14, fontFamily: labelFont, fontWeight: '800' },\n  cellTextInverse: { color: C.ink },\n`,
  `  cell: { width: '23%', minHeight: 66, borderWidth: 1, borderColor: '#D9D3C8', backgroundColor: '#ECE8E0', paddingVertical: 9, paddingHorizontal: 8, justifyContent: 'space-between', position: 'relative', overflow: 'hidden' },\n  cellUpcoming: { backgroundColor: '#ECE8E0', borderColor: '#D9D3C8' },\n  cellDone: { backgroundColor: '#FFF8F6', borderWidth: 1, borderColor: '#D8A6A6' },\n  cellStamp: { position: 'absolute', right: -5, top: 8, borderWidth: 2, borderColor: C.stamp, paddingHorizontal: 5, paddingVertical: 2, transform: [{ rotate: '-8deg' }], opacity: 0.92 },\n  cellStampText: { color: C.stamp, fontFamily: displayFont, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },\n  cellSelected: { minHeight: 70, backgroundColor: C.blue, borderWidth: 2, borderColor: '#0D223F' },\n  cellCurrentBadge: { position: 'absolute', right: 6, top: 6, backgroundColor: C.gi, paddingHorizontal: 4, paddingVertical: 2 },\n  cellCurrentBadgeText: { color: C.blue, fontFamily: labelFont, fontSize: 6, fontWeight: '900', letterSpacing: 0.45 },\n  cellLevel: { color: C.ink, fontSize: 11, fontFamily: labelFont, fontWeight: '900' },\n  cellReps: { color: C.muted, fontSize: 10, lineHeight: 14, fontFamily: labelFont, fontWeight: '800' },\n  cellTextDone: { color: C.ink },\n  cellTextCurrent: { color: C.gi },\n  cellTextUpcoming: { color: '#7F7A70' },\n  cellTextInverse: { color: C.ink },\n`,
  'quest cell styles',
);

console.log('Quest state contrast patch applied.');
