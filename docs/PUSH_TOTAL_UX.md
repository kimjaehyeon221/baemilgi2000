# PUSH TOTAL — UX Spec v1

## Experience target
The user should understand the app in under 10 seconds and record a real set with minimal phone handling.

## Information architecture
### Home
- Lifetime push-up total
- Today total + number of sets
- Pocket Count primary action
- Manual logging secondary action
- History entry point

### Pocket session
- 3-second countdown
- Clear instruction to put the phone in the front pocket
- One start haptic
- Live counter
- Automatic save after 7 seconds without a new detected rep
- Manual finish/cancel control

### History
- Week/month summaries
- Seven-day activity bars
- Recent entries with source (Pocket / Manual)
- Edit/delete
- Pocket sensitivity
- Export
- Privacy policy and delete-all-data action

## Key flows
### First launch
Open → read value proposition → optionally enter prior lifetime total → Start.
Motion permission is *not* requested on launch. It is requested only when Pocket Count is first used.

### Pocket Count
Home → Pocket Count → system motion permission if needed → 3-second countdown → start haptic → counting → 7-second inactivity → save → return Home with +N confirmation.

### Manual correction
History → Recent entry → Edit → change count → Save.
This is a first-class flow because phone/pocket placement can affect sensor accuracy.

### Manual logging
Home → Manual log → preset 10/20/30/50 or custom amount → save → Home.

## Friction rules
- No account creation.
- No mandatory goal.
- No workout start/finish form.
- No exercise-type chooser in v1.
- No confirmation dialog for normal manual logging.
- Permission prompts appear only at the moment the related feature is used.

## Error handling
- Motion sensor unavailable: explain that Pocket Count requires a real iPhone and keep manual logging available.
- Motion permission denied: explain why it is needed; app remains usable manually.
- Zero reps detected: do not create a record.
- Sensor over/under-count: edit is always available from History.
- Storage failure: show an alert instead of silently losing records.

## Accessibility
- High-contrast large lifetime number.
- Minimum ~44pt interactive targets.
- Essential state is communicated with text, not color alone.
- Motion effects are decorative; logging remains usable without them.
- Avoid tiny gesture-only interactions.

## Pre-release usability checks
1. Can a new user explain what Pocket Count does after seeing Home once?
2. Can a user start counting without reading a help page?
3. Can a user recover from a wrong count in under 10 seconds?
4. Is manual logging still obvious if motion permission is denied?
5. Is every destructive action confirmed?
