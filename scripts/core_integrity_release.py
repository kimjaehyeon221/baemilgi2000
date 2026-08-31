from pathlib import Path

p = Path('src/core.ts')
s = p.read_text()

old_level = """export function levelForReps(reps: number) {
  let best = 1;
  for (let l = 1; l <= 200; l++) {
    if (TARGETS[l] <= reps) best = l;
    else break;
  }
  return best;
}"""
new_level = """export function levelForReps(reps: number) {
  let best = 0;
  for (let l = 1; l <= 200; l++) {
    if (TARGETS[l] <= reps) best = l;
    else break;
  }
  return best;
}"""
if old_level not in s:
    raise SystemExit('levelForReps block not found')
s = s.replace(old_level, new_level)

old_plan = """export function trainingPlan(currentBest: number, target: number) {
  // Reopening an easier completed quest for training must not inherit a much higher global best.
  const candidate = currentBest > 0 ? currentBest : Math.min(target, 10);
  const base = Math.max(1, Math.min(candidate, target));
  if (base <= 10) return { sets: 3, reps: Math.max(2, Math.ceil(base * .6)), rest: 90 };
  if (base <= 50) return { sets: 4, reps: Math.max(5, Math.ceil(base * .45)), rest: 90 };
  if (base <= 100) return { sets: 4, reps: Math.ceil(base * .4), rest: 90 };
  if (base <= 500) return { sets: 4, reps: Math.ceil(base * .3), rest: 90 };
  return { sets: 4, reps: Math.ceil(base * .22), rest: 90 };
}"""
new_plan = """export function trainingPlan(currentBest: number, target: number) {
  // Reopening an easier completed quest for training must not inherit a much higher global best.
  const safeTarget = Math.max(1, Math.floor(Number(target) || 1));
  const candidate = currentBest > 0 ? currentBest : Math.min(safeTarget, 10);
  const base = Math.max(1, Math.min(candidate, safeTarget));
  const cappedReps = (reps: number) => Math.max(1, Math.min(safeTarget, reps));
  if (base <= 10) return { sets: 3, reps: cappedReps(Math.max(2, Math.ceil(base * .6))), rest: 90 };
  if (base <= 50) return { sets: 4, reps: cappedReps(Math.max(5, Math.ceil(base * .45))), rest: 90 };
  if (base <= 100) return { sets: 4, reps: cappedReps(Math.ceil(base * .4)), rest: 90 };
  if (base <= 500) return { sets: 4, reps: cappedReps(Math.ceil(base * .3)), rest: 90 };
  return { sets: 4, reps: cappedReps(Math.ceil(base * .22)), rest: 90 };
}"""
if old_plan not in s:
    raise SystemExit('trainingPlan block not found')
s = s.replace(old_plan, new_plan)

old_session_start = """function safeSession(raw: any): Session | null {
  const type = raw?.type === 'challenge' || raw?.type === 'training' ? raw.type : null;
  const level = Math.max(1, Math.min(200, Number(raw?.level) || 0));
  const target = Math.max(1, Math.floor(Number(raw?.target) || 0));
  const seconds = Math.max(0, Math.floor(Number(raw?.seconds) || 0));
  const at = typeof raw?.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : null;
  if (!type || !at || !Number(raw?.level) || !target) return null;"""
new_session_start = """function safeSession(raw: any): Session | null {
  const type = raw?.type === 'challenge' || raw?.type === 'training' ? raw.type : null;
  const rawLevel = Number(raw?.level);
  const validLevel = Number.isInteger(rawLevel) && rawLevel >= 1 && rawLevel <= 200;
  const level = validLevel ? rawLevel : 0;
  const target = validLevel ? targetForLevel(level) : 0;
  const seconds = Math.max(0, Math.floor(Number(raw?.seconds) || 0));
  const at = typeof raw?.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : null;
  if (!type || !at || !validLevel) return null;"""
if old_session_start not in s:
    raise SystemExit('safeSession start not found')
s = s.replace(old_session_start, new_session_start)
p.write_text(s)
