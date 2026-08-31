const fs = require('fs');

let s = fs.readFileSync('App.tsx', 'utf8');
const original = s;

function ensureReplace(search, replacement, label) {
  if (s.includes(replacement)) return;
  if (!s.includes(search)) throw new Error(`Patch failed: ${label}`);
  s = s.replace(search, replacement);
}

// This pass intentionally builds on the already-validated trusted-session RC.
// It only adds cadence timing/audio and preserves the raw sensor count.
ensureReplace(
  "  source: EntrySource;\n  date: string;",
  "  source: EntrySource;\n  detectedAmount?: number;\n  date: string;",
  'detected provenance type',
);

ensureReplace(
  "const AUTO_FINISH_MS = 7_000;\nconst IGNORE_START_MS = 1_100;\nconst MIN_REP_MS = 480;\nconst MAX_HALF_CYCLE_MS = 2_300;",
  "const CADENCE_HALF_MS = 1_500;\nconst AUTO_FINISH_MS = 4_000;\nconst IGNORE_START_MS = 300;\nconst MIN_REP_MS = 1_900;\nconst MAX_HALF_CYCLE_MS = 2_100;",
  'cadence constants',
);

ensureReplace(
  "    source: raw?.source === 'pocket' ? 'pocket' : 'manual',\n    date:",
  "    source: raw?.source === 'pocket' ? 'pocket' : 'manual',\n    detectedAmount: Number.isFinite(Number(raw?.detectedAmount)) ? Math.max(0, Math.floor(Number(raw.detectedAmount))) : undefined,\n    date:",
  'load provenance',
);

ensureReplace(
  "  const startSignalPlayer = useAudioPlayer(require('./assets/start.wav'));",
  "  const startSignalPlayer = useAudioPlayer(require('./assets/start.wav'));\n  const cadenceDownPlayer = useAudioPlayer(require('./assets/cadence-down.wav'));\n  const cadenceUpPlayer = useAudioPlayer(require('./assets/cadence-up.wav'));",
  'cadence players',
);

ensureReplace(
  "  const finishSessionRef = useRef<(automatic?: boolean) => void>(() => undefined);",
  "  const finishSessionRef = useRef<(automatic?: boolean) => void>(() => undefined);\n  const cadenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);\n  const cadencePhaseRef = useRef(0);",
  'cadence refs',
);

ensureReplace(
  "    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);\n    maxTimerRef.current = null;",
  "    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);\n    if (cadenceTimerRef.current) clearInterval(cadenceTimerRef.current);\n    maxTimerRef.current = null;",
  'clear cadence timer',
);

ensureReplace(
  "    elapsedTimerRef.current = null;\n    void KeepAwake.deactivateKeepAwake",
  "    elapsedTimerRef.current = null;\n    cadenceTimerRef.current = null;\n    cadencePhaseRef.current = 0;\n    void KeepAwake.deactivateKeepAwake",
  'reset cadence state',
);

ensureReplace(
  "  const saveEntry = (amount: number, source: EntrySource) => {",
  "  const saveEntry = (amount: number, source: EntrySource, detectedAmount?: number) => {",
  'save signature',
);

ensureReplace(
  "      source,\n      date: localDateKey(now),",
  "      source,\n      detectedAmount: source === 'pocket' && Number.isFinite(detectedAmount) ? Math.max(0, Math.floor(Number(detectedAmount))) : undefined,\n      date: localDateKey(now),",
  'save provenance',
);

ensureReplace(
  "    saveEntry(confirmedCount, 'pocket');",
  "    saveEntry(confirmedCount, 'pocket', detectedCount);",
  'confirm provenance',
);

ensureReplace(
`    void (async () => {
      try {
        await startSignalPlayer.seekTo(0);
        startSignalPlayer.play();
      } catch {
        // Haptic remains the fallback start signal if audio is unavailable.
      }
    })();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    subscriptionRef.current = DeviceMotion.addListener(processMotion);
    maxTimerRef.current = setTimeout(() => finishSessionRef.current(true), MAX_SESSION_MS);`,
`    void (async () => {
      try {
        await startSignalPlayer.seekTo(0);
        startSignalPlayer.play();
      } catch {
        // Haptic remains the fallback start signal if audio is unavailable.
      }
    })();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    subscriptionRef.current = DeviceMotion.addListener(processMotion);

    const playCadenceCue = () => {
      const player = cadencePhaseRef.current % 2 === 0 ? cadenceDownPlayer : cadenceUpPlayer;
      void (async () => {
        try {
          await player.seekTo(0);
          player.play();
        } catch {
          // Motion counting continues even if a cadence cue cannot play.
        }
      })();
      cadencePhaseRef.current += 1;
    };
    cadencePhaseRef.current = 0;
    const firstCadenceCue = setTimeout(() => {
      playCadenceCue();
      cadenceTimerRef.current = setInterval(playCadenceCue, CADENCE_HALF_MS);
    }, CADENCE_HALF_MS);
    countdownTimersRef.current.push(firstCadenceCue);

    maxTimerRef.current = setTimeout(() => finishSessionRef.current(true), MAX_SESSION_MS);`,
  'cadence playback',
);

fs.writeFileSync('App.tsx', s);
console.log(`PUSH TOTAL incremental cadence pass applied: ${original.length} -> ${s.length}`);
