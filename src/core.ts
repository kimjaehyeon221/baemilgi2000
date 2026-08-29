export type Session = {
  at: string;
  type: 'challenge' | 'training';
  level: number;
  target: number;
  success: boolean;
  seconds: number;
  actualReps?: number;
};

export type AppState = {
  onboarded: boolean;
  pushupMax: number | null;
  firstBaemilgiMax: number | null;
  clearedLevel: number;
  selectedLevel: number;
  sessions: Session[];
};

export const STORAGE_KEY = 'baemilgi2000-ios-v1';
export const FORM_VIDEO_URL = 'https://www.youtube.com/watch?v=8zuZ_Ybe8nc';
export const GAMA_SOURCE_URL = 'https://commons.wikimedia.org/wiki/File:Dand,_Dund,_Hindu_push-up,_Figures_1_and_2.jpg';
export const PRIVACY_URL = 'https://baemilgi2000-upendjh-6028s-projects.vercel.app/privacy';
export const SUPPORT_URL = 'https://baemilgi2000-upendjh-6028s-projects.vercel.app/support';

export const initialState: AppState = {
  onboarded: false,
  pushupMax: null,
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
  let best = 1;
  for (let l = 1; l <= 200; l++) {
    if (TARGETS[l] <= reps) best = l;
    else break;
  }
  return best;
}

export function recommendedTestFromPushups(p: number) {
  if (p <= 5) return 3;
  if (p <= 15) return 5;
  if (p <= 30) return 10;
  if (p <= 50) return 15;
  if (p <= 70) return 20;
  if (p <= 100) return 25;
  return 30;
}

export function trainingPlan(currentBest: number, target: number) {
  const base = Math.max(1, currentBest || Math.min(target, 10));
  if (base <= 10) return { sets: 3, reps: Math.max(2, Math.ceil(base * .6)), rest: 90 };
  if (base <= 50) return { sets: 4, reps: Math.max(5, Math.ceil(base * .45)), rest: 90 };
  if (base <= 100) return { sets: 4, reps: Math.ceil(base * .4), rest: 90 };
  if (base <= 500) return { sets: 4, reps: Math.ceil(base * .3), rest: 90 };
  return { sets: 4, reps: Math.ceil(base * .22), rest: 90 };
}

function safeSession(raw: any): Session | null {
  const type = raw?.type === 'challenge' || raw?.type === 'training' ? raw.type : null;
  const level = Math.max(1, Math.min(200, Number(raw?.level) || 0));
  const target = Math.max(1, Math.floor(Number(raw?.target) || 0));
  const seconds = Math.max(0, Math.floor(Number(raw?.seconds) || 0));
  const at = typeof raw?.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : null;
  if (!type || !at || !Number(raw?.level) || !target) return null;
  const success = Boolean(raw?.success);
  const parsedActual = Number(raw?.actualReps);
  const actualReps = type === 'challenge'
    ? (Number.isFinite(parsedActual) ? Math.max(0, Math.floor(parsedActual)) : success ? target : undefined)
    : undefined;
  return { at, type, level, target, success, seconds, actualReps };
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
    selectedLevel: Math.max(minimumSelected, Math.min(200, raw.selectedLevel || minimumSelected)),
  };
}

export function safeState(raw: any): AppState {
  const clearedLevel = Math.max(0, Math.min(200, Number(raw?.clearedLevel) || 0));
  const sessions = Array.isArray(raw?.sessions)
    ? raw.sessions.map(safeSession).filter((item): item is Session => item !== null)
    : [];
  const minimumSelected = clearedLevel >= 200 ? 200 : clearedLevel + 1;
  return {
    onboarded: Boolean(raw?.onboarded),
    pushupMax: Number.isFinite(raw?.pushupMax) ? Math.max(0, Math.floor(raw.pushupMax)) : null,
    firstBaemilgiMax: Number.isFinite(raw?.firstBaemilgiMax) ? Math.max(0, Math.floor(raw.firstBaemilgiMax)) : null,
    clearedLevel,
    selectedLevel: Math.max(minimumSelected, Math.min(200, Number(raw?.selectedLevel) || 1)),
    sessions,
  };
}

export function formatSeconds(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
