export type TrainingChapter = {
  id: 'white' | 'blue' | 'purple' | 'brown' | 'black';
  name: string;
  label: string;
  startLevel: number;
  endLevel: number;
  color: string;
  textColor: string;
};

// BAEMILGI TRAINING CHAPTERS borrow the adult BJJ belt colour sequence as a
// visual progression language. They are NOT judo/jiu-jitsu ranks or certificates.
export const TRAINING_CHAPTERS: TrainingChapter[] = [
  { id: 'white', name: 'WHITE', label: 'FOUNDATION', startLevel: 1, endLevel: 100, color: '#E7E3DA', textColor: '#121212' },
  { id: 'blue', name: 'BLUE', label: 'RHYTHM', startLevel: 101, endLevel: 130, color: '#1B365D', textColor: '#FAF9F6' },
  { id: 'purple', name: 'PURPLE', label: 'VOLUME', startLevel: 131, endLevel: 150, color: '#5D416F', textColor: '#FAF9F6' },
  { id: 'brown', name: 'BROWN', label: 'ENDURANCE', startLevel: 151, endLevel: 175, color: '#674636', textColor: '#FAF9F6' },
  { id: 'black', name: 'BLACK', label: '2000', startLevel: 176, endLevel: 200, color: '#121212', textColor: '#FAF9F6' },
];

export function chapterForLevel(level: number) {
  const safe = Math.max(1, Math.min(200, Math.floor(level || 1)));
  return TRAINING_CHAPTERS.find((chapter) => safe >= chapter.startLevel && safe <= chapter.endLevel) ?? TRAINING_CHAPTERS[0];
}

export const CHAPTER_GUIDE_COPY =
  '색은 성인 브라질리언 주짓수의 대표적인 벨트 순서에서 영감을 받은 훈련 챕터야. 실제 유도·주짓수 띠 등급이나 승급을 의미하지 않아.';

export const BAEMILGI_MARTIAL_COPY =
  '배밀기는 힌두 푸시업(Hindu push-up)이라고도 불리는 반복 체력 운동이야. 국내 유도 훈련 자료에서도 상체 전반과 코어를 쓰는 기초 체력 동작으로 소개돼. 이 앱은 무도 수련의 반복·기록 문화를 시각 언어로 가져왔지만, 특정 협회의 공식 훈련 프로그램은 아니야.';
