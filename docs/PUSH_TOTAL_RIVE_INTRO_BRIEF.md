# PUSH TOTAL — Rive Launch Intro Production Brief

## Goal
Create a premium, short launch animation for the iOS app **PUSH TOTAL**. The scene should make opening the app feel like physically breaking through accumulated effort: a fist strikes the existing PUSH TOTAL masonry wall, bricks crack and break away, and the app/home surface is revealed behind it.

This is a **production asset for a React Native / Expo app**, not a social video. Final delivery must be an editable Rive project and developer-ready `.riv` file.

## Product visual system
Match the existing app rather than inventing a separate visual language.

- Background: `#F9F7F2`
- Surface: `#F0EEE9`
- High surface: `#E4E2DD`
- Ink: `#121212`
- Muted: `#5F5E5E`
- Brick: `#A64B35`
- Brick dark: `#873420`
- Brick light: `#B45A42`
- Masonry line: `#DCC1BA`

The fist should be graphic and iconic rather than photorealistic. Avoid comic-book explosion typography, flames, exaggerated superhero effects, glossy 3D rendering, or stock-game aesthetics. The target mood is **physical, restrained, brutal, tactile, premium**.

## Motion concept
Target total duration: **1.1–1.4 seconds**. Do not loop.

Suggested timing:

1. `0.00–0.20s` — masonry wall is already present; almost still, slight visual tension only.
2. `0.20–0.43s` — fist enters quickly from lower-right / forward diagonal. Add a tiny anticipation/compression before impact.
3. `~0.45s` — impact. One central brick area cracks. This is the exact haptic/sound synchronization point.
4. `0.45–0.85s` — 6–12 designed brick fragments separate with believable weight. Small dust/debris accents are acceptable but should stay graphic and clean. Add a very short visual shock, not prolonged camera shake.
5. `0.75–1.10s` — opening in wall reveals the PUSH TOTAL background/home surface underneath.
6. `1.10–1.40s` — debris settles enough for a seamless app transition. The ending composition should visually match the app background so there is no flash/cut.

## Composition
- Design responsively for portrait iPhone screens.
- Suggested authoring artboard reference: `390 × 844`, but use Rive layout/responsive constraints rather than relying on fixed pixels.
- Important action must remain safe across different iPhone aspect ratios.
- The wall should feel like the same masonry system used in the app.
- The final frame should allow the React Native home screen to replace the Rive view without an obvious visual seam.

## Required Rive architecture
Use the current Rive runtime architecture, not a flattened video.

### Naming contract
- Artboard: `LaunchIntro`
- State Machine: `LaunchIntro`
- View Model: `LaunchIntroModel`
- Numeric property: `phase`

`phase` contract:
- `0` = intro started / pre-impact
- `1` = impact moment; app triggers haptic + impact sound once
- `2` = animation visually complete; app removes intro view and reveals home

Prefer Rive Data Binding / View Model changes for runtime communication rather than deprecated General Events.

### Playback behavior
- Auto-start once when the view is shown.
- No loop.
- State machine should settle at the final frame.
- Replaying/resetting the state machine must reliably reproduce the same sequence.

## Asset requirements
- Prefer vector shapes and Rive-native geometry.
- Avoid large embedded bitmap textures.
- If raster assets are unavoidable, keep them minimal and optimized.
- Target a small `.riv` file; ideally under ~1–2 MB for this intro.
- No external network dependency should be required for the core animation.
- Do not embed the final impact sound into the core asset; the app will synchronize audio/haptics at `phase = 1`.

## Accessibility / fallback
Provide a clean static final or near-impact frame that can be used when Reduce Motion is enabled or if the Rive asset fails to load.

The full intro must never trap the user. The app will have its own timeout/fallback to Home.

## Deliverables
Required:

1. Editable Rive project/file
2. Production `.riv` file
3. Artboard / State Machine / View Model names exactly matching the contract above
4. `phase` property verified at 0 → 1 → 2
5. Short preview MP4/GIF for visual review only
6. Any source vector artwork used for the fist/brick components
7. Confirmation that the `.riv` runs correctly in the Rive React Native runtime

Do **not** deliver only MP4, GIF, After Effects, or flattened Lottie output.

## Technical target
PUSH TOTAL currently uses:

- Expo SDK 57
- React Native 0.86.x
- iOS only
- EAS Build / EAS Update

Integration is planned with the new Rive React Native runtime (`@rive-app/react-native`) and `react-native-nitro-modules`. Local `.riv` files will be loaded from the app bundle/Metro so later animation-only revisions can be shipped through OTA updates without rebuilding the native binary.

## Acceptance criteria
The animation is accepted when:

- It feels intentional at normal phone size, not like a generic template.
- Impact reads instantly without needing text.
- The visual palette matches PUSH TOTAL.
- There is a clear `phase = 1` impact marker and `phase = 2` completion marker.
- It plays smoothly once and transitions cleanly into the app.
- The production `.riv` is editable and developer-ready.
