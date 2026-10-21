const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const model = new Module('progression');
model._compile(ts.transpileModule(readFileSync('src/features/levels/progression.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, 'progression.cjs');
const { levelThreshold, levelProgress, projectInactivity, replenish } = model.exports;

test('levels use exact vitality boundaries and increasingly spaced milestones', () => {
  assert.equal(levelProgress(0).level, 1);
  assert.equal(levelProgress(99).level, 1);
  assert.equal(levelProgress(100).level, 2);
  assert.equal(levelProgress(599).level, 3);
  assert.equal(levelProgress(600).level, 4);
  assert.deepEqual(levelProgress(950), { vitality: 950, level: 4, floor: 600, next: 1000, remaining: 50, progress: 87.5 });
  assert.equal(levelProgress(1000).level, 5);
  assert.ok(levelThreshold(12) - levelThreshold(11) > levelThreshold(3) - levelThreshold(2));
});

test('first seven complete inactive days do not decay; day eight starts decay', () => {
  for (const days of [0, 1, 6, 7]) {
    const result = projectInactivity({ totalEarnedEV: 2000, vitality: 950, days });
    assert.equal(result.vitality, 950);
    assert.equal(result.loss, 0);
    assert.equal(result.chargeableDays, 0);
  }
  assert.equal(projectInactivity({ totalEarnedEV: 2000, vitality: 950, days: 8 }).vitality, 930);
  assert.equal(projectInactivity({ totalEarnedEV: 2000, vitality: 950, days: 8 }).chargeableDays, 1);
});

test('continuing an already inactive period only charges additional days, without another grace or double deduction', () => {
  assert.equal(projectInactivity({ totalEarnedEV: 2000, vitality: 950, inactiveDays: 5, days: 3 }).loss, 20);
  assert.equal(projectInactivity({ totalEarnedEV: 2000, vitality: 930, inactiveDays: 8, days: 1 }).loss, 20);
  const first = projectInactivity({ totalEarnedEV: 2000, vitality: 950, days: 8 });
  const second = projectInactivity({ totalEarnedEV: 2000, vitality: first.vitality, inactiveDays: first.inactiveDays, days: 22 });
  assert.equal(second.vitality, projectInactivity({ totalEarnedEV: 2000, vitality: 950, days: 30 }).vitality);
});

test('level falls only when the vitality crosses its lower boundary and cannot create debt', () => {
  const preserved = projectInactivity({ totalEarnedEV: 2000, vitality: 620, days: 8 });
  assert.equal(preserved.vitality, 600);
  assert.equal(preserved.level, 4);
  const dropped = projectInactivity({ totalEarnedEV: 2000, vitality: 620, days: 9 });
  assert.equal(dropped.vitality, 580);
  assert.equal(dropped.level, 3);
  const empty = projectInactivity({ totalEarnedEV: 2000, vitality: 50, days: 365 });
  assert.equal(empty.vitality, 0);
  assert.equal(empty.loss, 50);
  assert.equal(empty.level, 1);
});

test('any positive EV contribution ends inactivity regardless of color or completing a daily goal', () => {
  for (const [green, blue] of [[50, 0], [0, 50], [20, 30]]) {
    const result = replenish({ vitality: 950, totalEarnedEV: 2000, inactiveDays: 30 }, green, blue);
    assert.equal(result.vitality, 1000);
    assert.equal(result.level, 5);
    assert.equal(result.inactiveDays, 0);
  }
  assert.equal(replenish({ vitality: 950, totalEarnedEV: 2000, inactiveDays: 30 }, 1, 0).inactiveDays, 0);
  assert.equal(replenish({ vitality: 950, totalEarnedEV: 2000, inactiveDays: 30 }, 0, 0).inactiveDays, 30);
});

test('protected rest pvitalitys vitality and freezes the inactive-day counter in the simulated period', () => {
  const result = projectInactivity({ totalEarnedEV: 2000, vitality: 950, inactiveDays: 5, days: 30, protectedRest: true });
  assert.equal(result.vitality, 950);
  assert.equal(result.level, 4);
  assert.equal(result.loss, 0);
  assert.equal(result.inactiveDays, 5);
});

test('replenishment after decay can recover a level without rewriting the prior projection', () => {
  const projection = projectInactivity({ totalEarnedEV: 2000, vitality: 950, days: 30 });
  assert.equal(projection.vitality, 490);
  assert.equal(projection.level, 3);
  const recovery = replenish(projection, 0, 150);
  assert.equal(recovery.vitality, 640);
  assert.equal(recovery.level, 4);
  assert.equal(recovery.inactiveDays, 0);
  assert.equal(projection.vitality, 490);
});

test('invalid vitality, contributions and periods cannot produce misleading evolution', () => {
  for (const value of [-1, NaN, Infinity]) {
    assert.throws(() => levelProgress(value));
    assert.throws(() => replenish({ vitality: 950, totalEarnedEV: 2000 }, value, 0));
  }
  for (const days of [-1, 0.5, NaN, Infinity]) assert.throws(() => projectInactivity({ totalEarnedEV: 2000, vitality: 950, days }));
  assert.throws(() => projectInactivity({ totalEarnedEV: 2000, vitality: 950, inactiveDays: Number.MAX_SAFE_INTEGER, days: 1 }));
  assert.throws(() => levelThreshold(0));
});


test('inactivity can lower vitality and level without losing any accumulated EV', () => {
  const result = projectInactivity({ vitality: 950, totalEarnedEV: 2500, days: 30 });
  assert.equal(result.vitality, 490);
  assert.equal(result.level, 3);
  assert.equal(result.totalEarnedEV, 2500);
  const empty = projectInactivity({ ...result, days: 365 });
  assert.equal(empty.vitality, 0);
  assert.equal(empty.totalEarnedEV, 2500);
});

test('new earned EV increases lifetime total and vitality independently after a loss', () => {
  const before = projectInactivity({ vitality: 950, totalEarnedEV: 2500, days: 30 });
  const after = replenish(before, 50, 100);
  assert.equal(after.vitality, 640);
  assert.equal(after.totalEarnedEV, 2650);
  assert.equal(after.level, 4);
  assert.equal(before.totalEarnedEV, 2500);
  const later = projectInactivity({ ...after, days: 30 });
  assert.equal(later.totalEarnedEV, 2650);
  assert.equal(later.vitality, 180);
});

test('lifetime EV cannot be omitted or derived from vitality in projections', () => {
  assert.throws(() => projectInactivity({ vitality: 950, days: 30 }));
  assert.throws(() => replenish({ vitality: 950 }, 50, 0));
  assert.throws(() => projectInactivity({ vitality: 950, totalEarnedEV: -1, days: 30 }));
});
