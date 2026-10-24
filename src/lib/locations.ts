import type { City } from "./data";
import { validCenter } from "./directory";

export const LOCATION_DISCLAIMER =
  "Forecasts estimate conditions across an area, not the temperature on your street. Shade, buildings and nearby surfaces can change how hot it feels.";

const searchCaches = new WeakMap<
  typeof fetch,
  Map<string, { at: number; results: City[] }>
>();

/** Keep the provider's coordinates; never replace a street result with its city. */
export async function searchLocations(
  query: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<City[]> {
  const q = query.trim();
  if (q.length < 3 || q.length > 100)
    throw new Error("Enter 3–100 characters.");
  if (signal.aborted) throw signal.reason;
  let cache = searchCaches.get(fetcher);
  if (!cache) {
    cache = new Map();
    searchCaches.set(fetcher, cache);
  }
  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 5 * 60 * 1000)
    return cached.results.map((result) => ({ ...result }));
  const response = await fetcher(
    `https://photon.komoot.io/api/?${new URLSearchParams({ q, limit: "6", lang: "en" })}`,
    { signal },
  );
  if (!response.ok)
    throw new Error("Location search is unavailable. Try again.");
  const data = await response.json();
  if (!Array.isArray(data?.features))
    throw new Error("Location search returned an incomplete response.");
  const clean = (value: unknown) =>
    typeof value === "string" ? value.trim().slice(0, 160) : "";
  const results: City[] = [];
  for (const feature of data.features) {
    const props = feature?.properties;
    const coordinates = feature?.geometry?.coordinates;
    if (
      !props ||
      feature?.geometry?.type !== "Point" ||
      !Array.isArray(coordinates)
    )
      continue;
    const street = [clean(props.housenumber), clean(props.street)]
      .filter(Boolean)
      .join(" ");
    const name =
      clean(props.name) || street || clean(props.district) || clean(props.city);
    const region = [
      ...new Set(
        [
          street,
          clean(props.district),
          clean(props.city),
          clean(props.state),
          clean(props.country),
        ].filter((v) => v && v !== name),
      ),
    ].join(", ");
    const location = {
      id: `location-${coordinates[1]}-${coordinates[0]}`,
      name,
      region,
      latitude: coordinates[1],
      longitude: coordinates[0],
    };
    if (validCenter(location) && !results.some((r) => r.id === location.id))
      results.push(location);
  }
  if (!signal.aborted && results.length) {
    cache.delete(key);
    cache.set(key, { at: Date.now(), results });
    if (cache.size > 50) cache.delete(cache.keys().next().value!);
  }
  return results.map((result) => ({ ...result }));
}
