import { timestamp, localIso } from "./time";
import { heatIndex, type Weather, type Hour } from "./heat";
import type { City } from "./data";

export const weatherKey = (city: City) =>
  `lilimio-weather-v2-${city.id}-${city.latitude}-${city.longitude}`;
export function validHour(value: unknown): value is Hour {
  if (!value || typeof value !== "object") return false;
  const h = value as Hour;
  return (
    typeof h.time === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?$/.test(h.time) &&
    Number.isFinite(timestamp(h.time)) &&
    [
      "temperature",
      "humidity",
      "heatIndex",
      "rain",
      "uv",
      "wind",
      "code",
    ].every(
      (k) =>
        typeof h[k as keyof Hour] === "number" &&
        Number.isFinite(h[k as keyof Hour]),
    ) &&
    h.humidity >= 0 &&
    h.humidity <= 100 &&
    h.rain >= 0 &&
    h.rain <= 100
  );
}
function validTimezone(value: unknown) {
  if (typeof value !== "string") return false;
  try { new Intl.DateTimeFormat("en", {timeZone:value}); return true; } catch { return false; }
}
export function validWeather(value: unknown): value is Weather {
  if (!value || typeof value !== "object") return false;
  const w = value as Weather;
  return (
    !w.demo &&
    (w.timezone === undefined || validTimezone(w.timezone)) &&
    validHour(w.current) &&
    Array.isArray(w.hourly) &&
    w.hourly.length > 0 &&
    w.hourly.every(validHour) &&
    typeof w.source === "string" &&
    typeof w.fetchedAt === "string" &&
    Number.isFinite(Date.parse(w.fetchedAt))
  );
}
export function parseForecast(data: any, now = new Date()): Weather {
  const zone = data?.timezone || "Asia/Manila";
  if (!validTimezone(zone) || (typeof data?.current?.time === "number" && !validTimezone(data?.timezone)))
    throw new Error("Forecast timezone is missing or invalid.");
  const normalize = (v: unknown): string => typeof v === "number" ? localIso(v * 1000, zone) : String(v);
  const c = data?.current,
    h = data?.hourly;
  if (!c || !h || !Array.isArray(h.time) || !h.time.length)
    throw new Error("Forecast is incomplete.");
  const hourly: Hour[] = h.time.map((time: string, i: number) => ({
    time: normalize(time),
    temperature: h.temperature_2m?.[i],
    humidity: h.relative_humidity_2m?.[i],
    heatIndex: heatIndex(h.temperature_2m?.[i], h.relative_humidity_2m?.[i]),
    rain: h.precipitation_probability?.[i],
    uv: h.uv_index?.[i],
    wind: h.wind_speed_10m?.[i],
    code: h.weather_code?.[i],
  }));
  const currentEpoch = timestamp(normalize(c.time));
  const near = hourly.find(h => timestamp(h.time) <= currentEpoch && currentEpoch - timestamp(h.time) < 3600000);
  if (!near) throw new Error("Current forecast coverage is incomplete.");
  const current: Hour = {
    ...near,
    time: normalize(c.time),
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    heatIndex: heatIndex(c.temperature_2m, c.relative_humidity_2m),
    wind: c.wind_speed_10m,
    code: c.weather_code,
  };
  const result = {
    current,
    hourly,
    fetchedAt: now.toISOString(),
    source: "Open-Meteo · model forecast",
    timezone: zone,
  };
  if (!validWeather(result))
    throw new Error("Forecast contains missing readings.");
  return result;
}
export async function fetchForecast(
  city: City,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<Weather> {
  if (
    !Number.isFinite(city.latitude) ||
    !Number.isFinite(city.longitude) ||
    city.latitude < -90 ||
    city.latitude > 90 ||
    city.longitude < -180 ||
    city.longitude > 180
  )
    throw new Error("Choose valid latitude and longitude.");
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    hourly:
      "temperature_2m,relative_humidity_2m,precipitation_probability,uv_index,wind_speed_10m,weather_code",
    timezone: "auto",
    timeformat: "unixtime",
    forecast_days: "3",
  });
  const response = await fetcher(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { signal, cache: "no-store", headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("The forecast provider is unavailable.");
  return parseForecast(await response.json());
}
export function upcoming(w: Weather, now = Date.now()) {
  return w.hourly.filter((h) => timestamp(h.time) + 3600000 > now);
}
export function dailyPeaks(w: Weather) {
  const groups = new Map<string, Hour[]>();
  for (const h of w.hourly) {
    const day = h.time.slice(0, 10);
    groups.set(day, [...(groups.get(day) || []), h]);
  }
  return [...groups]
    .filter(([, hours]) =>
      hours.length >= 23 && hours.length <= 25 &&
      hours[0].time.slice(11,16) === "00:00" && hours.at(-1)!.time.slice(11,16) === "23:00" &&
      hours.every((h,i) => !i || timestamp(h.time) - timestamp(hours[i-1].time) === 3600000)
    )
    .map(([date, hours]) => ({
      date,
      hour: hours.reduce((a, b) => (a.heatIndex > b.heatIndex ? a : b)),
    }));
}
export const dateValue = (v: string) =>
  new Date(
    v.length === 10
      ? v + "T12:00:00+08:00"
      : v.endsWith("Z") || /[+-]\d\d:\d\d$/.test(v)
        ? v
        : v + "+08:00",
  );
export const dateLabel = (
  v: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  },
) =>
  ( /[+-]\d{2}:\d{2}$/.test(v)
    ? new Date(v.replace(/[+-]\d{2}:\d{2}$/, "") + "Z")
    : dateValue(v)
  ).toLocaleString("en", { timeZone: /[+-]\d{2}:\d{2}$/.test(v) ? "UTC" : undefined, ...options });
export const timeLabel = (v: string) =>
  dateLabel(v, { hour: "numeric", minute: "2-digit" });
