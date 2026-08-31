# PUSH TOTAL — iPhone Quick Test

Use this before App Store submission.

## Pocket placement
- Standard front pants pocket.
- Keep the iPhone fully inside the pocket.
- Use the same pocket for the first comparison set.

## First 9 sets
| Set | Actual reps | Pace | Sensitivity | Detected | Error |
|---|---:|---|---|---:|---:|
| 1 | 10 | normal | normal |  |  |
| 2 | 10 | normal | normal |  |  |
| 3 | 10 | normal | normal |  |  |
| 4 | 15 | slow | normal |  |  |
| 5 | 15 | normal | normal |  |  |
| 6 | 15 | fast | normal |  |  |
| 7 | 20 | slow | normal |  |  |
| 8 | 20 | normal | normal |  |  |
| 9 | 20 | fast | normal |  |  |

## Tuning rule
- Consistently under-counting: switch to **민감** and repeat 3 × 10.
- Consistently over-counting: switch to **둔감** and repeat 3 × 10.
- Wildly inconsistent counts: do not hide it with sensitivity tuning. Revisit the detector.

## Release decision
Pocket Count can remain the main CTA if normal-use results are stable enough that users rarely need to edit a set. If results depend heavily on pocket, cadence, or phone orientation, label Pocket Count as Beta or make Manual the primary v1 action.

## Important false-positive checks
Before release, verify that these do not create convincing push-up sets:
- Walking 20–30 seconds with the phone in the same pocket.
- Sitting down / standing up several times.
- Climbing one flight of stairs.
- Deliberately shaking the phone by hand.

A pedometer-like product must distinguish push-up repetitions from ordinary pocket movement, not merely count repeated acceleration peaks.
