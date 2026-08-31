from pathlib import Path

workout_path = Path('src/Workout.tsx')
app_path = Path('App.tsx')
qa_path = Path('RELEASE_QA.md')
design_path = Path('DESIGN.md')

workout = workout_path.read_text()

# Result stamp can become an actionable save-retry state without losing the completed attempt.
old_stamp_sig = "function StampFlash({ kind, value }: { kind: 'cleared' | 'recorded'; value: number }) {"
new_stamp_sig = """function StampFlash({
  kind,
  value,
  saveFailed = false,
  onRetry,
}: {
  kind: 'cleared' | 'recorded';
  value: number;
  saveFailed?: boolean;
  onRetry?: () => void;
}) {"""
if old_stamp_sig not in workout:
    raise SystemExit('StampFlash signature not found')
workout = workout.replace(old_stamp_sig, new_stamp_sig)
workout = workout.replace(
    '      pointerEvents="none"\n      accessible',
    '      pointerEvents={saveFailed ? \'auto\' : \'none\'}\n      accessible',
    1,
)
workout = workout.replace(
    "      accessibilityLabel={`${value}개, ${cleared ? '성공 기록' : '중단 기록'} 저장 중`}",
    "      accessibilityLabel={`${value}개, ${cleared ? '성공 기록' : '중단 기록'}${saveFailed ? ', 저장 실패. 다시 저장할 수 있음' : ' 저장 중'}`}",
)
workout = workout.replace(
    "      <Text style={S.flashMeta}>{cleared ? 'TRAINING VERIFIED' : 'ATTEMPT LOGGED'}</Text>\n    </View>",
    """      <Text style={S.flashMeta}>
        {saveFailed ? 'LOCAL SAVE FAILED · RECORD KEPT ON SCREEN' : cleared ? 'TRAINING VERIFIED' : 'ATTEMPT LOGGED'}
      </Text>
      {saveFailed && onRetry ? (
        <Pressable
          accessibilityRole=\"button\"
          accessibilityLabel=\"기록 다시 저장\"
          onPress={onRetry}
          style={({ pressed }) => [S.retrySaveAction, pressed && S.pressed]}
        >
          <Text style={S.retrySaveActionText}>SAVE AGAIN</Text>
        </Pressable>
      ) : null}
    </View>""",
    1,
)

# Challenge callback returns save success. Keep final result in-memory until persistence succeeds.
workout = workout.replace(
    "  onFinish: (success: boolean, seconds: number, actualReps: number) => void;",
    "  onFinish: (success: boolean, seconds: number, actualReps: number) => Promise<boolean> | boolean;",
    1,
)
workout = workout.replace(
    "  const [flashValue, setFlashValue] = useState(target);\n  const runningSinceRef = useRef(Date.now());",
    """  const [flashValue, setFlashValue] = useState(target);
  const [saveFailed, setSaveFailed] = useState(false);
  const runningSinceRef = useRef(Date.now());
  const resultLockedRef = useRef(false);
  const savingRef = useRef(false);
  const pendingResultRef = useRef<{ success: boolean; seconds: number; reps: number } | null>(null);""",
    1,
)

old_finish = """  const finishCleared = () => {
    if (flash) return;
    const finalSeconds = currentElapsedSeconds();
    pauseElapsedClock();
    setFlashValue(target);
    setFlash('cleared');
    Vibration.vibrate(35);
    setTimeout(() => onFinish(true, finalSeconds, target), 950);
  };
"""
new_finish = """  const persistPendingResult = async () => {
    const pending = pendingResultRef.current;
    if (!pending || savingRef.current) return;
    savingRef.current = true;
    setSaveFailed(false);
    const saved = await onFinish(pending.success, pending.seconds, pending.reps);
    if (!saved) {
      savingRef.current = false;
      setSaveFailed(true);
    }
  };

  const finishCleared = () => {
    if (resultLockedRef.current || flash) return;
    resultLockedRef.current = true;
    const finalSeconds = currentElapsedSeconds();
    pauseElapsedClock();
    pendingResultRef.current = { success: true, seconds: finalSeconds, reps: target };
    setFlashValue(target);
    setFlash('cleared');
    Vibration.vibrate(35);
    setTimeout(persistPendingResult, 950);
  };
"""
if old_finish not in workout:
    raise SystemExit('finishCleared block not found')
workout = workout.replace(old_finish, new_finish)

old_save_failure_tail = """    Keyboard.dismiss();
    const finalSeconds = Math.floor(accumulatedMsRef.current / 1000);
    setFlashValue(reps);
    setFlash('recorded');
    Vibration.vibrate(20);
    setTimeout(() => onFinish(false, finalSeconds, reps), 850);
  };

  if (flash) return <StampFlash kind={flash} value={flashValue} />;
"""
new_save_failure_tail = """    if (resultLockedRef.current) return;
    resultLockedRef.current = true;
    Keyboard.dismiss();
    const finalSeconds = Math.floor(accumulatedMsRef.current / 1000);
    pendingResultRef.current = { success: false, seconds: finalSeconds, reps };
    setFlashValue(reps);
    setFlash('recorded');
    Vibration.vibrate(20);
    setTimeout(persistPendingResult, 850);
  };

  if (flash) {
    return (
      <StampFlash
        kind={flash}
        value={flashValue}
        saveFailed={saveFailed}
        onRetry={persistPendingResult}
      />
    );
  }
"""
if old_save_failure_tail not in workout:
    raise SystemExit('saveFailure tail not found')
workout = workout.replace(old_save_failure_tail, new_save_failure_tail)

# Training save callback also reports success and the main action is protected against double taps.
workout = workout.replace(
    "  onFinish: (seconds: number) => void;",
    "  onFinish: (seconds: number) => Promise<boolean> | boolean;",
    1,
)
workout = workout.replace(
    "  const restDeadlineRef = useRef<number | null>(null);",
    "  const restDeadlineRef = useRef<number | null>(null);\n  const actionLockedRef = useRef(false);",
    1,
)
old_finish_set = """  const finishSet = () => {
    if (setNumber >= plan.sets) onFinish(currentSessionSeconds());
    else {
      setSetNumber((v) => v + 1);
      beginRest();
    }
  };
"""
new_finish_set = """  const releaseActionLock = () => {
    setTimeout(() => {
      actionLockedRef.current = false;
    }, 350);
  };

  const handleTrainingAction = async () => {
    if (actionLockedRef.current) return;
    actionLockedRef.current = true;

    if (rest) {
      skipRest();
      releaseActionLock();
      return;
    }

    if (setNumber >= plan.sets) {
      const saved = await onFinish(currentSessionSeconds());
      if (!saved) actionLockedRef.current = false;
      return;
    }

    setSetNumber((v) => v + 1);
    beginRest();
    releaseActionLock();
  };
"""
if old_finish_set not in workout:
    raise SystemExit('finishSet block not found')
workout = workout.replace(old_finish_set, new_finish_set)
workout = workout.replace(
    "onPress={() => (rest ? skipRest() : finishSet())}",
    "onPress={handleTrainingAction}",
    1,
)

# Retry button styles.
workout = workout.replace(
    "  flashMeta: { color: '#686A68', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: 24 },",
    """  flashMeta: { color: '#686A68', fontFamily: mono, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: 24, textAlign: 'center' },
  retrySaveAction: { minWidth: 220, minHeight: 56, marginTop: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#121212', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  retrySaveActionText: { color: '#121212', fontFamily: headline, fontSize: 13, fontWeight: '900', letterSpacing: 1.1 },""",
    1,
)
workout_path.write_text(workout)

# App only exits the active flow after persistence succeeds and returns the success boolean to the child.
app = app_path.read_text()
old_challenge_save = """          const saved = await commit(next);
          setChallengeLevel(null);
          if (!saved) return;
          if (success && clearedLevel >= 200) setMessage('2,000. 마지막 퀘스트를 완료했어.');
          else if (success && targetForLevel(old || 1) < 500 && targetForLevel(clearedLevel || 1) >= 500) {
            setMessage('500개를 넘었어. 최종 목표는 2,000개야.');
          } else {
            setMessage(null);
          }
"""
new_challenge_save = """          const saved = await commit(next);
          if (!saved) return false;
          setChallengeLevel(null);
          if (success && clearedLevel >= 200) setMessage('2,000. 마지막 퀘스트를 완료했어.');
          else if (success && targetForLevel(old || 1) < 500 && targetForLevel(clearedLevel || 1) >= 500) {
            setMessage('500개를 넘었어. 최종 목표는 2,000개야.');
          } else {
            setMessage(null);
          }
          return true;
"""
if old_challenge_save not in app:
    raise SystemExit('App challenge save block not found')
app = app.replace(old_challenge_save, new_challenge_save)

old_training_save = """          setTrainingLevel(null);
          if (saved) setMessage('훈련을 기록했어. 준비됐을 때 다음 퀘스트에 도전해.');
"""
new_training_save = """          if (!saved) return false;
          setTrainingLevel(null);
          setMessage('훈련을 기록했어. 준비됐을 때 다음 퀘스트에 도전해.');
          return true;
"""
if old_training_save not in app:
    raise SystemExit('App training save block not found')
app = app.replace(old_training_save, new_training_save)
app_path.write_text(app)

qa = qa_path.read_text()
for item in [
    '- [ ] Rapid double-taps on COMPLETE / COMPLETE SET cannot create duplicate records or skip sets.',
    '- [ ] A local save failure keeps the completed Challenge result on screen and offers SAVE AGAIN.',
    '- [ ] A local save failure on final Training set keeps the user on the final set so completion can be retried.',
]:
    if item not in qa:
        qa = qa.replace('## P0 — Block release if any fail\n', '## P0 — Block release if any fail\n\n' + item + '\n', 1)
qa_path.write_text(qa)

design = design_path.read_text()
if '### Persistence is part of the workout flow' not in design:
    design += """

### Persistence is part of the workout flow

A completed physical effort is not considered finished in the UI until its local record is safely persisted. Challenge keeps the stamped result in memory and exposes `SAVE AGAIN` if local storage fails. Training stays on the final set if its completion record fails. Rapid taps are guarded so a physical double-tap cannot create duplicate attempts, skip sets, or immediately skip a newly-entered rest state.
"""
design_path.write_text(design)

print('Hardened BAEMILGI save retries and rapid-tap behavior.')
