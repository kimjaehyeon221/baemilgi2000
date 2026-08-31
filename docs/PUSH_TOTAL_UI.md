# PUSH TOTAL — UI / Motion System v1

## Design direction
**Quiet utility + kinetic number + native glass.** The app should feel like an instrument, not a fitness dashboard.

## Visual hierarchy
1. Lifetime total — biggest element on Home.
2. Pocket Count — primary action.
3. Today total — contextual feedback.
4. Manual logging — available but intentionally secondary.
5. History/settings — tertiary.

## Palette
- Warm background: `#F4F2EC`
- Primary ink: `#10100F`
- Muted text: `#77746D`
- Electric accent: `#315CFF`
- Soft blue ambient field: `#DDE5FF`
- Soft mint ambient field: `#DCEFE6`

## Typography
- Heavy, tabular numerals for counts.
- Small uppercase labels with increased tracking for instrument-like hierarchy.
- Korean body copy stays compact and conversational.

## Liquid Glass
On iOS 26+, use Expo `GlassView` for floating action surfaces. On older supported iOS versions, fall back to an opaque translucent card.

Rules:
- Glass is reserved for controls, not every piece of content.
- Do not animate parent opacity around GlassView.
- Use warm/soft ambient shapes beneath glass so the material is perceptible.
- Content remains readable if transparency/reduce-motion accessibility settings alter the effect.

## Interaction system
### Lifetime number
When a set is saved, the lifetime number performs a short spring pulse. The number itself is the reward.

### Pocket button
Press compresses slightly rather than fading. On iOS 26 the Glass surface remains interactive.

### Pocket session
- Dark instrument screen.
- One heavy haptic marks counting start.
- Each detected rep creates a subtle visual pulse and number spring.
- Success haptic occurs only after sensors have stopped, preventing haptic vibration from contaminating the active sensor signal.

### Confirmation
A compact floating `+N · Pocket` / `+N · 직접 기록` toast appears after saving.

## What not to add
- Confetti after ordinary sets
- Gamified streak flames
- Dense dashboard cards
- Exercise illustrations on every screen
- Neon gradients everywhere
- Excessive glass surfaces

## UI review checklist
- Test iOS 26 Liquid Glass and pre-iOS-26 fallback.
- Test with large totals (999,999 and 1,000,000+).
- Test Korean text truncation on smaller iPhones.
- Check Reduce Transparency / Reduce Motion behavior.
- Verify button targets remain comfortable with one hand.
