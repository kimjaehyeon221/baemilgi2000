const fs = require('fs');

function replaceOnce(file, before, after, label) {
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(before)) throw new Error(`${label} anchor not found`);
  fs.writeFileSync(file, current.replace(before, after));
}

replaceOnce(
  'src/Onboarding.tsx',
  `              placeholder="10"\n              placeholderTextColor="#9F978B"`,
  `              placeholder="예: 10"\n              placeholderTextColor="#AAA49A"`,
  'target placeholder',
);

replaceOnce(
  'src/Onboarding.tsx',
  `        <Button\n          label={\n            firstTarget.trim()\n              ? \`${'${firstChallengeTarget}'}개 퀘스트 도전\`\n              : '첫 도전 횟수를 입력해주세요'\n          }\n          disabled={!firstTarget.trim()}\n          onPress={startFirstChallenge}\n        />`,
  `        <View style={O.targetCtaWrap}>\n          <Text style={O.targetCtaHint}>목표 횟수를 입력하면 바로 도전을 시작할 수 있어요.</Text>\n          <Pressable\n            accessibilityRole="button"\n            accessibilityLabel={firstTarget.trim() ? \`${'${firstChallengeTarget}'}개 도전 시작\` : '목표 횟수 입력 후 도전 시작'}\n            accessibilityState={{ disabled: !firstTarget.trim() }}\n            disabled={!firstTarget.trim()}\n            onPress={startFirstChallenge}\n            style={({ pressed }) => [\n              O.targetCta,\n              !firstTarget.trim() && O.targetCtaDisabled,\n              pressed && firstTarget.trim() && O.targetCtaPressed,\n            ]}\n          >\n            <Text style={[O.targetCtaText, !firstTarget.trim() && O.targetCtaTextDisabled]}>\n              {firstTarget.trim() ? \`${'${firstChallengeTarget}'}개 도전 시작\` : '목표 횟수 입력 후 시작'}\n            </Text>\n            <Text style={[O.targetCtaArrow, !firstTarget.trim() && O.targetCtaTextDisabled]}>→</Text>\n          </Pressable>\n        </View>`,
  'target start CTA',
);

replaceOnce(
  'src/Onboarding.tsx',
  `  targetInputUnit: {\n    color: C.blue,\n    fontSize: 16,\n    lineHeight: 24,\n    fontWeight: '900',\n    marginLeft: 8,\n  },\n});`,
  `  targetInputUnit: {\n    color: C.blue,\n    fontSize: 16,\n    lineHeight: 24,\n    fontWeight: '900',\n    marginLeft: 8,\n  },\n  targetCtaWrap: { paddingTop: 12 },\n  targetCtaHint: {\n    color: '#777168',\n    fontSize: 11,\n    lineHeight: 17,\n    fontWeight: '700',\n    marginBottom: 9,\n  },\n  targetCta: {\n    minHeight: 64,\n    backgroundColor: C.blue,\n    borderWidth: 2,\n    borderColor: '#0D223F',\n    paddingHorizontal: 18,\n    flexDirection: 'row',\n    alignItems: 'center',\n    justifyContent: 'space-between',\n  },\n  targetCtaDisabled: {\n    backgroundColor: '#E7EBF0',\n    borderColor: '#8FA2BA',\n  },\n  targetCtaPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },\n  targetCtaText: {\n    color: '#FFFFFF',\n    fontSize: 18,\n    lineHeight: 24,\n    fontWeight: '900',\n    letterSpacing: -0.2,\n  },\n  targetCtaArrow: {\n    color: '#FFFFFF',\n    fontSize: 23,\n    lineHeight: 26,\n    fontWeight: '900',\n  },\n  targetCtaTextDisabled: { color: C.blue },\n});`,
  'target CTA styles',
);

console.log('Onboarding start CTA patch applied.');
