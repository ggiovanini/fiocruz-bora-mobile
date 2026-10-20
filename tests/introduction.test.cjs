const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const model = new Module('firstLaunch');
model._compile(ts.transpileModule(readFileSync('src/features/introduction/firstLaunch.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, 'firstLaunch.cjs');
const { INTRODUCTION_KEY, hasSeenIntroduction, completeIntroduction } = model.exports;

test('first launch and incomplete presentation do not skip the introduction', async () => {
  for (const value of [null, '', 'false', 'invalid']) {
    assert.equal(await hasSeenIntroduction({ getItem: async () => value }), false);
  }
});

test('completion persists across launches independently of profile and demo resets', async () => {
  const data = new Map([['bora:prototype:v1', 'old profile']]);
  const storage = { getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } };
  assert.equal(await hasSeenIntroduction(storage), false);
  await completeIntroduction(storage);
  assert.equal(data.get(INTRODUCTION_KEY), 'true');
  assert.equal(data.get('bora:prototype:v1'), 'old profile');
  data.delete('bora:prototype:v1');
  assert.equal(await hasSeenIntroduction(storage), true);
});

test('storage failures are surfaced so the screen can retry instead of claiming completion', async () => {
  const failure = new Error('storage unavailable');
  await assert.rejects(completeIntroduction({ setItem: async () => { throw failure; } }), failure);
  await assert.rejects(hasSeenIntroduction({ getItem: async () => { throw failure; } }), failure);
});
