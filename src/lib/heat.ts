export type Hour = {
  time: string;
  temperature: number;
  humidity: number;
  heatIndex: number;
  rain: number;
  uv: number;
  wind: number;
  code: number;
};
export type Weather = {
  current: Hour;
  hourly: Hour[];
  fetchedAt: string;
  source: string;
  demo?: boolean;
};
/** NOAA/NWS Rothfusz regression with Steadman screening and humidity adjustments. Shade/light wind only. */
export function heatIndex(celsius: number, humidity: number): number {
  if (
    !Number.isFinite(celsius) ||
    !Number.isFinite(humidity) ||
    humidity < 0 ||
    humidity > 100
  )
    throw new RangeError("Invalid temperature or humidity");
  const t = (celsius * 9) / 5 + 32,
    r = humidity;
  let hi = 0.5 * (t + 61 + (t - 68) * 1.2 + r * 0.094);
  if ((hi + t) / 2 >= 80) {
    hi =
      -42.379 +
      2.04901523 * t +
      10.14333127 * r -
      0.22475541 * t * r -
      0.00683783 * t * t -
      0.05481717 * r * r +
      0.00122874 * t * t * r +
      0.00085282 * t * r * r -
      0.00000199 * t * t * r * r;
    if (r < 13 && t >= 80 && t <= 112)
      hi -= ((13 - r) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
    if (r > 85 && t >= 80 && t <= 87) hi += (((r - 85) / 10) * (87 - t)) / 5;
  }
  return Math.round((((hi - 32) * 5) / 9) * 10) / 10;
}
export function risk(hi: number) {
  if (hi >= 52)
    return {
      label: "Extreme danger",
      tone: "danger",
      guidance:
        "Avoid outdoor exertion. Move to a cool place and monitor for heat illness.",
    };
  if (hi >= 42)
    return {
      label: "Danger · high heat risk",
      tone: "danger",
      guidance:
        "Limit prolonged outdoor activities. Take frequent cooling breaks and stay hydrated.",
    };
  if (hi >= 33)
    return {
      label: "Extreme caution",
      tone: "warm",
      guidance:
        "Take extra care outdoors. Find shade, drink water, and take regular breaks.",
    };
  if (hi >= 27)
    return {
      label: "Caution",
      tone: "warm",
      guidance:
        "Stay hydrated and take shaded breaks during outdoor activities.",
    };
  return {
    label: "Lower heat conditions",
    tone: "green",
    guidance:
      "Keep water with you and check conditions before heading outside.",
  };
}
export const activities = [
  "Commuting",
  "Walking",
  "Exercise",
  "Outdoor work",
  "Leisure",
] as const;
export type Activity = (typeof activities)[number];
export type Period = "Morning" | "Afternoon" | "Evening";
export function isStale(weather: Weather, now = Date.now()) {
  const fetched = Date.parse(weather.fetchedAt),
    model = Date.parse(weather.current.time + "+08:00");
  return (
    !Number.isFinite(fetched) ||
    !Number.isFinite(model) ||
    fetched > now + 60000 ||
    model > now + 3600000 ||
    now - fetched > 2 * 3600000 ||
    now - model > 3 * 3600000
  );
}
/** Experimental comparative score, not a medically validated exposure limit. */
export function planActivity(
  weather: Weather,
  activity: Activity,
  duration: number,
  period: Period,
  now = Date.now(),
) {
  if (!weather.demo && isStale(weather, now)) return [];
  if (![15, 30, 60, 120].includes(duration))
    throw new RangeError("Unsupported duration");
  const effort = {
    Commuting: 1,
    Walking: 1.2,
    Exercise: 2.2,
    "Outdoor work": 2.5,
    Leisure: 0.8,
  }[activity];
  const windows = weather.hourly.flatMap((h, index) => {
    const start = Date.parse(h.time + "+08:00"),
      hour = Number(h.time.slice(11, 13));
    if (start < now || hour < 6 || hour > 19) return [];
    const end = start + duration * 60000;
    const span = weather.hourly
      .slice(index)
      .filter((x) => Date.parse(x.time + "+08:00") < end);
    if (
      !span.length ||
      span.some(
        (x, i) =>
          i > 0 &&
          Date.parse(x.time + "+08:00") -
            Date.parse(span[i - 1].time + "+08:00") !==
            3600000,
      )
    )
      return [];
    const coveredUntil = Date.parse(span.at(-1)!.time + "+08:00") + 3600000;
    if (coveredUntil < end) return [];
    const maximum = Math.max(...span.map((x) => x.heatIndex));
    const uv = Math.max(...span.map((x) => x.uv));
    const rain = Math.max(...span.map((x) => x.rain));
    const match =
      period === "Morning"
        ? hour < 12
        : period === "Afternoon"
          ? hour >= 12 && hour < 17
          : hour >= 17;
    const score =
      maximum +
      Math.max(0, maximum - 27) * effort * (duration / 60) * 0.25 +
      uv * (0.35 + effort * 0.1) +
      rain * 0.04;
    return [
      {
        time: h.time,
        end: new Date(end).toISOString(),
        heatIndex: maximum,
        rain,
        uv,
        score,
        preferred: match,
        risk: risk(maximum),
      },
    ];
  });
  return windows.sort(
    (a, b) =>
      a.score + (a.preferred ? 0 : 1.5) - (b.score + (b.preferred ? 0 : 1.5)),
  );
}
