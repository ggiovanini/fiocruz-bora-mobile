const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const model = new Module('energy');
model._compile(ts.transpileModule(readFileSync('src/features/avatar/energy.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, 'energy.cjs');
const { dailyEnergy } = model.exports;
test('either energy alone or a mixture can meet the same daily goal', () => {
  for (const [green, blue] of [[100, 0], [0, 100], [40, 60]]) {
    const result = dailyEnergy(green, blue, 100);
    assert.equal(result.complete, true);
    assert.equal(result.total, 100);
    assert.equal(result.progress, 100);
    assert.equal(result.greenProgress + result.blueProgress, 100);
  }
});
test('partial daily goal preserves both contributions and changing goal recomputes progress', () => {
  assert.deepEqual(dailyEnergy(40, 25, 100), { total: 65, remaining: 35, progress: 65, greenProgress: 40, blueProgress: 25, complete: false });
  assert.equal(dailyEnergy(40, 25, 50).complete, true);
  assert.equal(dailyEnergy(40, 25, 150).complete, false);
});
test('exceeding goal preserves EV and color proportions while bounding arc', () => {
  const result = dailyEnergy(150, 50, 100);
  assert.equal(result.total, 200);
  assert.equal(result.remaining, 0);
  assert.equal(result.progress, 100);
  assert.equal(result.greenProgress, 75);
  assert.equal(result.blueProgress, 25);
  assert.equal(dailyEnergy(0, 0, 100).progress, 0);
});
test('invalid energies or goals cannot produce a misleading arc', () => {
  for (const values of [[0,0,0], [-1,10,100], [10,NaN,100], [Infinity,0,100]]) {
    assert.throws(() => dailyEnergy(...values));
  }
});
