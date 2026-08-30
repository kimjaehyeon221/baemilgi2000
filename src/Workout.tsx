import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { formatSeconds, targetForLevel, trainingPlan } from './core';
import { styles } from './styles';
import { Button } from './ui';

export function Challenge({
  level,
  onCancel,
  onFinish,
}: {
  level: number;
  onCancel: () => void;
  onFinish: (success: boolean, seconds: number, actualReps: number) => void;
}) {
  useKeepAwake();
  const target = targetForLevel(level);
  const [seconds, setSeconds] = useState(0);
  const [recordFailure, setRecordFailure] = useState(false);
  const [failedReps, setFailedReps] = useState('');

  useEffect(() => {
    if (recordFailure) return;
    const id = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [recordFailure]);

  const saveFailure = () => {
    if (!failedReps.trim()) {
      Alert.alert('몇 개까지 했는지 적어줘', '0개라면 0을 입력해도 돼.');
      return;
    }
    const reps = Math.max(0, Math.floor(Number(failedReps) || 0));
    if (reps >= target) {
      Alert.alert(
        '목표 횟수 이상이야',
        `${target}개를 완료했다면 뒤로 가서 ‘완료했어’를 눌러줘. 실패 기록은 ${Math.max(0, target - 1)}개까지 저장할 수 있어.`,
      );
      return;
    }
    Keyboard.dismiss();
    onFinish(false, seconds, reps);
  };

  if (recordFailure) {
    return (
      <KeyboardAvoidingView
        style={styles.workout}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.workoutTop}>
          <Button label="뒤로" secondary onPress={() => setRecordFailure(false)} />
          <Text style={styles.workoutTitle}>LEVEL {level}</Text>
          <View style={{ width: 72 }} />
        </View>
        <View style={styles.workoutGrow}>
          <Text style={styles.kicker}>FAILED AT</Text>
          <Text style={styles.failureQuestion}>몇 개까지{`\n`}성공했어?</Text>
          <Text style={styles.workoutHint}>실패 기록도 다음 훈련 기준이 돼. 목표는 {target}개였어.</Text>
          <TextInput
            value={failedReps}
            onChangeText={(value) => setFailedReps(value.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            placeholderTextColor="#A79F93"
            style={styles.bigInput}
            autoFocus
            accessibilityLabel="실패 전까지 성공한 배밀기 개수"
          />
        </View>
        <Button label="실패 기록 저장" onPress={saveFailure} />
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.workout}>
      <View style={styles.workoutTop}>
        <Button label="취소" secondary onPress={onCancel} />
        <Text style={styles.workoutTitle}>LEVEL {level}</Text>
        <View style={{ width: 72 }} />
      </View>
      <View style={styles.workoutGrow}>
        <Text style={styles.kicker}>QUEST</Text>
        <Text style={styles.workoutTarget}>{target}</Text>
        <Text style={styles.workoutUnit}>연속 배밀기</Text>
        <Text style={styles.timer}>{formatSeconds(seconds)}</Text>
        <Text style={styles.workoutHint}>팔을 편 채 엉덩이를 뒤·위로 복귀해야 1회. 통증이나 어지럼이 있으면 즉시 중단해.</Text>
      </View>
      <View style={{ gap: 9 }}>
        <Button label="완료했어" onPress={() => onFinish(true, seconds, target)} />
        <Button label="실패" secondary onPress={() => setRecordFailure(true)} />
      </View>
    </SafeAreaView>
  );
}

export function Training({
  level,
  currentBest,
  onCancel,
  onFinish,
}: {
  level: number;
  currentBest: number;
  onCancel: () => void;
  onFinish: (seconds: number) => void;
}) {
  useKeepAwake();
  const plan = trainingPlan(currentBest, targetForLevel(level));
  const [setNumber, setSetNumber] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [rest, setRest] = useState(false);
  const [restLeft, setRestLeft] = useState(plan.rest);

  useEffect(() => {
    const id = setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!rest) return;
    if (restLeft <= 0) {
      setRest(false);
      setRestLeft(plan.rest);
      return;
    }
    const id = setTimeout(() => setRestLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [rest, restLeft, plan.rest]);

  const finishSet = () => {
    if (setNumber >= plan.sets) onFinish(seconds);
    else {
      setSetNumber((v) => v + 1);
      setRest(true);
    }
  };

  return (
    <SafeAreaView style={styles.workout}>
      <View style={styles.workoutTop}>
        <Button label="취소" secondary onPress={onCancel} />
        <Text style={styles.workoutTitle}>LEVEL {level} 훈련</Text>
        <View style={{ width: 72 }} />
      </View>
      <View style={styles.workoutGrow}>
        <Text style={styles.kicker}>{rest ? 'REST' : `SET ${setNumber} / ${plan.sets}`}</Text>
        <Text style={styles.workoutTarget}>{rest ? restLeft : plan.reps}</Text>
        <Text style={styles.workoutUnit}>{rest ? '초' : '개'}</Text>
        <Text style={styles.timer}>{formatSeconds(seconds)}</Text>
        <Text style={styles.workoutHint}>현재 확인된 최고 기록을 기준으로 만든 보조 훈련 예시야. 무리해서 Quest 목표량을 훈련 세트로 따라가지 않아.</Text>
      </View>
      <Button
        label={rest ? '휴식 건너뛰기' : setNumber >= plan.sets ? '훈련 완료' : '세트 완료'}
        secondary={rest}
        onPress={() => rest ? (setRest(false), setRestLeft(plan.rest)) : finishSet()}
      />
    </SafeAreaView>
  );
}
