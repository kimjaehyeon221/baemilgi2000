from pathlib import Path
p = Path('src/Onboarding.tsx')
text = p.read_text()
text = text.replace("motionReelShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#06101D38' }", "motionReelShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#06101D38' }")
p.write_text(text)
