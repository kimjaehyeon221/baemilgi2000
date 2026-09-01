from pathlib import Path

p = Path('src/Onboarding.tsx')
text = p.read_text()

start = text.index('function IntroLaunch(')
end = text.index('\nexport function Onboarding', start)
new_intro = '''function IntroLaunch({ onContinue }: { onContinue: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onContinue();
  };

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1750,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) finish();
    });
    const fallback = setTimeout(finish, 1900);
    return () => {
      clearTimeout(fallback);
      animation.stop();
    };
  }, [progress]);

  const logoOpacity = progress.interpolate({
    inputRange: [0, 0.15, 0.36, 0.48],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const logoScale = progress.interpolate({
    inputRange: [0, 0.2, 0.48],
    outputRange: [0.86, 1, 0.92],
    extrapolate: 'clamp',
  });
  const giOpacity = progress.interpolate({
    inputRange: [0.28, 0.45, 0.7, 0.8],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const giScale = progress.interpolate({
    inputRange: [0.28, 0.54, 0.8],
    outputRange: [0.9, 1.03, 0.95],
    extrapolate: 'clamp',
  });
  const reelOpacity = progress.interpolate({
    inputRange: [0.48, 0.58, 0.94, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const reelX = progress.interpolate({
    inputRange: [0.5, 1],
    outputRange: [88, -214],
    extrapolate: 'clamp',
  });
  const titleOpacity = progress.interpolate({
    inputRange: [0.7, 0.84, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={O.brandIntroRoot}>
      <StatusBar barStyle="light-content" />
      <Pressable
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="브랜드 인트로, 탭하여 건너뛰기"
        style={O.brandIntroPress}
      >
        <View style={O.brandIntroTop}>
          <Text style={O.brandIntroCode}>BAEMILGI / 2000</Text>
          <Text style={O.brandIntroSkip}>TAP TO SKIP</Text>
        </View>

        <View style={O.brandIntroStage}>
          <Animated.View style={[O.brandLogoLockup, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={O.brandLogoBar} />
            <Text style={O.brandLogoWord}>BAEMILGI</Text>
            <Text style={O.brandLogoNumber}>2000</Text>
          </Animated.View>

          <Animated.View style={[O.giMark, { opacity: giOpacity, transform: [{ scale: giScale }] }]}>
            <View style={O.giShoulder} />
            <View style={[O.giLapel, O.giLapelLeft]} />
            <View style={[O.giLapel, O.giLapelRight]} />
            <View style={O.giBelt} />
            <Text style={O.giLabel}>DOJO TRAINING</Text>
          </Animated.View>

          <Animated.View style={[O.motionReel, { opacity: reelOpacity, transform: [{ translateX: reelX }] }]}>
            {FORM_ARTWORK.map((source, index) => (
              <View key={index} style={O.motionReelFrame}>
                <Image source={source} style={O.motionReelImage} resizeMode="cover" accessibilityIgnoresInvertColors />
                <View style={O.motionReelShade} />
                <Text style={O.motionReelIndex}>0{index + 1}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <Animated.View style={[O.brandIntroBottom, { opacity: titleOpacity }]}>
          <Text style={O.brandIntroTitle}>한 번씩, 2,000까지.</Text>
          <Text style={O.brandIntroSub}>HINDU PUSH-UP · QUEST 001—200</Text>
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}
'''
text = text[:start] + new_intro + text[end:]

styles_start = text.index('  launchTop: {')
styles_end = text.index('  guideBody:', styles_start)
new_styles = '''  brandIntroRoot: { flex: 1, backgroundColor: '#111317' },
  brandIntroPress: { flex: 1, paddingHorizontal: 22, paddingBottom: 24, overflow: 'hidden' },
  brandIntroTop: { height: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#34383E' },
  brandIntroCode: { color: '#FAF9F6', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  brandIntroSkip: { color: '#777D86', fontFamily: 'Menlo', fontSize: 8, fontWeight: '900', letterSpacing: 1.15 },
  brandIntroStage: { flex: 1, minHeight: 520, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandLogoLockup: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  brandLogoBar: { width: 54, height: 5, backgroundColor: '#1B365D', marginBottom: 18 },
  brandLogoWord: { color: '#FAF9F6', fontFamily: 'Menlo', fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  brandLogoNumber: { color: '#FAF9F6', fontFamily: 'Avenir Next', fontSize: 76, lineHeight: 84, fontWeight: '800', letterSpacing: -3, marginTop: 2 },
  giMark: { position: 'absolute', width: 210, height: 230, alignItems: 'center', justifyContent: 'center' },
  giShoulder: { position: 'absolute', top: 25, width: 158, height: 162, backgroundColor: '#F3F1EA', borderRadius: 9 },
  giLapel: { position: 'absolute', top: 36, width: 34, height: 126, backgroundColor: '#DDD8CE', borderRadius: 4 },
  giLapelLeft: { left: 75, transform: [{ rotate: '30deg' }] },
  giLapelRight: { right: 75, transform: [{ rotate: '-30deg' }] },
  giBelt: { position: 'absolute', top: 155, width: 178, height: 20, backgroundColor: '#1B365D' },
  giLabel: { position: 'absolute', bottom: 16, color: '#AAB4C1', fontFamily: 'Menlo', fontSize: 9, fontWeight: '900', letterSpacing: 1.25 },
  motionReel: { position: 'absolute', left: 0, right: -240, height: 236, flexDirection: 'row', gap: 10, alignItems: 'center' },
  motionReelFrame: { width: 206, height: 230, overflow: 'hidden', backgroundColor: '#0A0B0D', position: 'relative' },
  motionReelImage: { width: '100%', height: '100%' },
  motionReelShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#06101D38' },
  motionReelIndex: { position: 'absolute', left: 12, bottom: 10, color: '#FAF9F6', fontFamily: 'Menlo', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  brandIntroBottom: { minHeight: 104, borderTopWidth: 1, borderTopColor: '#34383E', justifyContent: 'center' },
  brandIntroTitle: { color: '#FAF9F6', fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  brandIntroSub: { color: '#7F8FA4', fontFamily: 'Menlo', fontSize: 9, fontWeight: '900', letterSpacing: 1.05, marginTop: 8 },
'''
text = text[:styles_start] + new_styles + text[styles_end:]

# The old vibration import belonged only to the removed interaction screen.
text = text.replace('  Vibration,\n', '')

p.write_text(text)
