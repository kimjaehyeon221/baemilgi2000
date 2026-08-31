# BAEMILGI 2000 — Release QA

This checklist treats BAEMILGI 2000 as a real iOS product, not a design prototype.

## P0 — Block release if any fail

- [ ] Reopening an easier completed quest for Training caps the plan base at that quest target.

- [ ] Old Training records without set metadata render a neutral dash instead of inventing a training volume.

- [ ] New Training archive rows show the actual set structure (for example 4×42), not the quest target.

- [ ] A local save failure on final Training set keeps the user on the final set so completion can be retried.

- [ ] A local save failure keeps the completed Challenge result on screen and offers SAVE AGAIN.

- [ ] Rapid double-taps on COMPLETE / COMPLETE SET cannot create duplicate records or skip sets.

- [ ] Future quest/milestone taps cannot skip progression.
- [ ] Baseline-derived starting level still skips irrelevant early quests correctly.

- [ ] Existing local records survive update, force quit, and normal relaunch.
- [ ] Simulated AsyncStorage read failure never opens an empty writable profile.
- [ ] Challenge complete saves exactly one record.
- [ ] STOP HERE never stores a stopped count equal to or above the target.
- [ ] Training completes the intended set count and stores one training record.
- [ ] Delete/edit recalculates progression correctly.
- [ ] No OTA-triggered reload occurs while a challenge/training session is active.
- [ ] Backgrounding for 10–30 seconds reconciles elapsed/rest time from wall clock.
- [ ] STOP HERE freezes challenge elapsed while entering the stopped-at count, and RETURN resumes it.
- [ ] Privacy and support pages open from the shipping build.
- [ ] App launches without a blank screen on the oldest supported iPhone size.

## P1 — UX / accessibility

- [ ] Home communicates next target, current best, Challenge and Training within ~2 seconds.
- [ ] Every actionable control has at least a 44pt hit region.
- [ ] VoiceOver reads Home hero as one meaningful metric, not disconnected numbers.
- [ ] Archive rows announce type, level, reps and status and are identified as editable buttons.
- [ ] Bottom tabs have readable labels and selected state.
- [ ] Large Text / Bold Text does not hide primary actions or critical instructions.
- [ ] Dark active screens explicitly use a light status bar; light screens use a dark status bar.
- [ ] Color is never the only carrier of cleared/stopped state.
- [ ] Pressed states are visible on custom buttons.

## P1 — Long-term product behavior

- [ ] More than 30 sessions remain reachable through “older records”.
- [ ] Export and restore round-trip the same record count and progression.
- [ ] App deletion risk is clearly communicated before the user relies on local-only history.
- [ ] A user can correct an accidental result from the archive.

## P2 — Brand consistency

- [ ] Gi White / Ink / Judo Blue / Stamp Red palette is consistent.
- [ ] Display metric, UI sans, data mono and archival serif roles are not mixed.
- [ ] `1911` is presented only as a historical Gama reference, never as BAEMILGI’s founding date.
- [ ] Challenge/Training use the dark Tatami focus state; Archive uses the training-ledger state.
- [ ] No prototype-only content survives: STREAK, fake percentages, fake exercise types, calories, BPM, auto rep count, calibration.

## Device pass before App Store submission

- [ ] Small iPhone (SE-class width)
- [ ] Standard iPhone
- [ ] Large/Max iPhone
- [ ] Light appearance and system Bold Text
- [ ] Larger Accessibility Text
- [ ] VoiceOver
- [ ] Airplane/offline mode for core local flows
- [ ] Incoming call / background / foreground during active workout
