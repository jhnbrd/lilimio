import { heatIndex, type Weather, type Hour } from "./heat";
import type { City } from "./data";

export const weatherKey = (city: City) =>
  `lilimio-weather-${city.id}-${city.latitude}-${city.longitude}`;
export function validHour(value: unknown): value is Hour {
  if (!value || typeof value !== "object") return false;
  const h = value as Hour;
  return (
    typeof h.time === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(h.time) &&
    Number.isFinite(Date.parse(h.time + "+08:00")) &&
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
export function validWeather(value: unknown): value is Weather {
  if (!value || typeof value !== "object") return false;
  const w = value as Weather;
  return (
    !w.demo &&
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
  const c = data?.current,
    h = data?.hourly;
  if (!c || !h || !Array.isArray(h.time) || !h.time.length)
    throw new Error("Forecast is incomplete.");
  const hourly: Hour[] = h.time.map((time: string, i: number) => ({
    time,
    temperature: h.temperature_2m?.[i],
    humidity: h.relative_humidity_2m?.[i],
    heatIndex: heatIndex(h.temperature_2m?.[i], h.relative_humidity_2m?.[i]),
    rain: h.precipitation_probability?.[i],
    uv: h.uv_index?.[i],
    wind: h.wind_speed_10m?.[i],
    code: h.weather_code?.[i],
  }));
  const near = hourly.find((h) => h.time.slice(0, 13) === c.time?.slice(0, 13));
  if (!near) throw new Error("Current forecast coverage is incomplete.");
  const current: Hour = {
    ...near,
    time: c.time,
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
    city.latitude < 4 ||
    city.latitude > 22 ||
    city.longitude < 116 ||
    city.longitude > 127
  )
    throw new Error("Choose a location in the Philippines.");
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    hourly:
      "temperature_2m,relative_humidity_2m,precipitation_probability,uv_index,wind_speed_10m,weather_code",
    timezone: "Asia/Manila",
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
  return w.hourly.filter((h) => Date.parse(h.time + "+08:00") + 3600000 > now);
}
export function dailyPeaks(w: Weather) {
  const groups = new Map<string, Hour[]>();
  for (const h of w.hourly) {
    const day = h.time.slice(0, 10);
    groups.set(day, [...(groups.get(day) || []), h]);
  }
  return [...groups]
    .filter(([, hours]) => hours.length === 24)
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
  dateValue(v).toLocaleString("en-PH", { timeZone: "Asia/Manila", ...options });
export const timeLabel = (v: string) =>
  dateLabel(v, { hour: "numeric", minute: "2-digit" });
