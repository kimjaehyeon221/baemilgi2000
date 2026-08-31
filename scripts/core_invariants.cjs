'use strict';

const assert = require('node:assert/strict');
const {
  TARGETS,
  levelForReps,
  safeState,
  targetForLevel,
  trainingPlan,
} = require('../.tmp-core/core.js');

assert.equal(TARGETS.length, 201, 'TARGETS must contain indexes 0...200');
assert.equal(levelForReps(0), 0, '0 reps must map to level 0');

const milestones = new Map([
  [1, 1],
  [100, 100],
  [130, 250],
  [150, 500],
  [175, 1000],
  [200, 2000],
]);

for (const [level, reps] of milestones) {
  assert.equal(targetForLevel(level), reps, `level ${level} milestone changed`);
}

for (let level = 1; level <= 200; level += 1) {
  const target = targetForLevel(level);
  assert.ok(Number.isInteger(target) && target > 0 && target <= 2000, `invalid target at level ${level}`);
  assert.equal(levelForReps(target), level, `target must map back to the same level at ${level}`);
  if (level > 1) {
    assert.ok(target > targetForLevel(level - 1), `targets must strictly increase at level ${level}`);
  }

  const plan = trainingPlan(target, target);
  assert.ok(plan.sets >= 1 && plan.sets <= 10, `invalid set count at level ${level}`);
  assert.ok(plan.reps >= 1 && plan.reps <= target, `training reps exceed target at level ${level}`);
  assert.ok(plan.rest >= 0 && plan.rest <= 600, `invalid rest at level ${level}`);
}

const iso = '2026-08-31T00:00:00.000Z';
const normalized = safeState({
  onboarded: true,
  pushupMax: null,
  firstBaemilgiMax: 0,
  clearedLevel: 0,
  selectedLevel: 200,
  sessions: [
    { at: iso, type: 'challenge', level: 5, target: 1, success: true, seconds: 20, actualReps: 1 },
    { at: iso, type: 'challenge', level: 999, target: 1, success: true, seconds: 10, actualReps: 1 },
    { at: 'not-a-date', type: 'challenge', level: 9, target: 9, success: true, seconds: 10, actualReps: 9 },
  ],
});

assert.equal(normalized.sessions.length, 1, 'malformed sessions must be rejected');
assert.equal(normalized.sessions[0].level, 5);
assert.equal(normalized.sessions[0].target, 5, 'session target must be canonical for its level');
assert.equal(normalized.clearedLevel, 5, 'progress must be recomputed from valid records');
assert.equal(normalized.selectedLevel, 6, 'release progression must remain sequential');

const stopped = safeState({
  onboarded: true,
  firstBaemilgiMax: 0,
  sessions: [
    { at: iso, type: 'challenge', level: 10, target: 999, success: false, seconds: 30, actualReps: 999 },
  ],
}).sessions[0];
assert.equal(stopped.target, 10);
assert.equal(stopped.actualReps, 9, 'stopped reps must stay below canonical target');

console.log('BAEMILGI core invariants: OK');
