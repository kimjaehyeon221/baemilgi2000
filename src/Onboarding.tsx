import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppState, FORM_VIDEO_URL, initialState, TARGETS, targetForLevel } from './core';
import { C, styles } from './styles';
import { Button } from './ui';

const digitsOnly = (value: string, maxLength = 4) =>
  value.replace(/[^0-9]/g, '').slice(0, maxLength);

const closestQuestLevel = (reps: number) => {
  let closestLevel = 1;
  for (let level = 2; level <= 200; level += 1) {
    if (
      Math.abs(TARGETS[level] - reps) <
      Math.abs(TARGETS[closestLevel] - reps)
    ) {
      closestLevel = level;
    }
  }
  return closestLevel;
};

function SetupTop({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <View style={styles.setupTop}>
      <View style={{ flex: 1 }}>
        <Text style={styles.setupBrand}>BAEMILGI / 2000</Text>
      </View>
      <Text style={styles.setupCount}>시작 / {String(step).padStart(2, '0')}</Text>
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

function ChoiceRow({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
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
    note: '여기까지 돌아오면 배밀기 1회야.',
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

  return (
    <View style={O.motionStage} accessible accessibilityLabel={FORM_FRAMES[frame].title}>
      <Animated.View
        style={[
          O.motionArtwork,
          {
            opacity: reveal,
            transform: [
              { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.975, 1] }) },
            ],
          },
        ]}
      >
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
            <Text style={[O.motionLabelText, index === frame && O.motionLabelTextActive]}>
              0{index + 1} {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Intro({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={O.heroRoot}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require('../assets/onboarding-dojo-v1.jpg')}
        style={O.heroImage}
        resizeMode="cover"
        blurRadius={12}
        accessibilityIgnoresInvertColors
      />
      <View style={O.heroShade} />
      <SafeAreaView style={O.heroSafe}>
        <View style={O.heroFrame}>
          <View style={O.heroTop}>
            <View style={O.heroMark} />
            <Text style={O.heroBrand}>BAEMILGI 2000</Text>
          </View>

          <View style={O.heroCopy}>
            <Text style={O.heroEyebrow}>배밀기 · DAND</Text>
            <Text style={O.heroTitle}>배밀기{`\n`}2000</Text>
            <Text style={O.heroDescription}>
              엉덩이를 높인 자세에서 가슴을 앞으로 밀어내고, 다시 뒤·위로 돌아오는 전신 운동입니다.
            </Text>
            <Text style={O.heroGoal}>1개부터 시작해, 200개의 퀘스트 끝에 2,000개까지.</Text>
            <Text style={O.heroSafety}>
              목표는 기록일 뿐이에요. 체력에 맞게 진행하고 통증이 있으면 멈추세요.
            </Text>
          </View>

          <View style={O.heroAction}>
            <Button label="시작하기" dark onPress={onContinue} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export function Onboarding({
  onDone,
}: {
  onDone: (next: AppState, firstChallengeLevel: number) => Promise<boolean> | boolean | void;
}) {
  const [step, setStep] = useState<'intro' | 'experience' | 'form' | 'experienced'>('intro');
  const [firstTarget, setFirstTarget] = useState('');
  const [formFrame, setFormFrame] = useState(0);

  const startBeginner = () => {
    onDone(
      {
        ...initialState,
        onboarded: true,
        firstBaemilgiMax: null,
        clearedLevel: 0,
        selectedLevel: 1,
      },
      1,
    );
  };

  if (step === 'intro') return <Intro onContinue={() => setStep('experience')} />;

  if (step === 'experience') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.onboarding}>
          <SetupTop step={1} onBack={() => setStep('intro')} />
          <View style={styles.setupBody}>
            <Text style={styles.question}>배밀기를{`\n`}해본 적 있나요?</Text>
            <Text style={styles.copy}>시작점만 고르면 바로 첫 퀘스트로 들어가요.</Text>
            <View style={styles.choiceList}>
              <ChoiceRow
                title="처음이에요"
                body="자세를 보고 1개부터 시작"
                onPress={() => {
                  setFormFrame(0);
                  setStep('form');
                }}
              />
              <ChoiceRow
                title="해본 적 있어요"
                body="첫 도전 횟수를 고르고 바로 도전"
                onPress={() => setStep('experienced')}
              />
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
        <StatusBar barStyle="dark-content" />
        <View style={styles.onboarding}>
          <SetupTop
            step={2}
            onBack={() =>
              formFrame > 0 ? setFormFrame((current) => current - 1) : setStep('experience')
            }
          />
          <View style={O.guideBody}>
            <View style={O.guideProgress}>
              {FORM_FRAMES.map((_, index) => (
                <View
                  key={index}
                  style={[O.guideProgressItem, index <= formFrame && O.guideProgressItemActive]}
                />
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
              label={lastFrame ? '1개 퀘스트 도전' : '다음 동작'}
              onPress={() =>
                lastFrame ? startBeginner() : setFormFrame((current) => current + 1)
              }
            />
            <Button
              label="전체 자세 영상 보기"
              secondary
              onPress={() => openReference(FORM_VIDEO_URL)}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const requestedTarget = Math.max(1, Math.min(2000, Number(firstTarget) || 1));
  const firstChallengeLevel = closestQuestLevel(requestedTarget);
  const firstChallengeTarget = targetForLevel(firstChallengeLevel);

  const startFirstChallenge = () => {
    if (!firstTarget.trim()) return;
    Keyboard.dismiss();
    onDone(
      {
        ...initialState,
        onboarded: true,
        firstBaemilgiMax: null,
        clearedLevel: 0,
        selectedLevel: 1,
      },
      firstChallengeLevel,
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.onboarding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <SetupTop step={2} onBack={() => setStep('experience')} />
        <View style={styles.setupBody}>
          <Text style={styles.question}>첫 퀘스트를{`\n`}몇 개로 시작할까?</Text>
          <Text style={styles.copy}>
            해낼 수 있을 것 같은 횟수를 골라요. 아직 완료로 처리하지 않고, 바로 그 퀘스트에 도전합니다.
          </Text>
          <View style={O.targetInputRow}>
            <TextInput
              value={firstTarget}
              onChangeText={(value) => setFirstTarget(digitsOnly(value))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="예: 10"
              placeholderTextColor="#AAA49A"
              style={O.targetInput}
              maxFontSizeMultiplier={1.2}
              maxLength={4}
              accessibilityLabel="첫 도전 횟수"
            />
            <Text style={O.targetInputUnit}>개</Text>
          </View>
          <Text style={styles.inputHint}>
            {firstTarget.trim()
              ? firstChallengeTarget === requestedTarget
                ? `성공하면 ${firstChallengeTarget}개 단계까지 완료돼요.`
                : `가장 가까운 공식 퀘스트인 ${firstChallengeTarget}개로 연결돼요.`
              : '성공해야 선택한 단계까지 완료돼요.'}
          </Text>
        </View>
        <View style={O.targetCtaWrap}>
          <Text style={O.targetCtaHint}>목표 횟수를 입력하면 바로 도전을 시작할 수 있어요.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={firstTarget.trim() ? `${firstChallengeTarget}개 도전 시작` : '목표 횟수 입력 후 도전 시작'}
            accessibilityState={{ disabled: !firstTarget.trim() }}
            disabled={!firstTarget.trim()}
            onPress={startFirstChallenge}
            style={({ pressed }) => [
              O.targetCta,
              !firstTarget.trim() && O.targetCtaDisabled,
              pressed && firstTarget.trim() && O.targetCtaPressed,
            ]}
          >
            <Text style={[O.targetCtaText, !firstTarget.trim() && O.targetCtaTextDisabled]}>
              {firstTarget.trim() ? `${firstChallengeTarget}개 도전 시작` : '목표 횟수 입력 후 시작'}
            </Text>
            <Text style={[O.targetCtaArrow, !firstTarget.trim() && O.targetCtaTextDisabled]}>→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const O = StyleSheet.create({
  heroRoot: { flex: 1, backgroundColor: '#0A0C0F' },
  heroImage: { position: 'absolute', top: -76, right: 0, bottom: 76, left: 0 },
  heroShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#07090C7A',
  },
  heroSafe: { flex: 1 },
  heroFrame: { flex: 1, paddingHorizontal: 22, paddingBottom: 20 },
  heroTop: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF2E',
  },
  heroMark: { width: 28, height: 4, backgroundColor: '#8EA6C7', marginRight: 10 },
  heroBrand: {
    color: '#FAF9F6',
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.35,
  },
  heroCopy: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  heroEyebrow: {
    color: '#AFC0D7',
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 13,
  },
  heroTitle: {
    color: '#FAF9F6',
    fontSize: 56,
    lineHeight: 59,
    fontWeight: '900',
    letterSpacing: -2.8,
  },
  heroDescription: {
    color: '#E3E2DE',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
    maxWidth: 330,
    marginTop: 22,
  },
  heroGoal: {
    color: '#AFC0D7',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    marginTop: 14,
  },
  heroSafety: {
    color: '#FAF9F6',
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '800',
    maxWidth: 330,
    marginTop: 9,
  },
  heroAction: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#FFFFFF2E' },
  guideBody: { flex: 1, paddingTop: 28 },
  guideProgress: { flexDirection: 'row', gap: 6, marginBottom: 25 },
  guideProgressItem: { flex: 1, height: 3, backgroundColor: '#D7D3CA' },
  guideProgressItemActive: { backgroundColor: C.blue },
  guideCode: {
    color: C.blue,
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 9,
  },
  motionStage: {
    height: 226,
    marginTop: 18,
    overflow: 'hidden',
    backgroundColor: '#111317',
    borderRadius: 2,
  },
  motionArtwork: { flex: 1, paddingHorizontal: 10, paddingTop: 8 },
  motionImage: { width: '100%', height: '100%' },
  motionLabels: {
    height: 38,
    flexDirection: 'row',
    backgroundColor: '#111317',
    paddingHorizontal: 10,
    gap: 6,
  },
  motionLabel: {
    flex: 1,
    borderTopWidth: 2,
    borderTopColor: '#3B3E43',
    justifyContent: 'center',
  },
  motionLabelActive: { borderTopColor: C.stamp },
  motionLabelText: { color: '#777B82', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  motionLabelTextActive: { color: '#FAF9F6' },
  guideNote: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 15 },
  guideActions: { gap: 9 },
  targetInputRow: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: C.blue,
    marginTop: 22,
  },
  targetInput: {
    flex: 1,
    height: 90,
    color: C.ink,
    fontSize: 64,
    lineHeight: 76,
    fontWeight: '900',
    letterSpacing: -2.5,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  targetInputUnit: {
    color: C.blue,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '900',
    marginLeft: 8,
  },
  targetCtaWrap: { paddingTop: 12 },
  targetCtaHint: {
    color: '#777168',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    marginBottom: 9,
  },
  targetCta: {
    minHeight: 64,
    backgroundColor: C.blue,
    borderWidth: 2,
    borderColor: '#0D223F',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetCtaDisabled: {
    backgroundColor: '#E7EBF0',
    borderColor: '#8FA2BA',
  },
  targetCtaPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  targetCtaText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  targetCtaArrow: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 26,
    fontWeight: '900',
  },
  targetCtaTextDisabled: { color: C.blue },
});
