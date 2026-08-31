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
      Alert.alert('멈춘 횟수를 적어줘', '0개라면 0을 입력해도 돼.');
      return;
    }
    const reps = Math.max(0, Math.floor(Number(failedReps) || 0));
    if (reps >= target) {
      Alert.alert(
        '목표 횟수 이상이야',
        `${target}개를 완료했다면 뒤로 가서 COMPLETE를 눌러줘. 중단 기록은 ${Math.max(0, target - 1)}개까지 저장할 수 있어.`,
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
          <Button label="BACK" secondary dark onPress={() => setRecordFailure(false)} />
          <Text style={styles.workoutTitle}>QUEST / {String(level).padStart(3, '0')}</Text>
          <View style={{ width: 72 }} />
        </View>
        <View style={styles.workoutGrow}>
          <Text style={styles.kicker}>TRAINING RECORD</Text>
          <Text style={styles.failureQuestion}>STOPPED AT</Text>
          <Text style={styles.workoutHint}>목표 {target}개. 멈춘 지점도 다음 수련을 위한 기록으로 남겨.</Text>
          <View style={[styles.inputRow, { width: '100%' }]}>
            <TextInput
              value={failedReps}
              onChangeText={(value) => setFailedReps(value.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="0"
              placeholderTextColor="#747878"
              style={[styles.bigInput, { color: '#FAF9F6' }]}
              autoFocus
              accessibilityLabel="중단 전까지 성공한 배밀기 개수"
            />
            <Text style={[styles.inputUnit, { color: '#B8C7DC' }]}>REPS</Text>
          </View>
        </View>
        <Button label="SAVE RECORD" dark onPress={saveFailure} />
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.workout}>
        <View style={styles.workoutTop}>
          <Button label="CLOSE" secondary dark onPress={onCancel} />
          <Text style={styles.workoutTitle}>QUEST / {String(level).padStart(3, '0')}</Text>
          <View style={{ width: 72 }} />
        </View>
        <View style={styles.workoutGrow}>
          <Text style={styles.kicker}>ACTIVE CHALLENGE</Text>
          <Text style={styles.workoutTarget}>{target}</Text>
          <Text style={styles.workoutUnit}>TARGET · CONTINUOUS REPS</Text>
          <Text style={styles.timer}>{formatSeconds(seconds)}  ELAPSED</Text>
          <Text style={styles.workoutHint}>휴대폰은 목표와 시간만 보여줘. 직접 횟수를 세고, 자세가 무너지거나 불편하면 STOP HERE.</Text>
        </View>
        <View style={{ gap: 9 }}>
          <Button label="COMPLETE" dark onPress={() => onFinish(true, seconds, target)} />
          <Button label="STOP HERE" secondary dark onPress={() => setRecordFailure(true)} />
        </View>
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
    <SafeAreaView style={styles.root}>
      <View style={styles.workout}>
        <View style={styles.workoutTop}>
          <Button label="CLOSE" secondary dark onPress={onCancel} />
          <Text style={styles.workoutTitle}>DRILL / {String(level).padStart(3, '0')}</Text>
          <View style={{ width: 72 }} />
        </View>
        <View style={styles.workoutGrow}>
          <Text style={styles.kicker}>{rest ? 'REST' : `SET ${setNumber} / ${plan.sets}`}</Text>
          <Text style={styles.workoutTarget}>{rest ? String(restLeft).padStart(2, '0') : plan.reps}</Text>
          <Text style={styles.workoutUnit}>{rest ? 'SECONDS' : 'REPS'}</Text>
          <Text style={styles.timer}>{formatSeconds(seconds)}  SESSION</Text>
          <Text style={styles.workoutHint}>현재 확인된 기록을 바탕으로 만든 배밀기 보조 훈련이야. 한 세트를 무리해서 끝낼 필요는 없어.</Text>
        </View>
        <Button
          label={rest ? 'SKIP REST' : setNumber >= plan.sets ? 'COMPLETE TRAINING' : 'COMPLETE SET'}
          secondary={rest}
          dark
          onPress={() => (rest ? (setRest(false), setRestLeft(plan.rest)) : finishSet())}
        />
      </View>
    </SafeAreaView>
  );
}
