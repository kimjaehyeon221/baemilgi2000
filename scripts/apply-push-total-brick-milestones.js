const fs = require('fs');

const path = 'App.tsx';
let s = fs.readFileSync(path, 'utf8');
const original = s;

function ensureReplace(from, to, label) {
  if (s.includes(to)) return;
  if (!s.includes(from)) throw new Error(`Missing anchor: ${label}`);
  s = s.replace(from, to);
}

// Make the core masonry metaphor visible at the exact moment a set crosses a 100-rep boundary.
ensureReplace(
`    setState((current) => ({ ...current, entries: [...current.entries, entry] }));
    animateTotal();
    showToast(\`+\${formatNumber(amount)} RECORDED\`);`,
`    const previousBrickCount = Math.floor(lifetimeTotal / BRICK_REPS);
    const nextBrickCount = Math.floor((lifetimeTotal + entry.amount) / BRICK_REPS);
    const newlyBuiltBricks = Math.max(0, nextBrickCount - previousBrickCount);

    setState((current) => ({ ...current, entries: [...current.entries, entry] }));
    animateTotal();
    if (newlyBuiltBricks === 1) {
      showToast(\`BRICK #\${formatNumber(nextBrickCount)} BUILT · +\${formatNumber(entry.amount)}\`);
    } else if (newlyBuiltBricks > 1) {
      showToast(\`\${formatNumber(newlyBuiltBricks)} BRICKS BUILT · +\${formatNumber(entry.amount)}\`);
    } else {
      showToast(\`+\${formatNumber(entry.amount)} RECORDED\`);
    }`,
  'brick milestone feedback',
);

// The detector currently finishes after four seconds of inactivity; keep the UI promise accurate.
ensureReplace(
  '멈춘 뒤 7초 동안 반복 움직임이 없으면 확인 화면으로 넘어갑니다.',
  '멈춘 뒤 4초 동안 반복 움직임이 없으면 확인 화면으로 넘어갑니다.',
  'idle timeout copy',
);

// Show the unfinished brick on THE WALL so progress is tangible between 100-rep milestones.
ensureReplace(
`          <View style={styles.wallFrame}>
            <BrickWall filledBricks={brickCount} />
          </View>
          {brickCount > 160 && <Text style={styles.wallNote}>최근 160개 벽돌을 표시합니다. 전체 벽돌 수는 위 숫자에 반영되어 있어요.</Text>}`,
`          <View style={styles.wallFrame}>
            <BrickWall filledBricks={brickCount} />
          </View>

          <View style={styles.currentBrickCard}>
            <View style={styles.currentBrickHeader}>
              <Text style={styles.currentBrickLabel}>BRICK {String(brickCount + 1).padStart(3, '0')} · IN PROGRESS</Text>
              <Text style={styles.currentBrickValue}>{brickProgress} / {BRICK_REPS}</Text>
            </View>
            <View style={styles.currentBrickTrack}>
              <View style={[styles.currentBrickFill, { width: \`\${brickProgress}%\` }]} />
            </View>
            <Text style={styles.currentBrickFoot}>{formatNumber(toNextBrick)} PUSHES TO LOCK THE NEXT BRICK</Text>
          </View>

          {brickCount > 160 && <Text style={styles.wallNote}>최근 160개 벽돌을 표시합니다. 전체 벽돌 수는 위 숫자에 반영되어 있어요.</Text>}`,
  'current brick progress card',
);

if (!s.includes('currentBrickCard:')) {
  const styleEnd = s.lastIndexOf('\n});');
  if (styleEnd < 0) throw new Error('Missing StyleSheet terminator');
  const styles = `

  // Current brick / milestone feedback
  currentBrickCard: { marginTop: 12, backgroundColor: INK, borderWidth: 2, borderColor: INK, padding: 14 },
  currentBrickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currentBrickLabel: { color: '#A7A39D', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  currentBrickValue: { color: BG, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  currentBrickTrack: { marginTop: 12, height: 12, backgroundColor: '#34322F', overflow: 'hidden' },
  currentBrickFill: { height: '100%', backgroundColor: BRICK },
  currentBrickFoot: { marginTop: 9, color: BRICK_LIGHT, fontSize: 9, fontWeight: '900', letterSpacing: 1.0 },`;
  s = `${s.slice(0, styleEnd)}${styles}${s.slice(styleEnd)}`;
}

if (s === original) {
  console.log('PUSH TOTAL brick milestone patch already applied.');
  process.exit(0);
}

fs.writeFileSync(path, s);
console.log('Applied PUSH TOTAL brick milestone feedback and wall progress.');
