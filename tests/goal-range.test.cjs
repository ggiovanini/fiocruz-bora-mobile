const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const mod = new Module('goalRange');
mod._compile(ts.transpileModule(readFileSync('src/features/goalRange.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, 'goalRange');
const { clampDailyGoal, goalAtPosition } = mod.exports;
test('goal selection constrains old values and produces integer EV within 15–240', () => {
  assert.equal(clampDailyGoal(1), 15);
  assert.equal(clampDailyGoal(500), 240);
  assert.equal(clampDailyGoal(100), 100);
  assert.equal(clampDailyGoal(99.8), 100);
  assert.equal(clampDailyGoal(NaN), 15);
});
test('slider reaches both limits and clamps dragging beyond either end', () => {
  assert.equal(goalAtPosition(0, 300), 15);
  assert.equal(goalAtPosition(300, 300), 240);
  assert.equal(goalAtPosition(-50, 300), 15);
  assert.equal(goalAtPosition(350, 300), 240);
  assert.equal(goalAtPosition(150, 300), 128);
  assert.ok(Number.isInteger(goalAtPosition(123.45, 300)));
});
