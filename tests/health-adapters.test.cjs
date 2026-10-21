const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
function load(file, imports = {}) {
  const compiled = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = new Module(file);
  mod.require = (name) => {
    if (name in imports) return imports[name];
    throw Error(`Unexpected import ${name}`);
  };
  mod._compile(compiled, file);
  return mod.exports;
}
const model = load("src/health/model.ts");
const days = model.lastSevenDays(new Date("2026-10-01T12:00:00Z"));
const exercise = {
  WALKING: 1,
  RUNNING: 2,
  RUNNING_TREADMILL: 3,
  BIKING: 4,
  SWIMMING_POOL: 5,
  SWIMMING_OPEN_WATER: 6,
  YOGA: 7,
};
const record = (id) => ({
  metadata: { id, dataOrigin: "synthetic.source" },
  startTime: "2026-10-01T10:00:00Z",
  endTime: "2026-10-01T10:30:00Z",
  exerciseType: 1,
  notes: "Must not be retained",
});
test("Android requests only workouts and reads every workout page", async () => {
  let requested;
  let pages = [];
  const hc = {
    ExerciseType: exercise,
    initialize: async () => true,
    requestPermission: async (p) => (requested = p),
    getGrantedPermissions: async () => [
      { accessType: "read", recordType: "ExerciseSession" },
    ],
    aggregateRecord: async () => {
      throw Error("Steps permission denied");
    },
    readRecords: async (type, options) => {
      pages.push(options.pageToken);
      return options.pageToken
        ? { records: [record("b")] }
        : { records: [record("a")], pageToken: "next" };
    },
  };
  const adapter = load("src/health/adapter.android.ts", {
    "./model": model,
    "react-native-health-connect": hc,
  }).default;
  await adapter.requestAccess();
  assert.deepEqual(requested, [
    { accessType: "read", recordType: "ExerciseSession" },
  ]);
  const result = await adapter.read(days);
  assert.deepEqual(pages, [undefined, "next"]);
  assert.equal(result.workouts.length, 2);
  assert.equal(result.steps.length, 0);
  assert.equal(result.workouts[0].durationMinutes, 30);
  assert.equal(result.workouts[0].notes, undefined);
});
test("Android does not read steps even when the system has an old steps permission", async () => {
  let call = 0;
  const hc = {
    initialize: async () => true,
    getGrantedPermissions: async () => [
      ],
    aggregateRecord: async () =>
      ++call === 1
        ? { COUNT_TOTAL: 0, dataOrigins: [] }
        : { COUNT_TOTAL: 0, dataOrigins: ["synthetic"] },
    readRecords: async () => {
      throw Error("Workouts denied");
    },
  };
  const adapter = load("src/health/adapter.android.ts", {
    "./model": model,
    "react-native-health-connect": hc,
  }).default;
  const result = await adapter.read(days);
  assert.equal(call, 0);
  assert.equal(result.steps.length, 0);
  assert.equal(result.workouts.length, 0);
});
test("Android repeated page token fails instead of returning an incomplete history", async () => {
  const hc = {
    ExerciseType: exercise,
    initialize: async () => true,
    getGrantedPermissions: async () => [
      { accessType: "read", recordType: "ExerciseSession" },
    ],
    readRecords: async () => ({ records: [record("a")], pageToken: "same" }),
  };
  const adapter = load("src/health/adapter.android.ts", {
    "./model": model,
    "react-native-health-connect": hc,
  }).default;
  await assert.rejects(adapter.read(days), /Incomplete pagination/);
});
test("iOS authorizes only workouts, never queries steps and normalizes active duration", async () => {
  let requested;
  let options;
  let calls = 0;
  const hk = {
    requestAuthorization: async (p) => (requested = p),
    WorkoutActivityType: {
      walking: 1,
      running: 2,
      cycling: 3,
      swimming: 4,
      yoga: 5,
    },
    queryStatisticsForQuantity: async (type, stats) => {
      assert.equal(type, "HKQuantityTypeIdentifierStepCount");
      assert.deepEqual(stats, ["cumulativeSum"]);
      return ++calls === 1
        ? {}
        : { sumQuantity: { quantity: 123, unit: "count" } };
    },
    queryWorkoutSamples: async (p) => {
      options = p;
      return [
        {
          uuid: "a",
          sourceRevision: { source: { name: "Synthetic" } },
          workoutActivityType: 1,
          startDate: new Date("2026-10-01T10:00:00Z"),
          endDate: new Date("2026-10-01T10:30:00Z"),
          duration: { quantity: 1200, unit: "s" },
          metadata: { private: "discard" },
        },
      ];
    },
  };
  const adapter = load("src/health/adapter.ios.ts", {
    "./model": model,
    "@kingstinct/react-native-healthkit": hk,
    "react-native": { Linking: {} },
  }).default;
  assert.deepEqual(await adapter.requestAccess(), {
    steps: "denied",
    workouts: "unknown",
  });
  assert.deepEqual(requested, {
    toRead: ["HKWorkoutTypeIdentifier"],
    toShare: [],
  });
  const result = await adapter.read(days);
  assert.equal(calls, 0);
  assert.equal(result.steps.length, 0);
  assert.equal(options.limit, 0);
  assert.equal(result.workouts[0].durationMinutes, 20);
  assert.equal(result.workouts[0].metadata, undefined);
});
