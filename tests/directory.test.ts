import test from "node:test";
import assert from "node:assert/strict";
import { groupMapPlaces } from "../src/lib/map-groups";
import {
  buildDirectoryUrl,
  parseDirectory,
  parsePhotonDirectory,
  fetchDirectory,
  validDirectoryPlace,
  validDirectoryResult,
  searchDirectoryCities,
} from "../src/lib/directory";
import {
  readSavedPlaces,
  saveDirectoryPlace,
} from "../src/lib/directory-storage";
const center = {
  name: "London",
  region: "United Kingdom",
  latitude: 51.50853,
  longitude: -0.12574,
};
const now = new Date("2026-10-20T03:00:00Z");
test("map pin groups retain every place and separate as the map is zoomed", () => {
  const places = parseDirectory(
    {
      elements: [
        {
          type: "node",
          id: 1,
          lat: 51.509,
          lon: -0.126,
          tags: { leisure: "park" },
        },
        {
          type: "node",
          id: 2,
          lat: 51.5091,
          lon: -0.126,
          tags: { leisure: "park" },
        },
        {
          type: "node",
          id: 3,
          lat: 51.511,
          lon: -0.126,
          tags: { amenity: "library" },
        },
      ],
    },
    center,
    now,
  ).places;
  const small = groupMapPlaces(places, (p) => ({
    x: 0,
    y: (p.lat - 51.509) * 100000,
  }));
  assert.deepEqual(
    small.map((g) => g.places.length),
    [2, 1],
  );
  assert.equal(small.flatMap((g) => g.places).length, 3);
  assert.equal(
    groupMapPlaces(places, (p) => ({ x: 0, y: (p.lat - 51.509) * 1000000 }))
      .length,
    3,
  );
});
const element = (
  id: number,
  tags: Record<string, string>,
  extra: Record<string, unknown> = {},
) => ({ type: "node", id, lat: 51.509, lon: -0.126, tags, ...extra });
const feature = (
  id: number,
  key = "leisure",
  value = "park",
  extra: Record<string, unknown> = {},
) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [-0.126, 51.509] },
  properties: {
    osm_type: "N",
    osm_id: id,
    osm_key: key,
    osm_value: value,
    name: "Example mapped park",
    ...extra,
  },
});
test("worldwide searches are bounded and include relevant OSM categories without a key", () => {
  const url = new URL(buildDirectoryUrl(center));
  assert.equal(url.origin, "https://photon.komoot.io");
  assert.equal(url.searchParams.get("radius"), "3");
  assert.equal(url.searchParams.get("limit"), "50");
  assert.equal(url.searchParams.get("lat"), String(center.latitude));
  assert.ok(
    url.searchParams.getAll("osm_tag").includes("amenity:drinking_water"),
  );
  assert.throws(() => buildDirectoryUrl({ ...center, latitude: 91 }));
  assert.throws(() => buildDirectoryUrl({ ...center, longitude: NaN }));
  assert.deepEqual(
    new URL(buildDirectoryUrl(center, "Drinking water")).searchParams.getAll(
      "osm_tag",
    ),
    ["amenity:drinking_water"],
  );
});
test("community tags retain provenance and never invent shade, cooling or opening hours", () => {
  const result = parseDirectory(
    {
      elements: [
        element(1, { name: "Library", amenity: "library" }),
        element(2, {
          name: "Park",
          leisure: "park",
          shade: "yes",
          opening_hours: "Mo-Fr 09:00-17:00",
          access: "public",
        }),
      ],
    },
    center,
    now,
  );
  assert.equal(result.places.length, 2);
  const library = result.places[0],
    park = result.places[1];
  assert.equal(library.kind, "Indoor places");
  assert.equal(library.osm?.airConditioning, undefined);
  assert.equal(library.osm?.openingHours, undefined);
  assert.equal(library.osm?.url, "https://www.openstreetmap.org/node/1");
  assert.equal(park.osm?.shade, "yes");
  assert.equal(park.osm?.openingHours, "Mo-Fr 09:00-17:00");
  assert.ok(validDirectoryResult(result));
});
test("private, nonpotable, invalid, distant and unrelated records are excluded", () => {
  const result = parseDirectory(
    {
      elements: [
        element(1, { amenity: "library", access: "private" }),
        element(2, { amenity: "drinking_water", drinking_water: "no" }),
        element(3, { leisure: "park" }, { lat: NaN }),
        element(4, { leisure: "park" }, { lat: 52 }),
        element(5, { amenity: "hospital" }),
        element(6, { leisure: "park" }),
      ],
    },
    center,
    now,
  );
  assert.deepEqual(
    result.places.map((p) => p.id),
    ["osm-node-6"],
  );
});
test("OSM node/way/relation IDs stay distinct and duplicate records are removed", () => {
  const items = [
    element(1, { leisure: "park" }),
    element(1, { leisure: "park" }),
    element(
      1,
      { amenity: "library" },
      { type: "way", center: { lat: 51.509, lon: -0.126 } },
    ),
    element(
      1,
      { shop: "mall" },
      { type: "relation", center: { lat: 51.509, lon: -0.126 } },
    ),
  ];
  assert.equal(
    parseDirectory({ elements: items }, center, now).places.length,
    3,
  );
});
test("Photon records map to real OSM identity, coordinates, address and only supplied extra tags", () => {
  const result = parsePhotonDirectory(
    {
      features: [
        feature(99, "amenity", "drinking_water", {
          street: "High Street",
          city: "London",
          extra: { access: "yes" },
        }),
        feature(100, "leisure", "park", { osm_type: "W" }),
        { properties: {}, geometry: { type: "Polygon", coordinates: [] } },
      ],
    },
    center,
    now,
  );
  assert.equal(result.places.length, 2);
  assert.equal(result.places[0].kind, "Drinking water");
  assert.equal(result.places[0].address, "High Street, London");
  assert.equal(result.places[0].osm?.access, "yes");
  assert.equal(result.places[1].id, "osm-way-100");
});
test("malformed/partial provider responses and unsafe cached source URLs are rejected", () => {
  assert.throws(() => parsePhotonDirectory({}, center));
  assert.throws(() =>
    parseDirectory({ elements: [], remark: "runtime error: timeout" }, center),
  );
  const place = parsePhotonDirectory({ features: [feature(1)] }, center, now)
    .places[0];
  assert.equal(
    validDirectoryPlace({
      ...place,
      osm: { ...place.osm, url: "javascript:alert(1)" },
    }),
    false,
  );
  assert.equal(validDirectoryPlace({ ...place, distanceKm: "near" }), false);
  assert.equal(
    validDirectoryPlace({ ...place, osm: { ...place.osm, fetchedAt: 2026 } }),
    false,
  );
});
test("empty results stay empty and fetch errors never fabricate fallback places", async () => {
  const signal = new AbortController().signal;
  const empty = await fetchDirectory(center, signal, async (input, init) => {
    assert.equal(init?.signal, signal);
    assert.equal(
      new URL(String(input)).searchParams.get("lon"),
      String(center.longitude),
    );
    return Response.json({ features: [] });
  });
  assert.deepEqual(empty.places, []);
  await assert.rejects(
    fetchDirectory(
      center,
      signal,
      async () => new Response(null, { status: 429 }),
    ),
    /busy/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchDirectory(center, controller.signal, async (_, init) => {
      init?.signal?.throwIfAborted();
      return Response.json({ features: [] });
    }),
    { name: "AbortError" },
  );
});
test("global city search disambiguates countries and rejects bad coordinates and payloads", async () => {
  const results = await searchDirectoryCities(
    "London",
    new AbortController().signal,
    async (input) => {
      assert.equal(new URL(String(input)).searchParams.get("name"), "London");
      return Response.json({
        results: [
          {
            name: "London",
            admin1: "England",
            country: "United Kingdom",
            latitude: 51.5,
            longitude: -0.12,
          },
          { name: "Bad", latitude: 200, longitude: 0 },
        ],
      });
    },
  );
  assert.equal(results.length, 1);
  assert.equal(results[0].region, "England, United Kingdom");
  await assert.rejects(
    searchDirectoryCities("ab", new AbortController().signal),
    /3–100/,
  );
  await assert.rejects(
    searchDirectoryCities("London", new AbortController().signal, async () =>
      Response.json({ error: true }),
    ),
    /incomplete/,
  );
});
test("saved API places survive reload independently of directory cache and preserve legacy saves", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const entries = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => entries.get(k) ?? null,
      setItem: (k: string, v: string) => entries.set(k, v),
    },
  });
  try {
    entries.set("lilimio-places-v2", "[1]");
    const place = parsePhotonDirectory({ features: [feature(99)] }, center, now)
      .places[0];
    assert.equal(saveDirectoryPlace(place, true), true);
    assert.equal(readSavedPlaces().length, 2);
    assert.equal(saveDirectoryPlace(place, true), true);
    assert.equal(readSavedPlaces().length, 2);
    assert.equal(saveDirectoryPlace(place, false), true);
    assert.deepEqual(
      readSavedPlaces().map((p) => p.id),
      [1],
    );
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete (globalThis as any).localStorage;
  }
});
