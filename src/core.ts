export type Session = {
  at: string;
  type: 'challenge' | 'training';
  level: number;
  target: number;
  success: boolean;
  seconds: number;
  actualReps?: number;
  trainingSets?: number;
  trainingRepsPerSet?: number;
  trainingRestSeconds?: number;
};

export type AppState = {
  onboarded: boolean;
  firstBaemilgiMax: number | null;
  clearedLevel: number;
  selectedLevel: number;
  sessions: Session[];
};

export const STORAGE_KEY = 'baemilgi2000-ios-v1';
export const FORM_VIDEO_URL = 'https://www.youtube.com/watch?v=8zuZ_Ybe8nc';
export const GAMA_SOURCE_URL = 'https://simplexstrong.com/2020/03/what-makes-the-oriental-strong-the-indian-dands-1911/';
export const PRIVACY_URL = 'https://github.com/kimjaehyeon221/web1/blob/main/baemilgi2000/PRIVACY.md';
export const SUPPORT_URL = 'https://github.com/kimjaehyeon221/web1/blob/main/baemilgi2000/SUPPORT.md';

export const initialState: AppState = {
  onboarded: false,
  firstBaemilgiMax: null,
  clearedLevel: 0,
  selectedLevel: 1,
  sessions: [],
};

function roundNice(n: number) {
  if (n < 200) return Math.max(1, Math.round(n / 5) * 5);
  if (n < 500) return Math.round(n / 10) * 10;
  if (n < 1000) return Math.round(n / 25) * 25;
  return Math.round(n / 50) * 50;
}

function interpolate(startLevel: number, endLevel: number, startReps: number, endReps: number, level: number) {
  const t = (level - startLevel) / (endLevel - startLevel);
  return roundNice(startReps * Math.pow(endReps / startReps, t));
}

function buildTargets() {
  const values = new Array<number>(201).fill(0);
  for (let l = 1; l <= 100; l++) values[l] = l;
  for (let l = 101; l <= 130; l++) values[l] = interpolate(100, 130, 100, 250, l);
  for (let l = 131; l <= 150; l++) values[l] = interpolate(130, 150, 250, 500, l);
  for (let l = 151; l <= 175; l++) values[l] = interpolate(150, 175, 500, 1000, l);
  for (let l = 176; l <= 200; l++) values[l] = interpolate(175, 200, 1000, 2000, l);
  values[100] = 100;
  values[130] = 250;
  values[150] = 500;
  values[175] = 1000;
  values[200] = 2000;
  for (let l = 101; l <= 200; l++) if (values[l] <= values[l - 1]) values[l] = values[l - 1] + 1;
  values[130] = 250;
  values[150] = 500;
  values[175] = 1000;
  values[200] = 2000;
  return values;
}

export const TARGETS = buildTargets();

export function targetForLevel(level: number) {
  return TARGETS[Math.max(1, Math.min(200, level))];
}

export function levelForReps(reps: number) {
  let best = 0;
  for (let l = 1; l <= 200; l++) {
    if (TARGETS[l] <= reps) best = l;
    else break;
  }
  return best;
}

export function trainingPlan(currentBest: number, target: number) {
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
}

function safeSession(raw: any): Session | null {
  const type = raw?.type === 'challenge' || raw?.type === 'training' ? raw.type : null;
  const rawLevel = Number(raw?.level);
  const validLevel = Number.isInteger(rawLevel) && rawLevel >= 1 && rawLevel <= 200;
  const level = validLevel ? rawLevel : 0;
  const target = validLevel ? targetForLevel(level) : 0;
  const seconds = Math.max(0, Math.floor(Number(raw?.seconds) || 0));
  const at = typeof raw?.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : null;
  if (!type || !at || !validLevel) return null;
  const success = Boolean(raw?.success);
  const parsedActual = Number(raw?.actualReps);
  const actualReps = type === 'challenge'
    ? success
      ? target
      : Number.isFinite(parsedActual)
        ? Math.min(Math.max(0, target - 1), Math.max(0, Math.floor(parsedActual)))
        : undefined
    : undefined;
  const trainingSets = type === 'training' && Number.isFinite(Number(raw?.trainingSets))
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
}

export function recomputeProgress(raw: AppState): AppState {
  const startLevel = raw.firstBaemilgiMax && raw.firstBaemilgiMax > 0 ? levelForReps(raw.firstBaemilgiMax) : 0;
  const challengeLevel = raw.sessions.reduce(
    (best, session) => session.type === 'challenge' && session.success ? Math.max(best, session.level) : best,
    0,
  );
  const clearedLevel = Math.max(startLevel, challengeLevel);
  const minimumSelected = clearedLevel >= 200 ? 200 : clearedLevel + 1;
  return {
    ...raw,
    clearedLevel,
    // kept in the persisted schema for backwards compatibility; release progression is sequential.
    selectedLevel: minimumSelected,
  };
}

export function safeState(raw: any): AppState {
  const clearedLevel = Math.max(0, Math.min(200, Number(raw?.clearedLevel) || 0));
  const sessions = Array.isArray(raw?.sessions)
    ? raw.sessions.map(safeSession).filter((item: Session | null): item is Session => item !== null)
    : [];
  const minimumSelected = clearedLevel >= 200 ? 200 : clearedLevel + 1;
  const candidate: AppState = {
    onboarded: Boolean(raw?.onboarded),
    firstBaemilgiMax: Number.isFinite(raw?.firstBaemilgiMax) ? Math.min(2000, Math.max(0, Math.floor(raw.firstBaemilgiMax))) : null,
    clearedLevel,
    selectedLevel: Math.max(minimumSelected, Math.min(200, Number(raw?.selectedLevel) || 1)),
    sessions,
  };
  return recomputeProgress(candidate);
}

export function formatSeconds(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
