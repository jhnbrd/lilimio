import test from "node:test";
import assert from "node:assert/strict";
import { searchLocations } from "../src/lib/locations";

test("street and barangay searches preserve exact coordinates, disambiguation and unique locations", async () => {
  let requested = "";
  const fetcher = (async (url: unknown) => {
    requested = String(url);
    return new Response(
      JSON.stringify({
        features: [
          {
            geometry: { type: "Point", coordinates: [125.61234, 7.07123] },
            properties: {
              name: "Barangay 5-A",
              city: "Davao City",
              country: "Philippines",
            },
          },
          {
            geometry: { type: "Point", coordinates: [125.61234, 7.07123] },
            properties: { name: "Duplicate" },
          },
          {
            geometry: { type: "Point", coordinates: [-73.99, 40.73] },
            properties: {
              housenumber: "10",
              street: "Example Street",
              city: "New York",
              country: "United States",
            },
          },
          {
            geometry: { type: "Point", coordinates: [190, 90] },
            properties: { name: "Invalid" },
          },
          {
            geometry: { type: "LineString", coordinates: [0, 0] },
            properties: { name: "Invalid geometry" },
          },
        ],
      }),
    );
  }) as typeof fetch;
  const results = await searchLocations(
    "Barangay 5-A Davao",
    new AbortController().signal,
    fetcher,
  );
  assert.equal(new URL(requested).searchParams.get("q"), "Barangay 5-A Davao");
  assert.equal(results.length, 2);
  assert.equal(results[0].latitude, 7.07123);
  assert.equal(results[0].longitude, 125.61234);
  assert.equal(results[0].region, "Davao City, Philippines");
  assert.equal(results[1].name, "10 Example Street");
});
test("location search rejects incomplete responses and provider errors", async () => {
  const signal = new AbortController().signal;
  await assert.rejects(searchLocations("xy", signal));
  await assert.rejects(
    searchLocations(
      "Davao",
      signal,
      (async () => new Response("{}")) as typeof fetch,
    ),
    /incomplete/,
  );
  await assert.rejects(
    searchLocations(
      "Davao",
      signal,
      (async () => new Response("", { status: 503 })) as typeof fetch,
    ),
    /unavailable/,
  );
});

test("repeat location searches reuse bounded in-memory results without sharing mutable objects", async () => {
  let calls = 0;
  const fetcher = (async () => {
    calls++;
    return new Response(
      JSON.stringify({
        features: [
          {
            geometry: { type: "Point", coordinates: [125.6, 7.1] },
            properties: { name: "Example street", city: "Davao" },
          },
        ],
      }),
    );
  }) as typeof fetch;
  const signal = new AbortController().signal;
  const first = await searchLocations("Example street", signal, fetcher);
  first[0].name = "Changed by caller";
  const second = await searchLocations(" EXAMPLE STREET ", signal, fetcher);
  assert.equal(calls, 1);
  assert.equal(second[0].name, "Example street");
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(
    searchLocations("Example street", cancelled.signal, fetcher),
  );
});
