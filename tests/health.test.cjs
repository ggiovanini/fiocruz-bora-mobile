const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const compiled = ts.transpileModule(
  readFileSync("src/health/model.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  },
).outputText;
const mod = new Module("health-model");
mod._compile(compiled, "health-model.cjs");
const { HealthSession, normalizeWorkout, lastSevenDays } = mod.exports;
const access = { steps: "granted", workouts: "granted" };
const workout = (id) =>
  normalizeWorkout("healthkit", {
    id,
    origin: "Synthetic test",
    kind: "Caminhada",
    start: "2026-10-01T10:00:00Z",
    end: "2026-10-01T10:30:00Z",
  });
const snapshot = (workouts = [], permission = access) => ({
  source: "healthkit",
  access: permission,
  workouts,
  steps: [{ date: "2026-10-01", count: null, source: "healthkit" }],
  syncedAt: "2026-10-01T12:00:00Z",
});
const adapter = (overrides) => ({
  label: "Synthetic",
  availability: async () => "available",
  requestAccess: async () => access,
  read: async () => snapshot(),
  managePermissions: async () => {},
  ...overrides,
});
test("resync deduplicates and replaces deleted records without persisting or awarding points", async () => {
  let result = snapshot([workout("a"), workout("a"), workout("b")]);
  const session = new HealthSession(adapter({ read: async () => result }));
  await session.connect();
  await session.sync();
  assert.equal(session.getSnapshot().snapshot.workouts.length, 2);
  result = snapshot([workout("b")]);
  await session.sync();
  assert.deepEqual(
    session.getSnapshot().snapshot.workouts.map((w) => w.id),
    ["healthkit:b"],
  );
  assert.equal(session.getSnapshot().snapshot.workouts[0].status, "local-only");
  session.disconnect();
  assert.equal(session.getSnapshot().snapshot, null);
});
test("partial permission and unknown iOS reads remain usable; missing steps are not zero", async () => {
  for (const permission of [
    { steps: "denied", workouts: "granted" },
    { steps: "unknown", workouts: "unknown" },
  ]) {
    const session = new HealthSession(
      adapter({
        requestAccess: async () => permission,
        read: async () => snapshot([], permission),
      }),
    );
    await session.connect();
    assert.equal(session.getSnapshot().connected, true);
    await session.sync();
    assert.equal(session.getSnapshot().snapshot.steps[0].count, null);
  }
});
test("fully denied connection never reads; revoked access clears previous readings", async () => {
  let reads = 0;
  const denied = { steps: "denied", workouts: "denied" };
  const session = new HealthSession(
    adapter({
      requestAccess: async () => denied,
      read: async () => {
        reads++;
        return snapshot([], denied);
      },
    }),
  );
  await session.connect();
  await session.sync();
  assert.equal(reads, 0);
  assert.equal(session.getSnapshot().connected, false);
  let result = snapshot([workout("a")]);
  const active = new HealthSession(adapter({ read: async () => result }));
  await active.connect();
  await active.sync();
  result = snapshot([], denied);
  await active.sync();
  assert.equal(active.getSnapshot().snapshot, null);
  assert.equal(active.getSnapshot().connected, false);
});
test("disconnect cancels late native reads and concurrent synchronization is ignored", async () => {
  let finish;
  let reads = 0;
  const session = new HealthSession(
    adapter({
      read: () => {
        reads++;
        return new Promise((resolve) => (finish = resolve));
      },
    }),
  );
  await session.connect();
  const pending = session.sync();
  await session.sync();
  assert.equal(reads, 1);
  session.disconnect();
  finish(snapshot([workout("a")]));
  await pending;
  assert.equal(session.getSnapshot().snapshot, null);
  assert.equal(session.getSnapshot().connected, false);
});
test("disconnect during authorization does not reconnect on delayed completion", async () => {
  let finish;
  const session = new HealthSession(
    adapter({
      requestAccess: () => new Promise((resolve) => (finish = resolve)),
    }),
  );
  const pending = session.connect();
  await Promise.resolve();
  session.disconnect();
  finish(access);
  await pending;
  assert.equal(session.getSnapshot().connected, false);
});
test("read failure clears stale data and exposes no native error details", async () => {
  let fail = false;
  const session = new HealthSession(
    adapter({
      read: async () => {
        if (fail) throw Error("sensitive native detail");
        return snapshot([workout("a")]);
      },
    }),
  );
  await session.connect();
  await session.sync();
  fail = true;
  await session.sync();
  assert.equal(session.getSnapshot().snapshot, null);
  assert.equal(session.getSnapshot().busy, false);
  assert.ok(!session.getSnapshot().message.includes("sensitive"));
});
test("seven local days are contiguous across daylight-saving changes", () => {
  const before = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    const now = new Date(2026, 2, 10, 12);
    const days = lastSevenDays(now);
    assert.equal(days.length, 7);
    assert.equal(days[0].date, "2026-03-04");
    assert.equal(days[6].end.getTime(), now.getTime());
    for (let i = 0; i < 6; i++)
      assert.equal(days[i].end.getTime(), days[i + 1].start.getTime());
    assert.equal((days[4].end - days[4].start) / 3600000, 23);
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
});
test("malformed workouts are excluded; source IDs cannot collide", () => {
  assert.equal(
    normalizeWorkout("healthkit", {
      id: "x",
      origin: "test",
      kind: "test",
      start: "invalid",
      end: "invalid",
    }),
    null,
  );
  assert.equal(
    normalizeWorkout("healthkit", {
      id: "x",
      origin: "test",
      kind: "test",
      start: "2026-10-02",
      end: "2026-10-01",
    }),
    null,
  );
  assert.equal(workout("a").durationMinutes, 30);
  assert.notEqual(
    workout("a").id,
    normalizeWorkout("health-connect", {
      id: "a",
      origin: "test",
      kind: "test",
      start: "2026-10-01",
      end: "2026-10-02",
    }).id,
  );
});
test("returning to the app invalidates an in-flight read after settings may have changed", async () => {
  let finish;
  const session = new HealthSession(
    adapter({
      read: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    }),
  );
  await session.connect();
  const pending = session.sync();
  session.clearReadings();
  finish(snapshot([workout("a")]));
  await pending;
  assert.equal(session.getSnapshot().snapshot, null);
  assert.equal(session.getSnapshot().busy, false);
});

function automaticFixture(session, now = Date.parse("2026-10-01T12:00:00Z")) {
  const code = ts.transpileModule(
    readFileSync("src/health/automatic.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  const mod = new Module("automatic");
  mod._compile(code, "automatic.cjs");
  let time = now;
  let id = 0;
  const timers = new Map();
  const clock = {
    now: () => new Date(time),
    schedule: (callback, delay) => {
      timers.set(++id, { callback, at: time + delay });
      return id;
    },
    cancel: (id) => timers.delete(id),
  };
  const updates = mod.exports.startAutomaticUpdates(session, true, clock);
  const flush = async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve();
  };
  return {
    updates,
    flush,
    timers,
    advance: async (ms) => {
      time += ms;
      for (const [id, t] of [...timers])
        if (t.at <= time) {
          timers.delete(id);
          t.callback();
        }
      await flush();
    },
  };
}
test("automatic updates require connection, run immediately then every five minutes without new prompts", async () => {
  let reads = 0,
    prompts = 0;
  const session = new HealthSession(
    adapter({
      requestAccess: async () => {
        prompts++;
        return access;
      },
      read: async () => {
        reads++;
        return snapshot();
      },
    }),
  );
  const f = automaticFixture(session);
  await f.flush();
  assert.equal(reads, 0);
  await session.connect();
  await f.flush();
  assert.equal(reads, 1);
  assert.equal(prompts, 1);
  assert.equal(f.timers.size, 1);
  await f.advance(299999);
  assert.equal(reads, 1);
  await f.advance(1);
  assert.equal(reads, 2);
  assert.equal(prompts, 1);
  f.updates.stop();
  assert.equal(f.timers.size, 0);
});
test("background and short foreground returns do not read; stale return updates once", async () => {
  let reads = 0;
  const session = new HealthSession(
    adapter({
      read: async () => {
        reads++;
        return snapshot();
      },
    }),
  );
  session.restorePreferences({ connected: true, automatic: true });
  const f = automaticFixture(session);
  await f.flush();
  assert.equal(reads, 1);
  f.updates.setActive(false);
  await f.advance(60000);
  f.updates.setActive(true);
  await f.flush();
  assert.equal(reads, 1);
  f.updates.setActive(false);
  await f.advance(300000);
  assert.equal(reads, 1);
  assert.equal(f.timers.size, 0);
  f.updates.setActive(true);
  await f.flush();
  assert.equal(reads, 2);
  f.updates.stop();
});
test("restored preference never requests permissions and disabled automatic updates allow manual reads", async () => {
  let reads = 0;
  const session = new HealthSession(
    adapter({
      requestAccess: async () => {
        throw Error("Must not prompt");
      },
      read: async () => {
        reads++;
        return snapshot();
      },
    }),
  );
  session.restorePreferences({ connected: true, automatic: false });
  const f = automaticFixture(session);
  await f.advance(600000);
  assert.equal(reads, 0);
  await session.sync(new Date("2026-10-01T12:10:00Z"));
  assert.equal(reads, 1);
  session.setAutomatic(true);
  await f.flush();
  assert.equal(reads, 1);
  await f.advance(300000);
  assert.equal(reads, 2);
  session.setAutomatic(false);
  await f.advance(300000);
  assert.equal(reads, 2);
  f.updates.stop();
});
test("automatic failures are throttled and disconnect stops future reads", async () => {
  let reads = 0;
  const session = new HealthSession(
    adapter({
      read: async () => {
        reads++;
        throw Error("offline native store");
      },
    }),
  );
  session.restorePreferences({ connected: true, automatic: true });
  const f = automaticFixture(session);
  await f.flush();
  assert.equal(reads, 1);
  f.updates.setActive(false);
  f.updates.setActive(true);
  await f.flush();
  assert.equal(reads, 1);
  await f.advance(300000);
  assert.equal(reads, 2);
  session.disconnect();
  await f.advance(300000);
  assert.equal(reads, 2);
  assert.equal(f.timers.size, 0);
  f.updates.stop();
});
