import test from "node:test";
import assert from "node:assert/strict";
import {
  heatIndex,
  risk,
  planActivity,
  isStale,
  type Weather,
  type Hour,
} from "../src/lib/heat";

test("NOAA regression matches the published 90°F / 70% example, approximately 106°F", () => {
  assert.ok(
    Math.abs(heatIndex(((90 - 32) * 5) / 9, 70) - ((106 - 32) * 5) / 9) < 0.7,
  );
});
test("cool conditions use the low-temperature screening formula", () => {
  assert.ok(heatIndex(20, 50) < 21);
});
test("invalid humidity and non-finite temperatures are rejected", () => {
  assert.throws(() => heatIndex(30, 101), RangeError);
  assert.throws(() => heatIndex(NaN, 50), RangeError);
});
test("danger boundaries are inclusive", () => {
  assert.equal(risk(42).tone, "danger");
  assert.equal(risk(52).label, "Extreme danger");
  assert.equal(risk(33).label, "Extreme caution");
});
const hour = (h: number, hi: number): Hour => ({
  time: `2026-10-15T${String(h).padStart(2, "0")}:00`,
  temperature: 30,
  humidity: 60,
  heatIndex: hi,
  rain: 0,
  uv: 0,
  wind: 10,
  code: 0,
});
const fixture: Weather = {
  current: hour(6, 30),
  hourly: [hour(6, 30), hour(7, 44), hour(8, 34), hour(9, 34), hour(10, 48)],
  fetchedAt: "2026-10-14T22:00:00Z",
  source: "test",
};
const now = Date.parse("2026-10-15T06:00:00+08:00");
test("two-hour plans include the hottest hour and reject incomplete windows", () => {
  const results = planActivity(fixture, "Walking", 120, "Morning", now);
  assert.equal(results.find((r) => r.time.endsWith("06:00"))?.heatIndex, 44);
  assert.equal(results[0].time, "2026-10-15T08:00");
  assert.ok(!results.some((r) => r.time.endsWith("10:00")));
});
test("past start times are excluded", () => {
  const results = planActivity(
    fixture,
    "Walking",
    30,
    "Morning",
    now + 1800000,
  );
  assert.ok(
    results.every((r) => Date.parse(r.time + "+08:00") >= now + 1800000),
  );
});
test("stale forecasts suppress recommendations", () => {
  assert.equal(isStale(fixture, now + 4 * 3600000), true);
  assert.deepEqual(
    planActivity(fixture, "Exercise", 30, "Morning", now + 4 * 3600000),
    [],
  );
});
test("intensity and duration affect exposure score", () => {
  const low = planActivity(fixture, "Leisure", 15, "Morning", now).find((r) =>
    r.time.endsWith("08:00"),
  )!;
  const high = planActivity(fixture, "Exercise", 60, "Morning", now).find((r) =>
    r.time.endsWith("08:00"),
  )!;
  assert.ok(high.score > low.score);
});
test("unsupported durations fail rather than producing misleading output", () => {
  assert.throws(
    () => planActivity(fixture, "Walking", 0, "Morning", now),
    RangeError,
  );
});
test("activity intensity can change ranking when heat and UV tradeoffs differ", () => {
  const tradeoff = {
    ...fixture,
    hourly: [hour(6, 35), { ...hour(7, 34), uv: 2.75 }],
  };
  const leisure = planActivity(tradeoff, "Leisure", 60, "Morning", now);
  const exercise = planActivity(tradeoff, "Exercise", 60, "Morning", now);
  assert.equal(leisure[0].time, "2026-10-15T07:00");
  assert.equal(exercise[0].time, "2026-10-15T06:00");
});
