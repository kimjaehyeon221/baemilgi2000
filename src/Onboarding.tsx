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

function SetupTop({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.setupTop}>
      <Text style={styles.setupBrand}>배밀기 2000</Text>
      <Text style={styles.setupCount}>{step} / {total}</Text>
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
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
          <View style={styles.introTop}>
            <Text style={styles.introBrand}>배밀기 2000</Text>
            <Text style={styles.introYear}>1911</Text>
          </View>
          <View style={styles.introGrow}>
            <Text style={styles.introEyebrow}>GREAT GAMA</Text>
            <Text style={styles.introTitle}>2,000</Text>
            <Text style={styles.introSub}>오늘 가능한 횟수에서, 한 단계씩.</Text>
            <View style={styles.introRule} />
            <Text style={styles.introCopy}>
              지금 할 수 있는 횟수에서 시작해 200개의 작은 퀘스트를 따라가. 성공뿐 아니라 멈춘 지점도 다음 기록이 돼.
            </Text>
            <Text style={styles.introCopy}>
              마지막 2,000은 Great Gama의 역사적 Dand 기록에서 가져온 상징적인 끝점이야.
            </Text>
            <Text style={styles.introMeta}>운동 권장량이 아니며, 몸 상태에 맞춰 천천히 진행해.</Text>
          </View>
          <Button label="내 기록 시작" onPress={() => setStep('experience')} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'experience') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
          <SetupTop step={1} total={4} />
          <View style={styles.setupBody}>
            <Text style={styles.question}>배밀기를 해본 적 있어?</Text>
            <Text style={styles.copy}>처음이라면 자세부터 확인하고, 해봤다면 지금 최고 기록에서 시작해.</Text>
            <View style={styles.choiceList}>
              <ChoiceRow title="처음이야" body="자세를 보고 첫 테스트부터 시작" onPress={() => setStep('form')} />
              <ChoiceRow title="해봤어" body="현재 최고 기록에서 바로 시작" onPress={() => setStep('experienced')} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'form') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
          <SetupTop step={2} total={4} />
          <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.question}>이 앱에서 1회로 세는 자세</Text>
            <Text style={styles.copy}>횟수보다 먼저, 매번 같은 동작을 1회로 세는 기준을 맞춰.</Text>
            <View style={styles.formList}>
              <FormStep n="1" title="엉덩이를 높여 시작" body="손을 고정하고 역 V자에 가깝게 시작." />
              <FormStep n="2" title="가슴을 앞으로" body="팔꿈치를 굽히며 가슴을 손 사이로 낮게 통과." />
              <FormStep n="3" title="팔을 펴고 가슴을 든다" body="앞으로 나간 뒤 팔을 펴며 상체를 들어 올림." />
              <FormStep n="4" title="팔을 편 채 뒤로" body="팔꿈치를 다시 굽히지 않고 엉덩이를 뒤·위로 보내 복귀." />
            </View>
            <Text style={styles.note}>되돌아올 때 팔꿈치를 다시 굽히는 Dive Bomber 방식은 이 앱의 기준에서 제외해.</Text>
            <Button label="자세 영상 보기" secondary onPress={() => Linking.openURL(FORM_VIDEO_URL)} />
            <View style={{ height: 10 }} />
            <Button label="다음" onPress={() => setStep('pushup')} />
          </ScrollView>
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
        <SetupTop step={3} total={4} />
        <View style={styles.setupBody}>
          <Text style={styles.question}>푸쉬업은 최대 몇 개 가능해?</Text>
          <Text style={styles.copy}>처음 해볼 배밀기 횟수를 정할 때 참고할게.</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={pushups}
              onChangeText={(value) => setPushups(digitsOnly(value))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="0"
              placeholderTextColor="#9F978B"
              style={styles.bigInput}
              maxLength={4}
              accessibilityLabel="최대 푸쉬업 개수"
            />
            <Text style={styles.inputUnit}>개</Text>
          </View>
          <Text style={styles.inputHint}>푸쉬업과 배밀기는 다른 동작이라 1:1로 환산하지 않아.</Text>
        </View>
        <Button label="시작점 보기" onPress={goNext} />
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
        <SetupTop step={2} total={2} />
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
              maxLength={4}
              accessibilityLabel="배밀기 최고 기록"
            />
            <Text style={styles.inputUnit}>개</Text>
          </View>
          <Text style={styles.inputHint}>이 기록 이하의 단계는 완료된 것으로 표시돼.</Text>
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
      <SetupTop step={4} total={4} />
      <View style={styles.setupBody}>
        <Text style={styles.recommendLabel}>첫 테스트</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={testReps}
            onChangeText={(value) => setTestReps(digitsOnly(value))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder={String(recommendation)}
            placeholderTextColor="#9F978B"
            style={styles.recommendInput}
            maxLength={4}
            accessibilityLabel="첫 배밀기 테스트 개수"
          />
          <Text style={styles.recommendUnit}>개</Text>
        </View>
        <Text style={styles.recommendCopy}>푸쉬업 {Math.max(0, Number(pushups) || 0)}개를 참고해 잡은 시작점이야.</Text>
        <View style={styles.recommendRule} />
        <Text style={styles.copy}>추천값은 정답이 아니야. 배밀기 경험과 몸 상태에 맞게 숫자를 직접 바꿔도 돼.</Text>
      </View>
      <Button
        label={`${Math.max(1, Math.min(2000, Number(testReps) || recommendation))}개로 시작`}
        onPress={startTest}
      />
    </KeyboardAvoidingView>
  );
}

