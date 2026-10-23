import test from "node:test";
import assert from "node:assert/strict";
import {
  parseForecast,
  validWeather,
  fetchForecast,
  weatherKey,
  dailyPeaks,
} from "../src/lib/weather";
import { cities } from "../src/lib/data";
import { isStale, planActivity, type Weather } from "../src/lib/heat";
const times = Array.from(
  { length: 72 },
  (_, i) =>
    `2026-10-${19 + Math.floor(i / 24)}T${String(i % 24).padStart(2, "0")}:00`,
);
function fixture() {
  return {
    current: {
      time: times[12],
      temperature_2m: 31,
      relative_humidity_2m: 60,
      weather_code: 1,
      wind_speed_10m: 9,
    },
    hourly: {
      time: times,
      temperature_2m: times.map(() => 31),
      relative_humidity_2m: times.map(() => 60),
      precipitation_probability: times.map(() => 20),
      uv_index: times.map(() => 2),
      wind_speed_10m: times.map(() => 9),
      weather_code: times.map(() => 1),
    },
  };
}
test("provider payload yields three complete daily peaks with calculated heat index", () => {
  const w = parseForecast(fixture(), new Date("2026-10-19T04:00Z"));
  assert.ok(validWeather(w));
  assert.equal(dailyPeaks(w).length, 3);
  assert.ok(w.current.heatIndex > w.current.temperature);
});
test("missing/null provider values are rejected instead of becoming fabricated zero readings", () => {
  const bad = fixture();
  bad.hourly.uv_index[5] = null as unknown as number;
  assert.throws(() => parseForecast(bad), /missing/);
  const humidity = fixture();
  humidity.current.relative_humidity_2m = 101;
  assert.throws(() => parseForecast(humidity));
});
test("invalid cached data and illustrative demo data cannot become live forecasts", () => {
  const w = parseForecast(fixture());
  assert.equal(validWeather({ ...w, demo: true }), false);
  assert.equal(validWeather({ ...w, fetchedAt: "yesterday" }), false);
  assert.equal(validWeather({ ...w, hourly: [] }), false);
});
test("fetch uses direct provider, coordinates, three days and caller cancellation", async () => {
  const signal = new AbortController().signal;
  const result = await fetchForecast(cities[0], signal, async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.open-meteo.com");
    assert.equal(url.searchParams.get("forecast_days"), "3");
    assert.equal(url.searchParams.get("latitude"), String(cities[0].latitude));
    assert.equal(init?.signal, signal);
    assert.equal(init?.cache, "no-store");
    return Response.json(fixture());
  });
  assert.equal(result.hourly.length, 72);
});
test("provider failures and invalid coordinates fail explicitly", async () => {
  await assert.rejects(
    fetchForecast(
      cities[0],
      new AbortController().signal,
      async () => new Response(null, { status: 503 }),
    ),
    /unavailable/,
  );
  await assert.rejects(
    fetchForecast({ ...cities[0], latitude: 91 }, new AbortController().signal),
    /latitude/,
  );
});
test("coordinate-specific caches do not leak forecasts between device locations", () => {
  assert.notEqual(
    weatherKey({ ...cities[0], id: "device" }),
    weatherKey({ ...cities[0], id: "device", latitude: 10 }),
  );
});
test("planner refuses stale or future-dated retrievals and gaps in multi-hour windows", () => {
  const now = Date.parse("2026-10-19T12:00+08:00");
  const w = parseForecast(fixture(), new Date(now));
  assert.ok(!isStale(w, now));
  assert.ok(
    isStale({ ...w, fetchedAt: new Date(now + 3600000).toISOString() }, now),
  );
  const gap = { ...w, hourly: [w.hourly[12], w.hourly[14]] };
  assert.deepEqual(planActivity(gap, "Walking", 120, "Afternoon", now), []);
});
test("incomplete daily coverage is omitted from daily peaks", () => {
  const w = parseForecast(fixture());
  assert.equal(dailyPeaks({ ...w, hourly: w.hourly.slice(1) }).length, 2);
});
