const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
function compile(file, imports = {}) {
  const mod = new Module(file);
  mod.require = name => imports[name] ?? require(name);
  mod._compile(ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, file);
  return mod.exports;
}
const energy = compile('src/features/avatar/energy.ts');
const calendar = compile('src/features/constancy/calendar.ts', { '../avatar/energy': energy });
const preview = compile('src/features/constancy/preview.ts', { './calendar': calendar });
const { dateKey, localDate, shiftDay, monthCells, shiftMonth, dayStatus, currentStreak, completedInMonth } = calendar;
function day(date, green, blue, goal = 100) { return { date, green, blue, goal }; }

test('calendar dates stay local across month and year boundaries without UTC shifting', () => {
  assert.equal(dateKey(new Date(2026, 9, 19, 23, 45)), '2026-10-19');
  assert.equal(dateKey(localDate('2026-10-19')), '2026-10-19');
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDay('2028-03-01', -1), '2028-02-29');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});

test('monthly calendar aligns Monday first and includes leap days and six-week months', () => {
  const february = monthCells('2028-02');
  assert.equal(february[0], null);
  assert.equal(february[1], '2028-02-01');
  assert.equal(february.filter(Boolean).length, 29);
  assert.equal(february.length % 7, 0);
  const august = monthCells('2026-08');
  assert.equal(august.length, 42);
  assert.equal(new Set(august.filter(Boolean)).size, 31);
  assert.equal(august[5], '2026-08-01');
});

test('streak counts the combined EV goal, including all-green and all-blue days', () => {
  const records = [day('2026-10-19', 40, 60), day('2026-10-18', 100, 0), day('2026-10-17', 0, 120), day('2026-10-16', 30, 20)];
  assert.equal(currentStreak('2026-10-19', records), 3);
  assert.equal(dayStatus('2026-10-19', '2026-10-19', records[0]), 'complete');
});

test('unfinished today preserves yesterday streak while missing or incomplete past days stop it', () => {
  const records = [day('2026-10-19', 40, 25), day('2026-10-18', 100, 0), day('2026-10-17', 0, 100), day('2026-10-15', 100, 0)];
  assert.equal(currentStreak('2026-10-19', records), 2);
  assert.equal(currentStreak('2026-10-19', records.filter(d => d.date !== '2026-10-19')), 2);
  assert.equal(currentStreak('2026-10-20', records), 0);
  assert.equal(currentStreak('2026-10-19', []), 0);
});

test('future energy cannot complete dates or monthly counts; past goals retain their daily snapshot', () => {
  const records = [day('2026-10-19', 50, 0, 50), day('2026-10-18', 100, 0, 200), day('2026-10-20', 1000, 0), day('2026-09-30', 100, 0)];
  assert.equal(dayStatus('2026-10-20', '2026-10-19', records[2]), 'future');
  assert.equal(completedInMonth('2026-10', '2026-10-19', records), 1);
  assert.equal(dayStatus('2026-10-18', '2026-10-19', records[1]), 'partial');
});

test('preview history has unique past dates and never invents today or future energy', () => {
  const records = preview.previewHistory('2026-01-03');
  assert.ok(records.every(record => record.date < '2026-01-03'));
  assert.equal(new Set(records.map(record => record.date)).size, records.length);
  assert.equal(currentStreak('2026-01-03', records), 3);
});
