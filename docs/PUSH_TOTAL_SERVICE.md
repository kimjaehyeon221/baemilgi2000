# PUSH TOTAL — Service Plan v1

## One-line concept
**A push-up pedometer.** Start a set, put the iPhone in your front pocket, and let each push-up accumulate into one lifetime number.

## Problem
Push-ups are often done in short sets throughout the day, but most fitness apps assume a formal workout session. Manual logging adds friction, while camera counting requires setup, distance, and lighting.

## Product promise
- No routine planning.
- No camera setup.
- No social ranking.
- One exercise: standard push-up.
- One meaningful number: lifetime push-ups.

## Core loop
1. Open PUSH TOTAL.
2. Tap **Pocket Count**.
3. Put the iPhone in a front pants pocket during the 3-second countdown.
4. Do push-ups.
5. If no new rep is detected for 7 seconds, the set is saved automatically.
6. Lifetime and daily totals increase.

## Fallback loop
If Pocket Count is inaccurate or inconvenient, the user can log a set manually in one tap and edit any past entry.

## Why this is different
PUSH TOTAL is not a workout planner or a 100-push-up program. It treats push-ups like steps: small repetitions performed across daily life become a persistent lifetime total.

## MVP scope
### In
- Pocket sensor counting
- Automatic set finish
- Lifetime total
- Today / week / month totals
- Seven-day history
- Manual set logging
- Record correction and deletion
- Local persistence
- CSV-style share/export
- Sensor sensitivity adjustment

### Out
- Hindu push-ups and other variants
- Training programs
- Camera counting
- Accounts / cloud sync
- Leaderboards
- Ads / subscriptions
- Health or calorie claims

## Product principles
1. **Sessionless mindset** — the app records life, not workouts.
2. **Zero shame** — no streak loss or guilt mechanics.
3. **One number first** — lifetime total is the visual hero.
4. **Sensor, not surveillance** — motion data is processed on-device and not retained as raw sensor data.
5. **Honest accuracy** — Pocket Count is an estimate and every record is editable.

## Primary success metrics after launch
- First Pocket Count completion rate
- Percentage of Pocket sessions that users edit afterward
- Median number of logged sets per active day
- D7 return rate
- Ratio of Pocket vs Manual entries

## Validation gate
Before App Store submission, run at least 30 real sets across multiple pocket positions/speeds. If median absolute counting error is not acceptable, ship manual logging as the primary action and keep Pocket Count labeled Beta until tuned.
