from pathlib import Path
import re

path = Path('src/Workout.tsx')
text = path.read_text()

# ---------- Challenge: elapsed time derived from wall clock, with an intentional pause while editing STOP HERE ----------
old_state = """  const [seconds, setSeconds] = useState(0);
  const [recordFailure, setRecordFailure] = useState(false);
  const [failedReps, setFailedReps] = useState('');
  const [flash, setFlash] = useState<'cleared' | 'recorded' | null>(null);
  const [flashValue, setFlashValue] = useState(target);

  useEffect(() => {
    if (recordFailure || flash) return;
    const id = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [recordFailure, flash]);

  const finishCleared = () => {
    if (flash) return;
    setFlashValue(target);
    setFlash('cleared');
    Vibration.vibrate(35);
    setTimeout(() => onFinish(true, seconds, target), 950);
  };
"""
new_state = """  const [seconds, setSeconds] = useState(0);
  const [recordFailure, setRecordFailure] = useState(false);
  const [failedReps, setFailedReps] = useState('');
  const [flash, setFlash] = useState<'cleared' | 'recorded' | null>(null);
  const [flashValue, setFlashValue] = useState(target);
  const runningSinceRef = useRef(Date.now());
  const accumulatedMsRef = useRef(0);

  const currentElapsedSeconds = () => Math.max(
    0,
    Math.floor((accumulatedMsRef.current + (Date.now() - runningSinceRef.current)) / 1000),
  );

  const pauseElapsedClock = () => {
    accumulatedMsRef.current += Math.max(0, Date.now() - runningSinceRef.current);
    setSeconds(Math.floor(accumulatedMsRef.current / 1000));
  };

  const resumeElapsedClock = () => {
    runningSinceRef.current = Date.now();
  };

  useEffect(() => {
    if (recordFailure || flash) return;
    const sync = () => setSeconds(currentElapsedSeconds());
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, [recordFailure, flash]);

  const finishCleared = () => {
    if (flash) return;
    const finalSeconds = currentElapsedSeconds();
    pauseElapsedClock();
    setFlashValue(target);
    setFlash('cleared');
    Vibration.vibrate(35);
    setTimeout(() => onFinish(true, finalSeconds, target), 950);
  };
"""
if old_state not in text:
    raise SystemExit('Challenge timer state block not found')
text = text.replace(old_state, new_state)

# STOP flow should use frozen wall-clock elapsed.
text = text.replace(
    """    Keyboard.dismiss();
    setFlashValue(reps);
    setFlash('recorded');
    Vibration.vibrate(20);
    setTimeout(() => onFinish(false, seconds, reps), 850);""",
    """    Keyboard.dismiss();
    const finalSeconds = Math.floor(accumulatedMsRef.current / 1000);
    setFlashValue(reps);
    setFlash('recorded');
    Vibration.vibrate(20);
    setTimeout(() => onFinish(false, finalSeconds, reps), 850);""",
)

# Return from STOP editor resumes from the frozen elapsed time, excluding editing time.
text = text.replace(
    "<FocusHeader code={`QUEST / ${String(level).padStart(3, '0')}`} onClose={() => setRecordFailure(false)} light />",
    "<FocusHeader code={`QUEST / ${String(level).padStart(3, '0')}`} onClose={() => { resumeElapsedClock(); setRecordFailure(false); }} light />",
)
text = text.replace(
    "<Pressable style={({ pressed }) => [S.returnAction, pressed && S.pressed]} onPress={() => setRecordFailure(false)}>",
    "<Pressable style={({ pressed }) => [S.returnAction, pressed && S.pressed]} onPress={() => { resumeElapsedClock(); setRecordFailure(false); }}>",
)

# Entering STOP editor freezes time immediately rather than on the last interval tick.
text = text.replace(
    """          <Pressable accessibilityRole=\"button\" accessibilityLabel=\"여기까지 기록\" style={({ pressed }) => [S.stopAction, pressed && S.pressed]} onPress={() => setRecordFailure(true)}>
            <Text style={S.stopActionText}>STOP HERE</Text>
          </Pressable>""",
    """          <Pressable
            accessibilityRole=\"button\"
            accessibilityLabel=\"여기까지 기록\"
            style={({ pressed }) => [S.stopAction, pressed && S.pressed]}
            onPress={() => { pauseElapsedClock(); setRecordFailure(true); }}
          >
            <Text style={S.stopActionText}>STOP HERE</Text>
          </Pressable>""",
)

# ---------- Training: total session and rest are wall-clock based ----------
old_training_state = """  const [setNumber, setSetNumber] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [rest, setRest] = useState(false);
  const [restLeft, setRestLeft] = useState(plan.rest);

  useEffect(() => {
    const id = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!rest) return;
    if (restLeft <= 0) {
      setRest(false);
      setRestLeft(plan.rest);
      return;
    }
    const id = setTimeout(() => setRestLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [rest, restLeft, plan.rest]);

  const finishSet = () => {
    if (setNumber >= plan.sets) onFinish(seconds);
    else {
      setSetNumber((v) => v + 1);
      setRest(true);
    }
  };
"""
new_training_state = """  const [setNumber, setSetNumber] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [rest, setRest] = useState(false);
  const [restLeft, setRestLeft] = useState(plan.rest);
  const sessionStartedAtRef = useRef(Date.now());
  const restDeadlineRef = useRef<number | null>(null);

  const currentSessionSeconds = () => Math.max(0, Math.floor((Date.now() - sessionStartedAtRef.current) / 1000));

  useEffect(() => {
    const sync = () => setSeconds(currentSessionSeconds());
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!rest) return;
    const syncRest = () => {
      const deadline = restDeadlineRef.current;
      if (!deadline) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRestLeft(remaining);
      if (remaining <= 0) {
        restDeadlineRef.current = null;
        setRest(false);
        setRestLeft(plan.rest);
      }
    };
    syncRest();
    const id = setInterval(syncRest, 250);
    return () => clearInterval(id);
  }, [rest, plan.rest]);

  const beginRest = () => {
    restDeadlineRef.current = Date.now() + plan.rest * 1000;
    setRestLeft(plan.rest);
    setRest(true);
  };

  const skipRest = () => {
    restDeadlineRef.current = null;
    setRest(false);
    setRestLeft(plan.rest);
  };

  const finishSet = () => {
    if (setNumber >= plan.sets) onFinish(currentSessionSeconds());
    else {
      setSetNumber((v) => v + 1);
      beginRest();
    }
  };
"""
if old_training_state not in text:
    raise SystemExit('Training timer state block not found')
text = text.replace(old_training_state, new_training_state)

text = text.replace(
    "onPress={() => (rest ? (setRest(false), setRestLeft(plan.rest)) : finishSet())}",
    "onPress={() => (rest ? skipRest() : finishSet())}",
)

path.write_text(text)

# Document the behavioral contract.
design = Path('DESIGN.md')
design_text = design.read_text()
if '### Interruption-safe timers' not in design_text:
    design_text += """

### Interruption-safe timers

Challenge elapsed time, Training elapsed time, and rest countdowns are derived from wall-clock timestamps rather than assuming JavaScript executes once per second. If iOS suspends the app during an incoming call, lock screen, app switch, or background interval, the next foreground tick reconciles to real elapsed time. The STOP HERE edit sheet intentionally pauses challenge elapsed time; returning to the quest resumes from that frozen value.
"""
design.write_text(design_text)

qa = Path('RELEASE_QA.md')
qa_text = qa.read_text()
if '- [ ] Backgrounding for 10–30 seconds reconciles elapsed/rest time from wall clock.' not in qa_text:
    qa_text = qa_text.replace(
        '- [ ] No OTA-triggered reload occurs while a challenge/training session is active.\n',
        '- [ ] No OTA-triggered reload occurs while a challenge/training session is active.\n- [ ] Backgrounding for 10–30 seconds reconciles elapsed/rest time from wall clock.\n- [ ] STOP HERE freezes challenge elapsed while entering the stopped-at count, and RETURN resumes it.\n',
    )
qa.write_text(qa_text)

print('Hardened BAEMILGI timers against iOS interruption/background suspension.')
