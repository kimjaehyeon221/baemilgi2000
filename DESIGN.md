# BAEMILGI 2000 — Final Product & Design System

## Product identity

BAEMILGI 2000 is a progressive Baemilgi / Dand conditioning app. It is not a generic fitness tracker and it is not an official judo or Brazilian jiu-jitsu rank system.

Core loop:

CURRENT BEST → NEXT QUEST → CHALLENGE → CLEAR or STOP → RECORD → CONTINUE TRAINING

The user starts from a baseline and progresses sequentially through 200 quests toward the symbolic endpoint of 2,000. A stopped attempt remains useful training data and belongs in the archive.

The product should feel like:

> A quiet digital training object that belongs inside a dojo.

## Martial-arts context

Baemilgi is also commonly described as the Hindu push-up. Korean judo home-training material has used the movement as conditioning. BAEMILGI 2000 borrows the material and record culture of martial arts — gi cloth, belts, tatami focus, repetition and training logs — without claiming to be an official federation programme.

Avoid martial-arts clichés: samurai, swords, dragons, anime, random kanji, cages, trophies, flames and fighter photography.

## Core palette

- **Gi White / Ecru:** `#FAF9F6` — everyday canvas, archive, results
- **Judo Blue:** `#1B365D` — structural accent, seams, selected state
- **Black:** `#121212` — Challenge / Training focus state
- **Muted Stamp Red:** `#B22222` — CLEARED archival stamp only

Red is not a general accent. The interface should stay calm enough that the CLEARED stamp remains meaningful.

## Five training chapters

The existing five quest ranges use an app-specific belt-colour chapter language inspired by the representative adult Brazilian jiu-jitsu belt sequence:

1. **WHITE / FOUNDATION** — Quest 001–100
2. **BLUE / RHYTHM** — Quest 101–130
3. **PURPLE / VOLUME** — Quest 131–150
4. **BROWN / ENDURANCE** — Quest 151–175
5. **BLACK / 2000** — Quest 176–200

These are **BAEMILGI TRAINING CHAPTERS**, not real judo/BJJ ranks, promotions, certificates or skill claims. Judo belt systems differ by federation and country, so the UI must never imply that completing a chapter awards a martial-arts belt.

Chapter colour is a quiet structural accent. It may appear on the Home chapter ribbon, current progression marker, small metadata and chapter guide. It must not recolour the whole app or turn progression into XP/rarity gamification.

See `docs/TRAINING_CHAPTERS.md` for the research rationale.

## Final visual rule: remove the boxes

The release UI uses **space first, lines second, containers last**.

- Large target numbers sit directly in open space.
- Do not put hero numbers inside bordered cards.
- Do not clip hero typography with `overflow: hidden`.
- Prefer whitespace and a 1pt hairline to a full rectangle.
- Dashed stitching is a rare material detail, not the default separator.
- Primary buttons can be solid bands; secondary actions should feel lighter and more open.
- Archive rows are ledger lines, not cards.
- Navigation uses a restrained active indicator, not filled tab boxes.

The user should first notice the target and action, and only later notice the gi/belt references.

## Typography

The final release uses only two type families:

- **Avenir Next** — brand, hero numbers, headings, buttons, body copy, archive titles and results.
- **Menlo** — QUEST codes, dates, set counters, compact metadata and status labels only.

Do not add Georgia, Avenir Next Condensed or an unassigned system/default face. Visual distinction should come mainly from scale, weight, spacing and role — not from adding more fonts.

Hero numbers use generous line height and restrained negative tracking so digits never look vertically clipped.

Rule: **one dominant number per active screen.**

## Spacing and strokes

- mobile edge: 16pt
- major separation: about 32pt
- ordinary separator: 1pt hairline
- reinforced structural line: 2pt only where semantically useful
- primary workout action: 56pt minimum height
- interactive target: at least 44×44pt hit area

Avoid arbitrary dense micro-spacing and repeated outlines.

## Home

Priority within roughly two seconds:

1. current Quest code
2. next target number
3. current best
4. current training chapter
5. nearby progression
6. START CHALLENGE
7. TRAINING
8. archive entry point

The app name is supporting chrome, not the hero.

Normal storage state stays silent. Only saving/error states surface storage feedback.

## Quest map

The Quest screen explains the five training chapters and shows the current neighbourhood plus meaningful future milestones. It does not dump 200 dense boxes onto the user.

Future quests are previews. The release progression is sequential: baseline chooses the starting point, then the active Challenge is `clearedLevel + 1`. Completed quests may be reopened as Training.

## Challenge / Training

Entering a workout should feel like stepping onto the mat:

- near-black background
- warm white number
- minimal Judo Blue structure
- no decorative card around the number
- no fake sensor counting
- no heart rate, calories, speed or unrelated metrics

Challenge displays the **TARGET**, not a live rep count. The user counts manually.

Actions:
- `COMPLETE`
- `STOP HERE`

Training uses one dominant number and transforms between REPS and REST without introducing a second dashboard.

## Result language

### Cleared

Target number → restrained muted-red `CLEARED` stamp → short heavy haptic.

No confetti, trophy or exaggerated level-up animation.

### Stopped

Never show punitive `FAILED`.

Use an objective record state:

TARGET 142
STOPPED AT 137
RECORDED

The stopped result is a training record, not a shame state.

## Archive

The archive is a ledger of repetition:

- date
- quest/drill code
- actual performance
- status

Rows use open ledger spacing and hairlines rather than cards. CLEARED may retain a small stamp treatment; other statuses should remain quieter.

Training records show actual `sets × repsPerSet`, not the quest target. Legacy records without detailed volume display a neutral dash rather than fabricated data.

## Release-grade UX rules

- Existing local data must survive visual redesigns.
- A storage read failure must never create a fresh state that can overwrite an archive.
- A physical effort is not finished in the UI until its record is persisted; failed saves expose retry.
- Rapid taps must not duplicate attempts or skip sets/rest.
- Timers use wall-clock timestamps so calls, lock screen and background suspension reconcile correctly.
- OTA updates must not force an in-session reload.
- Long histories remain reachable in batches.
- Onboarding supports back navigation before committing the baseline.
- Reduce Motion removes the spring/bounce part of stamp feedback.
- Giant numbers may cap Dynamic Type scaling to protect layout; ordinary readable text should remain accessible.
- Historical 2,000-Dand references are historical context, not an exercise prescription.
- Functional information must be true. Never import fake prototype metrics or exercises from design tools.

## Implementation rule

Stitch is a visual specification, not the production codebase. Expo / React Native remains the source of truth.

For every visual change:

1. preserve product logic and stored data,
2. follow this design system,
3. run core invariants,
4. run TypeScript validation,
5. validate the iOS bundle,
6. inspect on a real iPhone before release.

The next design decisions should be driven by real-device screenshots, not by generating another broad art direction.
