const fs = require('fs');
const path = 'App.tsx';
let s = fs.readFileSync(path, 'utf8');

function mustReplace(from, to, label) {
  if (!s.includes(from)) throw new Error(`Missing anchor: ${label}`);
  s = s.replace(from, to);
}

mustReplace(
  "import * as KeepAwake from 'expo-keep-awake';\n",
  "import * as KeepAwake from 'expo-keep-awake';\nimport { useAudioPlayer } from 'expo-audio';\n",
  'audio import',
);

mustReplace(
  "export default function App() {\n  const [state, setState] = useState<PersistedState>(initialState);",
  "export default function App() {\n  const startSignalPlayer = useAudioPlayer(require('./assets/start.wav'));\n  const [state, setState] = useState<PersistedState>(initialState);",
  'audio player hook',
);

mustReplace(
`    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    subscriptionRef.current = DeviceMotion.addListener(processMotion);`,
`    void (async () => {
      try {
        await startSignalPlayer.seekTo(0);
        startSignalPlayer.play();
      } catch {
        // Haptic remains the fallback start signal if audio is unavailable.
      }
    })();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    subscriptionRef.current = DeviceMotion.addListener(processMotion);`,
  'start signal playback',
);

mustReplace(
  '카운트가 끝나면 강한 진동이 옵니다. 그때부터 첫 푸쉬업을 시작하세요.',
  '카운트가 끝나면 짧은 시작음과 강한 진동이 옵니다. 그때부터 첫 푸쉬업을 시작하세요.',
  'countdown copy',
);

fs.writeFileSync(path, s);
console.log('Applied PUSH TOTAL start sound patch.');
