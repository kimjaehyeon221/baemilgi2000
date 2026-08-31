from pathlib import Path


def required(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'{label} not found')
    return text.replace(old, new)


workout = Path('src/Workout.tsx')
s = workout.read_text()
s = required(s, "  Alert,\n  Animated,", "  AccessibilityInfo,\n  Alert,\n  Animated,", 'AccessibilityInfo import')
old_effect = """  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pulse, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 210,
      mass: 0.7,
    }).start();
  }, [pulse]);"""
new_effect = """  const pulse = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    pulse.stopAnimation();
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    pulse.setValue(0);
    Animated.spring(pulse, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 210,
      mass: 0.7,
    }).start();
  }, [pulse, reduceMotion]);"""
s = required(s, old_effect, new_effect, 'stamp animation')
s = required(s, '<Text style={S.flashValue}>{value}</Text>', '<Text style={S.flashValue} maxFontSizeMultiplier={1.15}>{value}</Text>', 'flash metric cap')
s = required(s, '<Text style={S.target}>{target}</Text>', '<Text style={S.target} maxFontSizeMultiplier={1.15}>{target}</Text>', 'challenge target cap')
s = required(s, '<Text style={S.elapsed}>{formatSeconds(seconds)}  ELAPSED</Text>', '<Text style={S.elapsed} maxFontSizeMultiplier={1.3}>{formatSeconds(seconds)}  ELAPSED</Text>', 'challenge timer cap')
s = required(s, '<Text style={S.trainingNumber}>{rest ? formatSeconds(restLeft) : plan.reps}</Text>', '<Text style={S.trainingNumber} maxFontSizeMultiplier={1.15}>{rest ? formatSeconds(restLeft) : plan.reps}</Text>', 'training metric cap')
s = required(s, '<Text style={S.trainingSession}>{formatSeconds(seconds)}  SESSION</Text>', '<Text style={S.trainingSession} maxFontSizeMultiplier={1.3}>{formatSeconds(seconds)}  SESSION</Text>', 'training timer cap')
workout.write_text(s)

app = Path('App.tsx')
s = app.read_text()
s = required(s, '<Text style={styles.dojoHeroNumber}>{nextTarget}</Text>', '<Text style={styles.dojoHeroNumber} maxFontSizeMultiplier={1.15}>{nextTarget}</Text>', 'home hero cap')
s = required(s, '<Text style={styles.questHeroTarget}>{nextTarget}<Text style={styles.questHeroUnit}>개</Text></Text>', '<Text style={styles.questHeroTarget} maxFontSizeMultiplier={1.2}>{nextTarget}<Text style={styles.questHeroUnit}>개</Text></Text>', 'quest hero cap')
app.write_text(s)

onboarding = Path('src/Onboarding.tsx')
s = onboarding.read_text()
s = required(s, '<Text style={styles.introTitle}>2,000</Text>', '<Text style={styles.introTitle} maxFontSizeMultiplier={1.15}>2,000</Text>', 'intro metric cap')
s = s.replace('style={styles.bigInput}\n              maxLength={4}', 'style={styles.bigInput}\n              maxFontSizeMultiplier={1.2}\n              maxLength={4}')
s = s.replace('style={styles.recommendInput}\n            maxLength={4}', 'style={styles.recommendInput}\n            maxFontSizeMultiplier={1.2}\n            maxLength={4}')
onboarding.write_text(s)
