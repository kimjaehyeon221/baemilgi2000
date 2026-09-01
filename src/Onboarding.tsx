import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  Vibration,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import {
  AppState,
  FORM_VIDEO_URL,
  formatSeconds,
  initialState,
  levelForReps,
} from './core';
import { styles } from './styles';
import { Button, FormStep } from './ui';

const digitsOnly = (value: string, maxLength = 4) =>
  value.replace(/[^0-9]/g, '').slice(0, maxLength);

function SetupTop({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <View style={styles.setupTop}>
      <View style={{ flex: 1 }}>
        <Text style={styles.setupBrand}>BAEMILGI / 2000</Text>
      </View>
      <Text style={styles.setupCount}>SETUP / {String(step).padStart(2, '0')}</Text>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="이전 단계"
          hitSlop={6}
          style={styles.setupBack}
        >
          <Text style={styles.setupBackText}>←</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ChoiceRow({
  title,
  body,
  onPress,
}: {
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.choiceRow, pressed && { opacity: 0.58 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceBody}>{body}</Text>
      </View>
      <Text style={styles.choiceArrow}>→</Text>
    </Pressable>
  );
}

const openReference = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('링크를 열 수 없어', '네트워크 연결을 확인한 뒤 다시 시도해줘.');
  }
};

const FORM_FRAMES = [
  {
    code: '01 / 시작',
    title: '엉덩이를 높여 시작해.',
    body: '손을 어깨보다 조금 넓게 두고, 몸을 역 V자로 만들어.',
    note: '시작 자세가 같아야 매번 같은 1회를 셀 수 있어.',
  },
  {
    code: '02 / 전진',
    title: '가슴을 낮춰 전진해.',
    body: '팔꿈치를 굽혀 가슴이 손 사이를 지나가게 해.',
    note: '속도보다 끊기지 않는 한 번의 흐름이 중요해.',
  },
  {
    code: '03 / 복귀',
    title: '팔을 펴고 뒤로 돌아와.',
    body: '가슴을 든 다음, 팔을 편 채 엉덩이를 뒤와 위로 보내.',
    note: '팔꿈치를 다시 깊게 굽히는 동작은 이 앱의 1회에서 제외해.',
  },
] as const;

const FORM_ARTWORK = [
  require('../assets/baemilgi-form-1.png'),
  require('../assets/baemilgi-form-2.png'),
  require('../assets/baemilgi-form-3.png'),
] as const;

function MotionSketch({ frame }: { frame: number }) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(0);
    Animated.spring(reveal, {
      toValue: 1,
      damping: 13,
      stiffness: 135,
      mass: 0.65,
      useNativeDriver: true,
    }).start();
  }, [frame, reveal]);

  const shift = reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const scale = reveal.interpolate({ inputRange: [0, 1], outputRange: [0.975, 1] });
  return (
    <View style={O.motionStage} accessible accessibilityLabel={FORM_FRAMES[frame].title}>
      <Animated.View style={[O.motionArtwork, { opacity: reveal, transform: [{ translateY: shift }, { scale }] }]}>
        <Image
          source={FORM_ARTWORK[frame]}
          style={O.motionImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
      <View style={O.motionLabels}>
        {['시작', '전진', '복귀'].map((label, index) => (
          <View key={label} style={[O.motionLabel, index === frame && O.motionLabelActive]}>
            <Text style={[O.motionLabelText, index === frame && O.motionLabelTextActive]}>0{index + 1} {label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function IntroLaunch({ onContinue }: { onContinue: () => void }) {
  const [opened, setOpened] = useState(false);
  const press = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  const openQuest = () => {
    if (opened) return;
    setOpened(true);
    Vibration.vibrate(18);
    Animated.parallel([
      Animated.spring(press, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 150,
        mass: 0.7,
      }),
      Animated.timing(reveal, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const markScale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });
  const markShift = press.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });
  const copyShift = reveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.onboarding}>
        <View style={O.launchTop}>
          <Text style={O.launchBrand}>BAEMILGI 2000</Text>
          <Text style={O.launchMeta}>첫 움직임</Text>
        </View>

        <Pressable
          onPress={openQuest}
          accessibilityRole="button"
          accessibilityLabel={opened ? '첫 퀘스트 열림' : '눌러서 첫 퀘스트 열기'}
          style={({ pressed }) => [O.launchStage, pressed && O.launchPressed]}
        >
          <Animated.View style={[O.launchMark, { transform: [{ translateY: markShift }, { scale: markScale }] }]}>
            <Image source={require('../assets/icon.png')} style={O.launchIcon} resizeMode="contain" accessibilityIgnoresInvertColors />
          </Animated.View>
          <Text style={O.launchCounter}>{opened ? '001' : '000'}</Text>
          <Text style={O.launchPrompt}>{opened ? '첫 기록 준비' : '눌러서 시작'}</Text>
        </Pressable>

        <View style={O.launchCopyArea}>
          {opened ? (
            <Animated.View style={{ opacity: reveal, transform: [{ translateY: copyShift }] }}>
              <Text style={O.launchTitle}>한 번이 열렸어.</Text>
              <Text style={O.launchCopy}>지금 가능한 횟수에서 시작해, 다음 한 번으로 이어가.</Text>
            </Animated.View>
          ) : (
            <Text style={O.launchHint}>설명보다 먼저, 화면을 눌러 움직임을 시작해봐.</Text>
          )}
        </View>

        <Button
          label={opened ? '내 기록으로 시작' : '먼저 화면을 눌러'}
          disabled={!opened}
          onPress={onContinue}
        />
      </View>
    </SafeAreaView>
  );
}

export function Onboarding({ onDone }: { onDone: (next: AppState) => void }) {
  const [step, setStep] = useState<
    'intro' | 'experience' | 'form' | 'measureIntro' | 'measureActive' | 'measureResult' | 'experienced'
  >('intro');
  const [baemilgi, setBaemilgi] = useState('');
  const [measuredReps, setMeasuredReps] = useState('');
  const [formFrame, setFormFrame] = useState(0);

  if (step === 'intro') {
    return <IntroLaunch onContinue={() => setStep('experience')} />;
  }

  if (step === 'experience') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
          <SetupTop step={1} onBack={() => setStep('intro')} />
          <View style={styles.setupBody}>
            <Text style={styles.question}>어디서 시작할까?</Text>
            <Text style={styles.copy}>처음이면 동작을 짧게 익히고, 경험이 있으면 기록만 입력해.</Text>
            <View style={styles.choiceList}>
              <ChoiceRow title="처음부터 측정" body="3가지 동작만 보고 바로 테스트" onPress={() => setStep('form')} />
              <ChoiceRow title="기록이 있어" body="현재 최고 횟수에서 바로 시작" onPress={() => setStep('experienced')} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'form') {
    const frame = FORM_FRAMES[formFrame];
    const lastFrame = formFrame === FORM_FRAMES.length - 1;
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
          <SetupTop
            step={2}
            onBack={() => formFrame > 0 ? setFormFrame((current) => current - 1) : setStep('experience')}
          />
          <View style={O.guideBody}>
            <View style={O.guideProgress}>
              {FORM_FRAMES.map((_, index) => (
                <View key={index} style={[O.guideProgressItem, index <= formFrame && O.guideProgressItemActive]} />
              ))}
            </View>
            <Text style={O.guideCode}>{frame.code}</Text>
            <Text style={styles.question}>{frame.title}</Text>
            <Text style={styles.copy}>{frame.body}</Text>
            <MotionSketch frame={formFrame} />
            <Text style={O.guideNote}>{frame.note}</Text>
          </View>
          <View style={O.guideActions}>
            <Button
              label={lastFrame ? '기준 확인 · 직접 측정' : '다음 동작'}
              onPress={() => lastFrame ? setStep('measureIntro') : setFormFrame((current) => current + 1)}
            />
            <Button label="전체 자세 영상 보기" secondary onPress={() => openReference(FORM_VIDEO_URL)} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'measureIntro') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
          <SetupTop step={3} onBack={() => setStep('form')} />
          <View style={O.measureBody}>
            <Text style={O.guideCode}>BASELINE / NO TARGET</Text>
            <Text style={styles.question}>목표 숫자 없이{String.fromCharCode(10)}직접 세어봐.</Text>
            <Text style={styles.copy}>앱은 답을 만들지 않아. 같은 자세로 가능한 만큼 움직이고, 멈춘 횟수를 직접 기록해.</Text>
            <View style={O.measurePreview}>
              <Text style={O.measurePreviewNumber}>—</Text>
              <Text style={O.measurePreviewLabel}>YOUR HONEST REPS</Text>
              <View style={O.measurePreviewRule} />
              <Text style={O.measurePreviewCopy}>통증이나 어지럼이 있으면 바로 종료</Text>
            </View>
            <Text style={O.guideNote}>0개도 정확한 시작 기록이야. 이 기록은 나중에 언제든 수정할 수 있어.</Text>
          </View>
          <Button label="측정 시작" onPress={() => setStep('measureActive')} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'measureActive') {
    return <CalibrationTest onCancel={() => setStep('measureIntro')} onFinish={() => setStep('measureResult')} />;
  }

  if (step === 'experienced') {
    const startFromRecord = () => {
      if (!baemilgi.trim()) return;
      const reps = Math.max(0, Math.min(2000, Number(baemilgi) || 0));
      const level = reps > 0 ? levelForReps(reps) : 0;
      Keyboard.dismiss();
      onDone({
        ...initialState,
        onboarded: true,
        firstBaemilgiMax: reps,
        clearedLevel: level,
        selectedLevel: level >= 200 ? 200 : level + 1,
      });
    };

    return (
      <KeyboardAvoidingView
        style={styles.onboarding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <SetupTop step={2} onBack={() => setStep('experience')} />
        <View style={styles.setupBody}>
          <Text style={styles.question}>지금 최고 기록은?</Text>
          <Text style={styles.copy}>공식 자세로 쉬지 않고 이어서 해낸 최고 횟수를 적어줘.</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={baemilgi}
              onChangeText={(value) => setBaemilgi(digitsOnly(value))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="0"
              placeholderTextColor="#9F978B"
              style={styles.bigInput}
              maxFontSizeMultiplier={1.2}
              maxLength={4}
              accessibilityLabel="배밀기 최고 기록"
            />
            <Text style={styles.inputUnit}>개</Text>
          </View>
          <Text style={styles.inputHint}>이 기록 이하의 단계는 완료된 것으로 표시돼.</Text>
        </View>
        <Button
          label={baemilgi.trim() ? `${Math.max(0, Math.min(2000, Number(baemilgi) || 0))}개에서 시작` : '현재 최고 기록을 입력해'}
          disabled={!baemilgi.trim()}
          onPress={startFromRecord}
        />
      </KeyboardAvoidingView>
    );
  }

  const saveMeasurement = () => {
    if (!measuredReps.trim()) return;
    const reps = Math.max(0, Math.min(2000, Number(measuredReps) || 0));
    const clearedLevel = reps > 0 ? levelForReps(reps) : 0;
    Keyboard.dismiss();
    onDone({
      ...initialState,
      onboarded: true,
      firstBaemilgiMax: reps,
      clearedLevel,
      selectedLevel: clearedLevel >= 200 ? 200 : clearedLevel + 1,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.onboarding}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <SetupTop step={4} onBack={() => setStep('measureIntro')} />
      <View style={styles.setupBody}>
        <Text style={styles.recommendLabel}>MEASUREMENT COMPLETE</Text>
        <Text style={styles.question}>정확한 자세로{`\n`}몇 개 했어?</Text>
        <Text style={styles.copy}>앱이 숫자를 대신 만들지 않아. 방금 직접 센 횟수만 기록해.</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={measuredReps}
            onChangeText={(value) => setMeasuredReps(digitsOnly(value))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="직접 입력"
            placeholderTextColor="#707069"
            style={styles.recommendInput}
            maxFontSizeMultiplier={1.2}
            maxLength={4}
            accessibilityLabel="직접 측정한 배밀기 개수"
          />
          <Text style={styles.recommendUnit}>개</Text>
        </View>
        <Text style={styles.recommendCopy}>0개도 입력할 수 있어. 다음 퀘스트는 이 기록 바로 다음 단계에서 시작해.</Text>
        <View style={styles.recommendRule} />
        <Text style={styles.copy}>잘못 셌다면 기록 탭에서 시작 기록을 언제든 수정할 수 있어.</Text>
      </View>
      <Button
        label={measuredReps.trim() ? `${Math.max(0, Math.min(2000, Number(measuredReps) || 0))}개에서 시작` : '측정한 횟수를 입력해'}
        disabled={!measuredReps.trim()}
        onPress={saveMeasurement}
      />
    </KeyboardAvoidingView>
  );
}

function CalibrationTest({ onCancel, onFinish }: { onCancel: () => void; onFinish: () => void }) {
  useKeepAwake();
  const [seconds, setSeconds] = useState(0);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    const sync = () => setSeconds(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: '#121212' }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.workout}>
        <View style={styles.workoutTop}>
          <Button label="취소" secondary onPress={onCancel} />
          <Text style={styles.workoutTitle}>BASELINE / LIVE</Text>
          <View style={{ width: 72 }} />
        </View>
        <View style={styles.workoutGrow}>
          <Text style={styles.kicker}>NO TARGET / HONEST REPS</Text>
          <Text style={styles.calibrationWord}>COUNT</Text>
          <Text style={styles.workoutUnit}>정확한 자세를 직접 세어줘</Text>
          <Text style={styles.timer}>{formatSeconds(seconds)}</Text>
          <Text style={styles.workoutHint}>앱은 목표를 제시하지 않아. 자세가 무너지거나 불편하면 바로 측정을 끝내.</Text>
        </View>
        <Button label="측정 종료 · 횟수 기록" onPress={onFinish} />
      </View>
    </SafeAreaView>
  );
}


const O = StyleSheet.create({
  launchTop: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  launchBrand: { color: '#121212', fontFamily: 'Menlo', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  launchMeta: { color: '#1B365D', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  launchStage: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center' },
  launchPressed: { opacity: 0.82 },
  launchMark: { width: 218, height: 218, marginBottom: 8, borderRadius: 48, overflow: 'hidden' },
  launchIcon: { width: '100%', height: '100%' },
  launchCounter: { color: '#121212', fontFamily: 'Avenir Next', fontSize: 62, lineHeight: 70, fontWeight: '800', letterSpacing: -1.8, fontVariant: ['tabular-nums'] },
  launchPrompt: { color: '#686A68', fontSize: 12, fontWeight: '800', letterSpacing: -0.1, marginTop: 2 },
  launchCopyArea: { minHeight: 104, justifyContent: 'flex-end', paddingBottom: 18 },
  launchTitle: { color: '#121212', fontSize: 31, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8 },
  launchCopy: { color: '#686A68', fontSize: 14, lineHeight: 22, marginTop: 7, maxWidth: 310 },
  launchHint: { color: '#686A68', fontSize: 13, lineHeight: 21, maxWidth: 300 },
  guideBody: { flex: 1, paddingTop: 28 },
  guideProgress: { flexDirection: 'row', gap: 6, marginBottom: 25 },
  guideProgressItem: { flex: 1, height: 3, backgroundColor: '#D7D3CA' },
  guideProgressItemActive: { backgroundColor: '#1B365D' },
  guideCode: { color: '#1B365D', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 9 },
  motionStage: { height: 226, marginTop: 18, overflow: 'hidden', backgroundColor: '#111317', borderRadius: 2 },
  motionArtwork: { flex: 1, paddingHorizontal: 10, paddingTop: 8 },
  motionImage: { width: '100%', height: '100%' },
  motionLabels: { height: 38, flexDirection: 'row', backgroundColor: '#111317', paddingHorizontal: 10, gap: 6 },
  motionLabel: { flex: 1, borderTopWidth: 2, borderTopColor: '#3B3E43', justifyContent: 'center' },
  motionLabelActive: { borderTopColor: '#B22222' },
  motionLabelText: { color: '#777B82', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  motionLabelTextActive: { color: '#FAF9F6' },
  guideNote: { color: '#686A68', fontSize: 12, lineHeight: 19, marginTop: 15 },
  guideActions: { gap: 9 },
  measureBody: { flex: 1, paddingTop: 42 },
  measurePreview: { flex: 1, maxHeight: 244, marginTop: 28, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  measurePreviewNumber: { color: '#FAF9F6', fontFamily: 'Avenir Next', fontSize: 88, lineHeight: 98, fontWeight: '800' },
  measurePreviewLabel: { color: '#A9B9CF', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  measurePreviewRule: { width: 48, height: 3, backgroundColor: '#1B365D', marginVertical: 18 },
  measurePreviewCopy: { color: '#A8ADAE', fontSize: 11, lineHeight: 18, textAlign: 'center' },
});

