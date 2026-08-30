import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AppState,
  FORM_VIDEO_URL,
  initialState,
  levelForReps,
  recommendedTestFromPushups,
} from './core';
import { styles } from './styles';
import { Button, FormStep } from './ui';

const digitsOnly = (value: string, maxLength = 4) =>
  value.replace(/[^0-9]/g, '').slice(0, maxLength);

function SetupTop({ label }: { label: string }) {
  return (
    <View style={styles.setupTop}>
      <Text style={styles.setupBrand}>배밀기 2000</Text>
      <Text style={styles.setupLabel}>{label}</Text>
    </View>
  );
}

function ChoiceCard({
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
      style={({ pressed }) => [styles.choiceCard, pressed && styles.choiceCardPressed]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.choiceCardTitle}>{title}</Text>
        <Text style={styles.choiceCardBody}>{body}</Text>
      </View>
      <Text style={styles.choiceCardArrow}>→</Text>
    </Pressable>
  );
}

export function Onboarding({ onDone }: { onDone: (next: AppState) => void }) {
  const [step, setStep] = useState<
    'intro' | 'experience' | 'form' | 'pushup' | 'experienced' | 'recommend'
  >('intro');
  const [pushups, setPushups] = useState('');
  const [baemilgi, setBaemilgi] = useState('');
  const [recommendation, setRecommendation] = useState(10);
  const [testReps, setTestReps] = useState('10');

  if (step === 'intro') {
    return (
      <SafeAreaView style={styles.onboarding}>
        <View style={styles.introTop}>
          <Text style={styles.setupBrand}>배밀기 2000</Text>
        </View>
        <View style={styles.introGrow}>
          <Text style={styles.introEyebrow}>THE GREAT GAMA · 1911</Text>
          <Text style={styles.introNumber}>2,000</Text>
          <Text style={styles.introSubtitle}>3시간 동안 기록된 Dand</Text>
          <View style={styles.introRule} />
          <Text style={styles.introCopy}>
            Great Gama는 20세기 초 남아시아를 대표한 전설적인 레슬러야. 당시 관찰 기록에는 그가 약 3시간 동안 2,000회가 넘는 Dand를 했다고 남아 있어.
          </Text>
          <Text style={styles.introCopyStrong}>
            이 앱은 그 2,000을 마지막 벽으로 두고, 거기까지 가는 길을 200개의 Quest로 나눴어.
          </Text>
          <Text style={styles.introFootnote}>2,000은 운동 권장량이 아니라 역사적 도전 기록이야.</Text>
        </View>
        <View style={styles.onboardingFooter}>
          <Button label="200개의 Quest 시작" onPress={() => setStep('experience')} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'experience') {
    return (
      <SafeAreaView style={styles.onboarding}>
        <SetupTop label="SETUP 01" />
        <View style={styles.stepBody}>
          <Text style={styles.stepEyebrow}>EXPERIENCE</Text>
          <Text style={styles.stepQuestion}>배밀기를{`\n`}해본 적 있어?</Text>
          <Text style={styles.stepCopy}>시작점을 정하기 위한 질문이야. 둘 중 지금 상태에 가까운 쪽을 골라줘.</Text>
          <View style={styles.choiceStack}>
            <ChoiceCard
              title="처음이야"
              body="자세를 먼저 익히고 첫 테스트를 정할게."
              onPress={() => setStep('form')}
            />
            <ChoiceCard
              title="해봤어"
              body="지금까지 해낸 최고 기록에서 바로 시작할게."
              onPress={() => setStep('experienced')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'form') {
    return (
      <SafeAreaView style={styles.onboarding}>
        <SetupTop label="SETUP 02" />
        <ScrollView
          style={styles.stepScroller}
          contentContainerStyle={styles.stepScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepEyebrow}>FORM</Text>
          <Text style={styles.stepQuestion}>이 움직임을{`\n`}1회로 셀게.</Text>
          <Text style={styles.stepCopy}>속도보다 동작의 시작과 끝이 분명한지가 중요해.</Text>
          <View style={styles.formCard}>
            <FormStep n="1" title="엉덩이를 높여 시작" body="손을 고정하고 역 V자에 가깝게 시작." />
            <FormStep n="2" title="가슴을 앞으로" body="팔꿈치를 굽히며 가슴을 손 사이로 낮게 통과." />
            <FormStep n="3" title="팔을 펴고 가슴을 든다" body="앞으로 나간 뒤 팔을 펴며 상체를 들어 올림." />
            <FormStep n="4" title="팔을 편 채 뒤로" body="팔꿈치를 다시 굽히지 않고 엉덩이를 뒤·위로 보내 복귀." />
          </View>
          <Text style={styles.formNote}>
            들어온 길을 팔꿈치를 다시 굽혀 되돌아가는 Dive Bomber 방식은 이 앱의 배밀기로 세지 않아.
          </Text>
          <Pressable onPress={() => Linking.openURL(FORM_VIDEO_URL)} style={styles.textLinkRow}>
            <Text style={styles.textLink}>실제 자세 영상 보기</Text>
            <Text style={styles.textLinkArrow}>↗</Text>
          </Pressable>
        </ScrollView>
        <View style={styles.onboardingFooter}>
          <Button label="다음" onPress={() => setStep('pushup')} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'pushup') {
    const goNext = () => {
      const value = Math.max(0, Number(pushups) || 0);
      const nextRecommendation = recommendedTestFromPushups(value);
      Keyboard.dismiss();
      setRecommendation(nextRecommendation);
      setTestReps(String(nextRecommendation));
      setStep('recommend');
    };

    return (
      <KeyboardAvoidingView
        style={styles.onboarding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <SetupTop label="SETUP 03" />
        <View style={styles.stepBody}>
          <Text style={styles.stepEyebrow}>BASELINE</Text>
          <Text style={styles.stepQuestion}>푸쉬업은 최대{`\n`}몇 개 가능해?</Text>
          <Text style={styles.stepCopy}>배밀기 실력으로 환산하는 건 아니야. 처음 해볼 테스트의 강도만 정하는 참고값이야.</Text>
          <View style={styles.numberField}>
            <TextInput
              value={pushups}
              onChangeText={(value) => setPushups(digitsOnly(value))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="0"
              placeholderTextColor="#AAA196"
              style={styles.numberInput}
              maxLength={4}
              accessibilityLabel="최대 푸쉬업 개수"
            />
            <Text style={styles.numberUnit}>개</Text>
          </View>
        </View>
        <View style={styles.onboardingFooter}>
          <Button label="첫 테스트 추천 보기" onPress={goNext} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (step === 'experienced') {
    const startFromRecord = () => {
      const reps = Math.max(1, Number(baemilgi) || 1);
      const level = levelForReps(reps);
      Keyboard.dismiss();
      onDone({
        ...initialState,
        onboarded: true,
        firstBaemilgiMax: reps,
        clearedLevel: level,
        selectedLevel: Math.min(200, level + 1),
      });
    };

    return (
      <KeyboardAvoidingView
        style={styles.onboarding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <SetupTop label="SETUP 02" />
        <View style={styles.stepBody}>
          <Text style={styles.stepEyebrow}>YOUR RECORD</Text>
          <Text style={styles.stepQuestion}>배밀기 최고 기록은{`\n`}몇 개야?</Text>
          <Text style={styles.stepCopy}>이미 해낸 기록은 그대로 인정해. 그 기록에 맞는 레벨부터 이어서 시작할게.</Text>
          <View style={styles.numberField}>
            <TextInput
              value={baemilgi}
              onChangeText={(value) => setBaemilgi(digitsOnly(value))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="0"
              placeholderTextColor="#AAA196"
              style={styles.numberInput}
              maxLength={4}
              accessibilityLabel="배밀기 최고 기록"
            />
            <Text style={styles.numberUnit}>개</Text>
          </View>
        </View>
        <View style={styles.onboardingFooter}>
          <Button label="이 기록에서 시작" onPress={startFromRecord} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  const startTest = () => {
    const reps = Math.max(1, Math.min(2000, Number(testReps) || recommendation));
    Keyboard.dismiss();
    onDone({
      ...initialState,
      onboarded: true,
      pushupMax: Math.max(0, Number(pushups) || 0),
      selectedLevel: levelForReps(reps),
    });
  };

  const chosen = Math.max(1, Math.min(2000, Number(testReps) || recommendation));

  return (
    <KeyboardAvoidingView
      style={styles.onboarding}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <SetupTop label="SETUP 04" />
      <View style={styles.stepBody}>
        <Text style={styles.stepEyebrow}>FIRST TEST</Text>
        <Text style={styles.stepQuestion}>첫 테스트는{`\n`}여기서 시작해.</Text>
        <Text style={styles.stepCopy}>
          푸쉬업 {Math.max(0, Number(pushups) || 0)}개를 참고해 잡은 시작점이야. 공식 환산값이 아니어서 직접 바꿔도 돼.
        </Text>
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationLabel}>추천 시작점</Text>
          <View style={styles.recommendationValueRow}>
            <TextInput
              value={testReps}
              onChangeText={(value) => setTestReps(digitsOnly(value))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder={String(recommendation)}
              placeholderTextColor="#AAA196"
              style={styles.recommendationInput}
              maxLength={4}
              accessibilityLabel="첫 배밀기 테스트 개수"
            />
            <Text style={styles.recommendationUnit}>개</Text>
          </View>
          <Text style={styles.recommendationMeta}>추천값 {recommendation} · 탭해서 수정 가능</Text>
        </View>
        <Text style={styles.stepHint}>목표에 못 미쳐도 실패 지점을 기록하면 다음 훈련 기준으로 남아.</Text>
      </View>
      <View style={styles.onboardingFooter}>
        <Button label={`${chosen}개 테스트 시작`} onPress={startTest} />
      </View>
    </KeyboardAvoidingView>
  );
}
