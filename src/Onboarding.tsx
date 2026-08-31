import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
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

export function Onboarding({ onDone }: { onDone: (next: AppState) => void }) {
  const [step, setStep] = useState<
    'intro' | 'experience' | 'form' | 'measureIntro' | 'measureActive' | 'measureResult' | 'experienced'
  >('intro');
  const [baemilgi, setBaemilgi] = useState('');
  const [measuredReps, setMeasuredReps] = useState('');

  if (step === 'intro') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
          <View style={styles.introTop}>
            <Text style={styles.introBrand}>BAEMILGI / 2000</Text>
            <Text style={styles.introYear}>GAMA / 1911 ARCHIVE</Text>
          </View>
          <View style={styles.introGrow}>
            <View style={styles.introSignal}><Text style={styles.introSignalText}>QUEST SYSTEM / 001—200</Text></View>
            <Text style={styles.introEyebrow}>GREAT GAMA ARCHIVE</Text>
            <Text style={styles.introTitle} maxFontSizeMultiplier={1.15}>2,000</Text>
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
          <SetupTop step={1} onBack={() => setStep('intro')} />
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
          <SetupTop step={2} onBack={() => setStep('experience')} />
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
            <Button label="자세 영상 보기" secondary onPress={() => openReference(FORM_VIDEO_URL)} />
            <View style={{ height: 10 }} />
            <Button label="직접 측정하러 가기" onPress={() => setStep('measureIntro')} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'measureIntro') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.onboarding}>
        <SetupTop step={3} onBack={() => setStep('form')} />
        <View style={styles.setupBody}>
          <Text style={styles.question}>앱이 정하지 않고,{`\n`}직접 측정해.</Text>
          <Text style={styles.copy}>목표 숫자는 보여주지 않을게. 같은 자세를 유지할 수 있는 만큼만 하고, 직접 센 횟수를 기록해.</Text>
          <View style={styles.formList}>
            <FormStep n="01" title="휴대폰을 보이는 곳에 두기" body="측정 화면은 계속 켜져 있어." />
            <FormStep n="02" title="정확한 자세로 직접 세기" body="속도보다 매번 같은 동작이 중요해." />
            <FormStep n="03" title="자세가 무너지기 전에 종료" body="통증이나 어지럼이 있으면 바로 멈춰." />
          </View>
          <Text style={styles.note}>0개도 유효한 시작 기록이야. 측정 결과를 과장하지 않아야 다음 훈련이 정확해져.</Text>
        </View>
        <View style={{ gap: 9 }}>
          <Button label="목표 없이 측정 시작" onPress={() => setStep('measureActive')} />
          <Button label="자세 영상 다시 보기" secondary onPress={() => openReference(FORM_VIDEO_URL)} />
        </View>
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
