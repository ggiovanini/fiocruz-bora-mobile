const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const code = ts.transpileModule(readFileSync("src/mocks/model.ts", "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const model = new Module("mock-model");
model._compile(code, "mock-model.cjs");
const { initialState, reducer, restoreState, newDraft, validateDraft } =
  model.exports;
function activity() {
  return {
    ...newDraft("movement"),
    minutes: "20",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}
test("duplicate submission and retry retain a single activity", () => {
  const a = activity();
  let s = reducer(initialState, { type: "enqueue", value: a });
  s = reducer(s, { type: "enqueue", value: a });
  s = reducer(s, { type: "status", id: a.id, value: "failed" });
  s = reducer(s, { type: "status", id: a.id, value: "sending" });
  s = reducer(s, { type: "status", id: a.id, value: "confirmed" });
  assert.equal(s.activities.length, 1);
  assert.equal(s.activities[0].status, "confirmed");
  s = reducer(s, { type: "status", id: a.id, value: "pending" });
  assert.equal(s.activities[0].status, "confirmed");
});
test("reopening restores pending activities, draft and profile", () => {
  const a = activity();
  const s = {
    ...initialState,
    name: "Teste",
    session: "active",
    draft: newDraft(),
    activities: [{ ...a, status: "sending" }],
  };
  const restored = restoreState(JSON.stringify(s));
  assert.equal(restored.name, "Teste");
  assert.equal(restored.draft.id, s.draft.id);
  assert.equal(restored.activities[0].status, "pending");
});
test("session expiration preserves draft and queued records", () => {
  const a = activity();
  const s = { ...initialState, draft: newDraft(), activities: [a] };
  const expired = reducer(s, {
    type: "patch",
    value: { session: "expired", resumePath: "/activity" },
  });
  assert.equal(expired.draft.id, s.draft.id);
  assert.equal(expired.activities[0].id, a.id);
  assert.equal(expired.resumePath, "/activity");
});
test("revocation preserves records and blocks participation", () => {
  const s = {
    ...initialState,
    session: "active",
    accepted: true,
    activities: [activity()],
  };
  const revoked = reducer(s, {
    type: "patch",
    value: { accepted: false, session: "signedOut", telemetry: false },
  });
  assert.equal(revoked.accepted, false);
  assert.equal(revoked.activities.length, 1);
});
test("repeated check-in produces one attendance", () => {
  let s = reducer(initialState, { type: "checkin", id: "event" });
  s = reducer(s, { type: "checkin", id: "event" });
  assert.deepEqual(s.checkins, ["event"]);
});
test("invalid duration and calendar dates are rejected", () => {
  const d = { ...newDraft(), minutes: "20" };
  assert.equal(validateDraft(d), null);
  for (const minutes of ["", "0", "-2", "abc", "1.2", "1441"])
    assert.ok(validateDraft({ ...d, minutes }));
  for (const date of ["bad", "2026-02-30", "2999-01-01"])
    assert.ok(validateDraft({ ...d, date }));
});
test("reset removes local mock state, malformed storage falls back safely", () => {
  const s = {
    ...initialState,
    name: "Teste",
    activities: [activity()],
    checkins: ["event"],
  };
  assert.deepEqual(reducer(s, { type: "reset" }), initialState);
  assert.deepEqual(restoreState("{"), initialState);
  assert.deepEqual(restoreState('{"version":9}'), initialState);
});
test("pending and failed activities do not advance mission progress", () => {
  const { mockMissionProgress } = model.exports;
  const a = activity();
  assert.equal(
    mockMissionProgress(
      [a, { ...a, id: "failed", status: "failed" }],
      "movement",
      20,
    ).done,
    false,
  );
  assert.equal(
    mockMissionProgress(
      [{ ...a, minutes: "10", status: "confirmed" }],
      "movement",
      20,
    ).done,
    false,
  );
  assert.equal(
    mockMissionProgress([{ ...a, status: "confirmed" }], "movement", 20).done,
    true,
  );
});

test("expanded discovery catalogue accepts movement and mind without assigning EV", () => {
  for (const type of ["Corrida", "Natação", "Estudo", "Podcast", "Meditação"]) {
    const draft = { ...newDraft(), type, minutes: "30" };
    assert.equal(validateDraft(draft), null);
    assert.equal(draft.energyKind, undefined);
    assert.equal(draft.ev, undefined);
  }
  assert.ok(validateDraft({ ...newDraft(), type: "not-in-catalogue", minutes: "30" }));
});
test("custom activity needs a meaningful bounded name and survives draft restore", () => {
  const draft = { ...newDraft(), type: "Outra atividade", activityName: "Tocar violão", minutes: "20" };
  assert.equal(validateDraft(draft), null);
  assert.equal(model.exports.activityTitle(draft), "Tocar violão");
  for (const activityName of [undefined, " ", "x", "a".repeat(81)])
    assert.ok(validateDraft({ ...draft, activityName }));
  const restored = restoreState(JSON.stringify({ ...initialState, draft }));
  assert.equal(restored.draft.activityName, draft.activityName);
  assert.equal(validateDraft(restored.draft), null);
  const activity = { ...draft, status: "pending", createdAt: new Date().toISOString() };
  const state = reducer(initialState, { type: "enqueue", value: activity });
  assert.equal(model.exports.activityTitle(state.activities[0]), "Tocar violão");
  assert.equal(state.activities[0].status, "pending");
});

test("restoring an older selectable avatar preserves participant records and drops the retired preference", () => {
  const a = activity();
  const restored = restoreState(JSON.stringify({ ...initialState, name: "Participante", avatar: "🌳", activities: [a] }));
  assert.equal(Object.hasOwn(restored, "avatar"), false);
  assert.equal(Object.hasOwn(initialState, "avatar"), false);
  assert.equal(restored.name, "Participante");
  assert.equal(restored.activities[0].id, a.id);
});
