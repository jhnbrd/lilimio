/** Legacy saved plans used Philippine wall times; new forecasts carry explicit offsets. */
export const timestamp = (value: string) => Date.parse(
  /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : value + "+08:00",
);
export function localIso(epoch: number, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(epoch));
  const get = (key: string) => parts.find(p => p.type === key)!.value;
  const wall = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  const offset = Math.round((Date.parse(wall + "Z") - epoch) / 60000);
  const abs = Math.abs(offset);
  return `${wall}${offset < 0 ? "-" : "+"}${String(Math.floor(abs / 60)).padStart(2,"0")}:${String(abs % 60).padStart(2,"0")}`;
}
export function freshnessLabel(retrieved: string, now = Date.now()) {
  const age = now - Date.parse(retrieved);
  if (!Number.isFinite(age) || age < -60000) return "Retrieval time unavailable";
  const minutes = Math.max(0, Math.floor(age / 60000));
  return minutes < 1 ? "Retrieved just now" : minutes < 60
    ? `Retrieved ${minutes} minute${minutes === 1 ? "" : "s"} ago`
    : `Retrieved ${Math.floor(minutes / 60)} hour${minutes < 120 ? "" : "s"} ago`;
}
