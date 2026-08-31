from pathlib import Path

core_path = Path('src/core.ts')
workout_path = Path('src/Workout.tsx')
app_path = Path('App.tsx')
qa_path = Path('RELEASE_QA.md')
design_path = Path('DESIGN.md')

core = core_path.read_text()
core = core.replace(
    """  seconds: number;
  actualReps?: number;
};""",
    """  seconds: number;
  actualReps?: number;
  trainingSets?: number;
  trainingRepsPerSet?: number;
  trainingRestSeconds?: number;
};""",
)
core = core.replace(
    """export function trainingPlan(currentBest: number, target: number) {
  const base = Math.max(1, currentBest || Math.min(target, 10));""",
    """export function trainingPlan(currentBest: number, target: number) {
  // Reopening an easier completed quest for training must not inherit a much higher global best.
  const candidate = currentBest > 0 ? currentBest : Math.min(target, 10);
  const base = Math.max(1, Math.min(candidate, target));""",
)
old_safe_return = """  return { at, type, level, target, success, seconds, actualReps };
}"""
new_safe_return = """  const trainingSets = type === 'training' && Number.isFinite(Number(raw?.trainingSets))
    ? Math.max(1, Math.min(20, Math.floor(Number(raw.trainingSets))))
    : undefined;
  const trainingRepsPerSet = type === 'training' && Number.isFinite(Number(raw?.trainingRepsPerSet))
    ? Math.max(1, Math.min(2000, Math.floor(Number(raw.trainingRepsPerSet))))
    : undefined;
  const trainingRestSeconds = type === 'training' && Number.isFinite(Number(raw?.trainingRestSeconds))
    ? Math.max(0, Math.min(3600, Math.floor(Number(raw.trainingRestSeconds))))
    : undefined;
  return {
    at,
    type,
    level,
    target,
    success,
    seconds,
    actualReps,
    trainingSets,
    trainingRepsPerSet,
    trainingRestSeconds,
  };
}"""
if old_safe_return not in core:
    raise SystemExit('safeSession return block not found')
core = core.replace(old_safe_return, new_safe_return)
core_path.write_text(core)

workout = workout_path.read_text()
workout = workout.replace(
    "  onFinish: (seconds: number) => Promise<boolean> | boolean;",
    "  onFinish: (seconds: number, plan: { sets: number; reps: number; rest: number }) => Promise<boolean> | boolean;",
    1,
)
workout = workout.replace(
    "const saved = await onFinish(currentSessionSeconds());",
    "const saved = await onFinish(currentSessionSeconds(), plan);",
    1,
)
workout_path.write_text(workout)

app = app_path.read_text()
app = app.replace(
    "        onFinish={async (seconds) => {",
    "        onFinish={async (seconds, plan) => {",
    1,
)
app = app.replace(
    """                success: true,
                seconds,
              },""",
    """                success: true,
                seconds,
                trainingSets: plan.sets,
                trainingRepsPerSet: plan.reps,
                trainingRestSeconds: plan.rest,
              },""",
    1,
)
old_archive_map = """              history.map(({ session, index }) => {
                const stopped = session.type === 'challenge' && !session.success;
                const reps = stopped ? (session.actualReps ?? 0) : session.target;
                return (
                  <Pressable
                    key={`${session.at}-${index}`}
                    style={styles.archiveEntry}
                    onPress={() => editSession(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`${session.type === 'training' ? '훈련' : '퀘스트'} 레벨 ${session.level}, ${reps}개, ${session.type === 'training' ? '훈련 완료' : stopped ? '중단 기록' : '성공 기록'}`}
                    accessibilityHint="두 번 탭하여 기록을 편집합니다"
                  >"""
new_archive_map = """              history.map(({ session, index }) => {
                const training = session.type === 'training';
                const stopped = session.type === 'challenge' && !session.success;
                const reps = stopped ? (session.actualReps ?? 0) : session.target;
                const trainingSummary = training && session.trainingSets && session.trainingRepsPerSet
                  ? `${session.trainingSets}×${session.trainingRepsPerSet}`
                  : '—';
                const accessiblePerformance = training
                  ? session.trainingSets && session.trainingRepsPerSet
                    ? `${session.trainingSets}세트, 세트당 ${session.trainingRepsPerSet}개`
                    : '이전 버전 훈련 기록, 세트 상세 없음'
                  : `${reps}개`;
                return (
                  <Pressable
                    key={`${session.at}-${index}`}
                    style={styles.archiveEntry}
                    onPress={() => editSession(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`${training ? '훈련' : '퀘스트'} 레벨 ${session.level}, ${accessiblePerformance}, ${training ? '훈련 완료' : stopped ? '중단 기록' : '성공 기록'}`}
                    accessibilityHint="두 번 탭하여 기록을 편집합니다"
                  >"""
if old_archive_map not in app:
    raise SystemExit('archive map block not found')
app = app.replace(old_archive_map, new_archive_map)
app = app.replace(
    "<Text style={[styles.archiveReps, styles.archiveRepsCol]}>{reps}</Text>",
    "<Text style={[styles.archiveReps, styles.archiveRepsCol]}>{training ? trainingSummary : reps}</Text>",
    1,
)
app_path.write_text(app)

qa = qa_path.read_text()
for item in [
    '- [ ] New Training archive rows show the actual set structure (for example 4×42), not the quest target.',
    '- [ ] Old Training records without set metadata render a neutral dash instead of inventing a training volume.',
    '- [ ] Reopening an easier completed quest for Training caps the plan base at that quest target.',
]:
    if item not in qa:
        qa = qa.replace('## P0 — Block release if any fail\n', '## P0 — Block release if any fail\n\n' + item + '\n', 1)
qa_path.write_text(qa)

design = design_path.read_text()
if '### Training records describe the training' not in design:
    design += """

### Training records describe the training

Archive data must describe what the user actually did. A Training row stores and renders its prescribed `sets × repsPerSet` and rest duration; the quest target remains a level reference, not a false claim about performed reps. Legacy training rows created before this metadata existed show a neutral dash for volume rather than fabricating data. Reopening a lower completed quest also caps the training plan at that quest target so an advanced global best cannot create nonsensical volume for an easier drill.
"""
design_path.write_text(design)

print('Fixed BAEMILGI training-plan and archive record fidelity.')
