# BAEMILGI 2000 — Product & Design Direction

## 1. Product identity

BAEMILGI 2000 is not a generic fitness tracker. It is a progressive Baemilgi / Dand conditioning app whose identity is rooted in the material culture of judo and jiu-jitsu training.

The product loop is:

CURRENT BEST → NEXT QUEST → CHALLENGE → CLEAR or STOP → RECORD → CONTINUE TRAINING

The user starts from their current maximum continuous repetitions and progresses through 200 quests toward the symbolic endpoint of 2,000.

A stopped attempt is not treated as meaningless failure. The stopping point is useful training data and becomes part of the permanent record.

## 2. Brand principle

The app should feel like:

> A digital training object that belongs inside a dojo.

The brand should communicate repetition, discipline, accumulated practice, tactile training materials, and quiet toughness.

Avoid generic gym / HIIT / CrossFit / futuristic performance-dashboard aesthetics.

Avoid martial-arts clichés such as samurai, swords, dragons, anime, meaningless kanji, MMA cages, flames, trophies, or aggressive fighter imagery.

## 3. Material language

The UI should borrow from the physical construction and color of martial-arts training equipment rather than literally illustrating uniforms on every screen.

### Core colors

- **Gi White / Ecru:** `#FAF9F6`
- **Judo Blue:** `#1B365D`
- **Black / Active Surface:** `#121212`
- **Muted Stamp Red:** `#B22222`

Roles:

- Gi White = everyday state, records, archive, calm interface
- Judo Blue = structure, selection, belt/seam detail, controlled emphasis
- Black = focused challenge/training state
- Stamp Red = verified/cleared archival mark only

No fluorescent lime or neon performance accent.

## 4. Gi construction as interface geometry

Translate gi construction into UI primitives:

- reinforced seams → dividers
- stitching → dashed or subtle textile borders
- cloth labels → metadata containers
- folded fabric proportions → layout structure
- belt proportions → long horizontal actions / progression objects
- ink and stamps → archived training records

The user should feel the physical construction before consciously noticing it.

## 5. Quest Band / belt-inspired progression

The 200-quest journey may be represented through a belt-like textile object.

The Quest Band can accumulate:

- stitched marks
- wrapped dark segments / stripe-like marks
- end-tab details
- subtle textile changes
- chapter color changes when appropriate

Important: this is an app-specific training object. It must **not** claim to represent the user's official judo or jiu-jitsu rank.

Do not label quest milestones as real belt ranks. Belt colors and stripe/wrap language are visual inspiration, not certification.

## 6. Screen-state system

### Home / Result / Archive — GI & INK

- primarily Gi White
- black ink typography
- restrained Judo Blue structural accents
- textile/seam/belt language
- archive marks and stamps where meaningful

The hero on Home is the next target number, not the brand name or dashboard chrome.

### Active Challenge / Active Training — TATAMI / BLACK GI MODE

- near-black background
- warm white typography
- restrained Judo Blue
- almost no decoration
- one dominant number per screen

Starting a challenge should feel like stepping onto the mat: a clear transition from ordinary state into focused effort.

### Archive — DOJO TRAINING LOG

- Gi White / paper-textile feel
- dates, quest numbers, attempts, cleared/stopped status
- restrained stamps
- tactile ledger / training-log composition

The archive should become more meaningful and visually richer after months or years of use.

## 7. Challenge behavior

The app does **not** automatically count reps.

During Challenge:

- the large number is the **TARGET**
- elapsed time is secondary
- actions are **COMPLETE** and **STOP HERE**

Do not invent sensor counting, heart rate, calories, rep speed, or other fake metrics.

## 8. Success and stopped-at feedback

### Cleared

The signature feedback is a restrained physical record-stamp interaction:

142 → CLEARED → muted-red `CLEARED` stamp lands with a short, heavy tactile feeling.

No confetti, trophy, or exaggerated game celebration.

### Stopped

Do not show a punitive red `FAILED` state.

Use an objective record state such as:

TARGET 142
STOPPED AT 137
RECORDED.

The design should communicate that the attempt matters and belongs in the training history.

## 9. Training state

Training should remain visually focused and use one dominant number at a time.

Example:

SET 3 / 5
25 REPS
COMPLETE SET

Then the same layout transforms into:

REST
00:45
SKIP REST

Do not add unrelated exercises, heavy-bag work, sparring categories, or other features invented by design tools.

## 10. Typography and hierarchy

The Stitch master uses four deliberate roles, and the app must preserve those roles consistently across every screen:

- **Display metric** — Stitch `Anton` → iOS QA build `Avenir Next Condensed`: hero targets, reps, timers when dominant, large numeric inputs.
- **UI / action** — Stitch `Hanken Grotesk` → iOS QA build `Avenir Next`: body copy, buttons, navigation, ordinary interface headings.
- **Data / metadata** — Stitch `JetBrains Mono` → iOS QA build `Menlo`: QUEST codes, dates, labels, statuses, set counters, archive columns.
- **Archival** — Stitch `Source Serif 4` → iOS QA build `Georgia`: training-log titles, recorded-result headlines, restrained editorial moments.

Do not introduce an unassigned system/default font inside designed screens. A text element must belong to one of these four roles. Do not use the condensed display face for buttons or body copy, and do not use the archival serif for active workout metrics.

Rule: **one dominant number per active screen.**

### 10.1 Spacing and stroke lock

The mobile implementation follows the Stitch rhythm rather than screen-by-screen arbitrary spacing:

- **Seam:** 16pt — default mobile edge and small vertical unit
- **Fold:** 32pt — major section separation / entry into a focused canvas
- **Stitch:** 2pt — reinforced active/structural line
- **Hairline:** 1pt — ledger rules, ordinary separators
- **Primary action height:** 56pt

Prefer multiples of 8/16/32. Do not introduce one-off 18/22/27/31pt layout gaps unless a visual correction has a specific reason. Home, Quest, Archive, Challenge, Training and onboarding should feel cut from the same gi pattern.


## 11. UX principles

- User should understand the next action within roughly two seconds.
- Home prioritizes next target, current best, Challenge, and Training.
- Do not expose all 200 quests as dense clutter on Home.
- Failure/stopping points remain editable and valuable.
- Existing local records and progression logic must survive visual redesigns.
- Avoid adding features merely because a generated design contains them.

## 12. Implementation rule

Stitch output is a visual specification, not a production codebase.

When implementing in Expo / React Native:

1. preserve existing app logic and stored user data,
2. translate useful colors, spacing, hierarchy, states, and motion cues,
3. remove web-only behavior such as hover states and desktop navigation,
4. remove generated fake content/features,
5. test on a real iPhone before considering the visual direction final.

## 13. Current release intent

The current redesign is a real-device validation pass. If the Gi White / Judo Blue / Black direction feels correct on iPhone, continue refining tactile details such as the Quest Band, stamp motion, haptics, and archive texture rather than returning to broad art-direction exploration.


## 13. Release-grade interaction rules

- Functional information must be true. Never copy fake `STREAK`, calories, heart rate, calibration, percentage, unrelated drills or other prototype-only metrics into production.
- Primary controls should provide at least a 44×44pt hit region; primary workout actions target 56pt height.
- Long-term records must remain reachable. The archive loads older entries in batches instead of silently truncating history.
- A storage read failure must never fall through into a fresh state that can overwrite an existing archive.
- OTA updates must never force an in-session reload. Updates may download on launch and become active on a later launch.
- Onboarding must support going backward before committing the baseline.
- Historical references must be labeled as historical references. Never imply that BAEMILGI 2000 was established in 1911.
- Decorative progression bands and micro-labels must not create noisy VoiceOver output. Group meaningful metrics and label editable archive rows as actions.
- The visual language may be technical, but important operational text should remain readable on a real iPhone. Tiny prototype labels are not production UI.


### Sequential progression lock

The release build uses sequential quests. The user's baseline/current max determines the starting point, and after that the only active challenge is `clearedLevel + 1` (or 200 after completion). Future quest cells and milestone rows are previews, not shortcuts. Completed levels may be reopened as training.

Why: the product promise is a durable training path, not a level picker. Skilled users already skip irrelevant early stages through the onboarding baseline, so arbitrary future-jump controls add inconsistency without meaningful utility.


### Interruption-safe timers

Challenge elapsed time, Training elapsed time, and rest countdowns are derived from wall-clock timestamps rather than assuming JavaScript executes once per second. If iOS suspends the app during an incoming call, lock screen, app switch, or background interval, the next foreground tick reconciles to real elapsed time. The STOP HERE edit sheet intentionally pauses challenge elapsed time; returning to the quest resumes from that frozen value.


### Persistence is part of the workout flow

A completed physical effort is not considered finished in the UI until its local record is safely persisted. Challenge keeps the stamped result in memory and exposes `SAVE AGAIN` if local storage fails. Training stays on the final set if its completion record fails. Rapid taps are guarded so a physical double-tap cannot create duplicate attempts, skip sets, or immediately skip a newly-entered rest state.
