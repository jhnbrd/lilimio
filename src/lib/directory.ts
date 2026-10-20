import type { Place } from "./data";

export type DirectoryCenter = {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
};
export const directoryKinds = [
  "All",
  "Parks & gardens",
  "Indoor places",
  "Drinking water",
] as const;
export type DirectoryKind = (typeof directoryKinds)[number];
export type DirectoryResult = {
  center: DirectoryCenter;
  fetchedAt: string;
  places: Place[];
  category?: DirectoryKind;
};
export const DIRECTORY_RADIUS = 3000;
export const DIRECTORY_TTL = 24 * 60 * 60 * 1000;
export const DIRECTORY_ENDPOINT = "https://photon.komoot.io/reverse";
const text = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, 240) : "";
export function validCenter(v: unknown): v is DirectoryCenter {
  if (!v || typeof v !== "object") return false;
  const c = v as DirectoryCenter;
  return (
    !!text(c.name) &&
    typeof c.region === "string" &&
    Number.isFinite(c.latitude) &&
    Math.abs(c.latitude) <= 90 &&
    Number.isFinite(c.longitude) &&
    Math.abs(c.longitude) <= 180
  );
}
export const directoryKey = (c: DirectoryCenter) =>
  `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`;
export function distanceKm(
  a: { latitude: number; longitude: number },
  lat: number,
  lng: number,
) {
  const rad = Math.PI / 180,
    dLat = (lat - a.latitude) * rad,
    dLng = (lng - a.longitude) * rad;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, value)));
}
export function buildDirectoryUrl(
  c: DirectoryCenter,
  category: DirectoryKind = "All",
) {
  if (!validCenter(c)) throw new Error("Choose a valid city.");
  const params = new URLSearchParams({
    lat: String(c.latitude),
    lon: String(c.longitude),
    radius: String(DIRECTORY_RADIUS / 1000),
    limit: "50",
    lang: "en",
  });
  if (!directoryKinds.includes(category))
    throw new Error("Choose a valid place category.");
  const tags =
    category === "Parks & gardens"
      ? ["leisure:park", "leisure:garden"]
      : category === "Indoor places"
        ? ["amenity:library", "shop:mall"]
        : category === "Drinking water"
          ? ["amenity:drinking_water"]
          : [
              "leisure:park",
              "leisure:garden",
              "amenity:library",
              "amenity:drinking_water",
              "shop:mall",
            ];
  for (const tag of tags) params.append("osm_tag", tag);
  return `${DIRECTORY_ENDPOINT}?${params}`;
}
export function parseDirectory(
  payload: unknown,
  center: DirectoryCenter,
  now = new Date(),
): DirectoryResult {
  if (
    !validCenter(center) ||
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as any).elements)
  )
    throw new Error("The place provider returned an incomplete response.");
  // Overpass can return HTTP 200 with a timeout remark and only partial elements.
  if ((payload as any).remark)
    throw new Error("The place search did not finish. Try again later.");
  const found = new Map<string, Place>();
  for (const e of (payload as any).elements) {
    if (
      !e ||
      !["node", "way", "relation"].includes(e.type) ||
      !Number.isSafeInteger(e.id) ||
      e.id <= 0 ||
      !e.tags ||
      typeof e.tags !== "object"
    )
      continue;
    const t = e.tags,
      lat = e.type === "node" ? e.lat : e.center?.lat,
      lng = e.type === "node" ? e.lon : e.center?.lon;
    if (
      !Number.isFinite(lat) ||
      Math.abs(lat) > 90 ||
      !Number.isFinite(lng) ||
      Math.abs(lng) > 180
    )
      continue;
    const distance = distanceKm(center, lat, lng);
    if (distance > DIRECTORY_RADIUS / 1000) continue;
    if (
      ["no", "private", "military", "employees", "permit"].includes(
        text(t.access),
      ) ||
      t.disused === "yes" ||
      t.abandoned === "yes"
    )
      continue;
    const water = t.amenity === "drinking_water",
      park = ["park", "garden"].includes(t.leisure),
      indoor = t.amenity === "library" || t.shop === "mall";
    if ((!water && !park && !indoor) || (water && t.drinking_water === "no"))
      continue;
    const label = water
      ? "Drinking water"
      : t.amenity === "library"
        ? "Library"
        : t.shop === "mall"
          ? "Shopping mall"
          : t.leisure === "garden"
            ? "Garden"
            : "Park";
    const id = `osm-${e.type}-${e.id}`,
      name =
        text(t.name) || text(t["name:en"]) || `Mapped ${label.toLowerCase()}`;
    const street = [text(t["addr:housenumber"]), text(t["addr:street"])]
      .filter(Boolean)
      .join(" ");
    const address =
      [street, text(t["addr:city"]), text(t["addr:country"])]
        .filter(Boolean)
        .join(", ") || `Near ${center.name} · street address not mapped`;
    const amenities = [label];
    if (t.air_conditioning === "yes")
      amenities.push("Air conditioning tagged in OSM");
    if (t.shade === "yes") amenities.push("Shade tagged in OSM");
    if (t.drinking_water === "yes" && !water)
      amenities.push("Drinking water tagged in OSM");
    found.set(id, {
      id,
      name,
      kind: water
        ? "Drinking water"
        : park
          ? "Parks & gardens"
          : "Indoor places",
      lat,
      lng,
      address,
      amenities,
      distanceKm: distance,
      description: water
        ? "Mapped as a drinking-water point. Check that it is operating and follow local water-quality notices."
        : park
          ? "Mapped as a park or garden. Shade and seating vary; this is not a verified cooling centre."
          : "Mapped as an indoor destination. Check public access, opening hours, and cooling before visiting.",
      osm: {
        url: `https://www.openstreetmap.org/${e.type}/${e.id}`,
        fetchedAt: now.toISOString(),
        access: text(t.access) || undefined,
        openingHours: text(t.opening_hours) || undefined,
        airConditioning: text(t.air_conditioning) || undefined,
        shade: text(t.shade) || undefined,
        fee: text(t.fee) || undefined,
      },
    });
  }
  return {
    center,
    fetchedAt: now.toISOString(),
    places: [...found.values()]
      .sort((a, b) => a.distanceKm! - b.distanceKm!)
      .slice(0, 100),
  };
}
export function validDirectoryPlace(v: unknown): v is Place {
  if (!v || typeof v !== "object") return false;
  const p = v as Place;
  return (
    typeof p.id === "string" &&
    /^osm-(node|way|relation)-[1-9]\d*$/.test(p.id) &&
    !!text(p.name) &&
    ["Parks & gardens", "Indoor places", "Drinking water"].includes(p.kind) &&
    typeof p.address === "string" &&
    typeof p.description === "string" &&
    Array.isArray(p.amenities) &&
    p.amenities.every((a) => typeof a === "string") &&
    Number.isFinite(p.lat) &&
    Math.abs(p.lat) <= 90 &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lng) <= 180 &&
    (p.distanceKm === undefined ||
      (typeof p.distanceKm === "number" &&
        Number.isFinite(p.distanceKm) &&
        p.distanceKm >= 0)) &&
    !!p.osm &&
    p.osm.url ===
      `https://www.openstreetmap.org/${p.id.split("-")[1]}/${p.id.split("-")[2]}` &&
    typeof p.osm.fetchedAt === "string" &&
    Number.isFinite(Date.parse(p.osm.fetchedAt)) &&
    ["access", "openingHours", "airConditioning", "shade", "fee"].every(
      (k) =>
        p.osm?.[k as keyof NonNullable<Place["osm"]>] === undefined ||
        typeof p.osm?.[k as keyof NonNullable<Place["osm"]>] === "string",
    )
  );
}
export function validDirectoryResult(v: unknown): v is DirectoryResult {
  if (!v || typeof v !== "object") return false;
  const r = v as DirectoryResult;
  return (
    validCenter(r.center) &&
    (r.category === undefined || directoryKinds.includes(r.category)) &&
    typeof r.fetchedAt === "string" &&
    Number.isFinite(Date.parse(r.fetchedAt)) &&
    Array.isArray(r.places) &&
    r.places.length <= 100 &&
    r.places.every(validDirectoryPlace)
  );
}
export function parsePhotonDirectory(
  payload: unknown,
  center: DirectoryCenter,
  now = new Date(),
): DirectoryResult {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray((payload as any).features)
  )
    throw new Error("The place provider returned an incomplete response.");
  const elements = (payload as any).features.flatMap((f: any) => {
    const p = f?.properties,
      coords = f?.geometry?.coordinates;
    if (
      !p ||
      typeof p !== "object" ||
      f?.geometry?.type !== "Point" ||
      !Array.isArray(coords) ||
      coords.length < 2 ||
      !["leisure", "amenity", "shop"].includes(p.osm_key)
    )
      return [];
    const type = (
      { N: "node", W: "way", R: "relation" } as Record<string, string>
    )[p.osm_type];
    if (!type) return [];
    const extra = p.extra && typeof p.extra === "object" ? p.extra : {};
    return [
      {
        type,
        id: p.osm_id,
        lat: coords[1],
        lon: coords[0],
        center: { lat: coords[1], lon: coords[0] },
        tags: {
          ...extra,
          [p.osm_key]: p.osm_value,
          name: p.name,
          "addr:housenumber": p.housenumber,
          "addr:street": p.street,
          "addr:city": p.city,
          "addr:country": p.country,
        },
      },
    ];
  });
  return parseDirectory({ elements }, center, now);
}
export async function fetchDirectory(
  center: DirectoryCenter,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  category: DirectoryKind = "All",
): Promise<DirectoryResult> {
  const response = await fetcher(buildDirectoryUrl(center, category), {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "The place service is busy. Wait a minute before retrying."
        : "The place service is temporarily unavailable.",
    );
  const result = parsePhotonDirectory(await response.json(), center);
  return {
    ...result,
    category,
    places: result.places.filter(
      (p) => category === "All" || p.kind === category,
    ),
  };
}
export async function searchDirectoryCities(
  query: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<DirectoryCenter[]> {
  const name = query.trim();
  if (name.length < 3 || name.length > 100)
    throw new Error("Enter a city name with 3–100 characters.");
  const params = new URLSearchParams({
    name,
    count: "6",
    language: "en",
    format: "json",
  });
  const response = await fetcher(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    { signal },
  );
  if (!response.ok) throw new Error("City search is unavailable. Try again.");
  const data = await response.json();
  if (
    !data ||
    data.error ||
    (data.results !== undefined && !Array.isArray(data.results))
  )
    throw new Error("City search returned an incomplete response.");
  return (data.results || [])
    .map((c: any) => ({
      name: text(c.name),
      region: [text(c.admin1), text(c.country)].filter(Boolean).join(", "),
      latitude: c.latitude,
      longitude: c.longitude,
    }))
    .filter(validCenter);
}
