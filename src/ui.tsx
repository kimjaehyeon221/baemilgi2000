import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { C, styles } from './styles';

export function Button({
  label,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  dark = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        dark && secondary && { borderColor: C.activeLine, backgroundColor: 'transparent' },
        dark && !secondary && { backgroundColor: C.gi, borderColor: C.gi },
        disabled && styles.buttonDisabled,
        pressed && { opacity: 0.72, transform: [{ scale: 0.985 }] },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.buttonSecondaryText,
          dark && secondary && { color: C.activeText },
          dark && !secondary && { color: C.ink },
          danger && { color: C.danger },
          disabled && styles.buttonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Header({ onInfo }: { onInfo: () => void }) {
  return (
    <View
      style={{
        minHeight: 62,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.gi,
        borderBottomWidth: 1,
        borderColor: C.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 19, height: 4, backgroundColor: C.blue }} />
        <View>
          <Text
            style={{
              color: C.ink,
              fontSize: 13,
              fontFamily: 'Courier New',
              fontWeight: '900',
              letterSpacing: 1.1,
            }}
          >
            BAEMILGI 2000
          </Text>
          <Text
            style={{
              color: C.faint,
              fontSize: 7,
              fontFamily: 'Courier New',
              fontWeight: '900',
              letterSpacing: 1.4,
              marginTop: 2,
            }}
          >
            DOJO TRAINING LOG
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onInfo}
        accessibilityRole="button"
        accessibilityLabel="정보 및 설정"
        hitSlop={8}
        style={({ pressed }) => ({
          minWidth: 48,
          minHeight: 36,
          paddingHorizontal: 9,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: C.line,
          opacity: pressed ? 0.62 : 1,
        })}
      >
        <Text
          style={{
            color: C.ink,
            fontSize: 8,
            fontFamily: 'Courier New',
            fontWeight: '900',
            letterSpacing: 1,
          }}
        >
          INFO
        </Text>
      </Pressable>
    </View>
  );
}

export function FormStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={styles.formStep}>
      <Text style={styles.formN}>{n}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.formTitle}>{title}</Text>
        <Text style={styles.formBody}>{body}</Text>
      </View>
    </View>
  );
}
