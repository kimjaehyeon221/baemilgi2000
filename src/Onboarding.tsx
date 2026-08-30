import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
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
        <View style={styles.introGrow}>
          <Text style={styles.kicker}>1911 · GREAT GAMA</Text>
          <Text style={styles.introTitle}>3시간.{`\n`}2,000개.</Text>
          <Text style={styles.introCopy}>
            Great Gama는 20세기 초를 대표하는 전설적인 프로 레슬러야. 당시 기록에는 그가 약 3시간 동안 2,000회가 넘는 Dand를 했다고 남아 있어.
          </Text>
          <Text style={styles.introCopy}>
            배밀기 2000은 그 숫자를 마지막 Quest로 둔다. 200개의 벽을 하나씩 넘어서, 1년 뒤 어디까지 갈 수 있는지 확인하는 앱이야.
          </Text>
          <Text style={styles.introNote}>
            2,000은 건강 권장량이 아니라 역사적 도전 기록이야.
          </Text>
        </View>
        <Button label="내 기록 시작하기" onPress={() => setStep('experience')} />
      </SafeAreaView>
    );
  }

  if (step === 'experience') {
    return (
      <SafeAreaView style={styles.onboarding}>
        <View style={styles.choiceGrow}>
          <Text style={styles.choiceKicker}>START</Text>
          <Text style={styles.choiceQuestion}>배밀기를{`\n`}해본 적 있어?</Text>
          <Text style={styles.choiceCopy}>처음이라면 자세부터. 해봤다면 지금 기록에서 시작해.</Text>
          <View style={styles.choiceActions}>
            <Button label="처음이야" onPress={() => setStep('form')} />
            <Button label="해봤어" secondary onPress={() => setStep('experienced')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'form') {
    return (
      <SafeAreaView style={styles.onboarding}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.kicker}>OFFICIAL FORM</Text>
          <Text style={styles.question}>이 앱에서{`\n`}1회로 세는 자세</Text>
          <View style={{ marginTop: 20 }}>
            <FormStep n="1" title="엉덩이를 높여 시작" body="손을 고정하고 역 V자에 가깝게 시작." />
            <FormStep n="2" title="가슴을 앞으로" body="팔꿈치를 굽히며 가슴을 손 사이로 낮게 통과." />
            <FormStep n="3" title="팔을 펴고 가슴을 든다" body="앞으로 나간 뒤 팔을 펴며 상체를 들어 올림." />
            <FormStep n="4" title="팔을 편 채 뒤로" body="팔꿈치를 다시 굽히지 않고 엉덩이를 뒤·위로 보내 복귀." />
          </View>
          <Text style={styles.note}>
            들어온 길을 팔꿈치를 다시 굽혀 되돌아가는 Dive Bomber 방식은 이 앱의 기준이 아니야.
          </Text>
          <Button label="실제 자세 영상 보기" secondary onPress={() => Linking.openURL(FORM_VIDEO_URL)} />
          <View style={{ height: 10 }} />
          <Button label="이해했어" onPress={() => setStep('pushup')} />
        </ScrollView>
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
        <View style={styles.grow}>
          <Text style={styles.kicker}>STARTING POINT</Text>
          <Text style={styles.question}>푸쉬업은 최대{`\n`}몇 개 가능해?</Text>
          <Text style={styles.copy}>배밀기로 직접 환산하지 않아. 첫 배밀기 테스트 난이도 추천에만 사용해.</Text>
          <TextInput
            value={pushups}
            onChangeText={(value) => setPushups(digitsOnly(value))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            placeholderTextColor="#A79F93"
            style={styles.bigInput}
            maxLength={4}
            accessibilityLabel="최대 푸쉬업 개수"
          />
        </View>
        <Button label="추천 보기" onPress={goNext} />
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
        <View style={styles.grow}>
          <Text style={styles.kicker}>YOUR RECORD</Text>
          <Text style={styles.question}>배밀기 최고 기록은?</Text>
          <Text style={styles.copy}>이미 해낸 기록은 인정해. 높은 레벨을 깨면 아래 레벨도 모두 클리어돼.</Text>
          <TextInput
            value={baemilgi}
            onChangeText={(value) => setBaemilgi(digitsOnly(value))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            placeholderTextColor="#A79F93"
            style={styles.bigInput}
            maxLength={4}
            accessibilityLabel="배밀기 최고 기록"
          />
        </View>
        <Button label="이 기록에서 시작" onPress={startFromRecord} />
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

  return (
    <KeyboardAvoidingView
      style={styles.onboarding}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <View style={styles.grow}>
        <Text style={styles.kicker}>FIRST TEST</Text>
        <Text style={styles.question}>첫 배밀기 테스트{`\n`}몇 개로 할까?</Text>
        <Text style={styles.copy}>
          푸쉬업 {Math.max(0, Number(pushups) || 0)}개 기준 추천은 {recommendation}개야. 정확한 환산식은 없어서, 몸 상태에 맞게 직접 바꿔도 돼.
        </Text>
        <TextInput
          value={testReps}
          onChangeText={(value) => setTestReps(digitsOnly(value))}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder={String(recommendation)}
          placeholderTextColor="#A79F93"
          style={styles.bigInput}
          maxLength={4}
          accessibilityLabel="첫 배밀기 테스트 개수"
        />
      </View>
      <Button label={`${Math.max(1, Math.min(2000, Number(testReps) || recommendation))}개로 시작`} onPress={startTest} />
    </KeyboardAvoidingView>
  );
}
