import fs from 'node:fs';

const path = 'App.tsx';
let text = fs.readFileSync(path, 'utf8');

function replaceRequired(from, to, label) {
  if (!text.includes(from)) throw new Error(`Missing target: ${label}`);
  text = text.replace(from, to);
}

replaceRequired(
`      {
        code: '02 / POCKET',
        title: '주머니에 넣고\\n자세부터 잡으세요.',
        body: 'POCKET COUNT를 누르면 10초가 주어집니다. 앞주머니에 iPhone을 넣고 시작 자세를 잡으세요. 신호 후의 움직임부터 셉니다.',
      },
      {
        code: '03 / TRUST',
        title: '기록은\\n직접 쌓은 것만.',
        body: '자유 수동 입력은 없습니다. 센서가 센 횟수를 마지막에 확인하고 ±10 안에서만 보정합니다. 과거 숫자도 가져오지 않고 오늘 0부터 시작합니다.',
      },`,
`      {
        code: '02 / POCKET',
        title: '5초는 넣고,\\n5초는 자세를 잡으세요.',
        body: 'POCKET COUNT를 누르면 10초 준비가 시작됩니다. 처음 5초 안에 iPhone을 앞주머니에 넣고, 남은 5초는 시작 자세를 잡은 채 안정적으로 유지하세요. 시작음과 진동 뒤부터 셉니다.',
      },
      {
        code: '03 / FINISH',
        title: '멈추면\\n세트가 끝납니다.',
        body: '마지막 푸쉬업 뒤 5초 동안 반복 움직임이 없으면 자동으로 종료됩니다. 센서가 센 횟수를 확인한 뒤 ±10 안에서만 보정할 수 있고, 자유 수동 입력은 없습니다.',
      },`,
'onboarding copy',
);

replaceRequired(
`          if (left > 0) setCountdown(left);
          else void beginListening();`,
`          if (left > 0) {
            setCountdown(left);
            if (left === 5) {
              void Haptics.selectionAsync().catch(() => undefined);
            }
          } else void beginListening();`,
'countdown transition',
);

replaceRequired(
`                <Text style={styles.sessionKicker}>GET INTO POSITION</Text>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.sessionTitle}>10초 안에 자세를 잡으세요.</Text>
                <Text style={styles.sessionBody}>카운트가 끝나면 짧은 시작음과 강한 진동이 옵니다. 그때부터 첫 푸쉬업을 시작하세요.</Text>`,
`                <Text style={styles.sessionKicker}>{countdown > 5 ? 'STEP 1 · FRONT POCKET' : 'STEP 2 · HOLD POSITION'}</Text>
                <Text style={styles.countdownNumber}>{countdown > 5 ? countdown - 5 : countdown}</Text>
                <Text style={styles.sessionTitle}>{countdown > 5 ? '앞주머니에 iPhone을 넣으세요.' : '시작 자세를 잡고 그대로 유지하세요.'}</Text>
                <Text style={styles.sessionBody}>{countdown > 5 ? '처음 5초는 폰을 넣는 시간입니다. 화면을 볼 필요 없이 앞주머니에 완전히 넣으세요.' : '남은 5초는 자세를 안정시키는 시간입니다. 시작음과 강한 진동 뒤부터 첫 푸쉬업을 시작하세요.'}</Text>`,
'countdown UI',
);

replaceRequired(
'멈춘 뒤 4초 동안 반복 움직임이 없으면 확인 화면으로 넘어갑니다.',
'마지막 푸쉬업 뒤 5초 동안 반복 움직임이 없으면 확인 화면으로 넘어갑니다.',
'auto finish copy',
);

fs.writeFileSync(path, text);
