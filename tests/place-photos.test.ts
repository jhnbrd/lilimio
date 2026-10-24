import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node-only service intentionally has no frontend declaration.
import {
  osmRecord,
  commonsPhoto,
  createPhotoService,
} from "../server/place-photos.mjs";
const file = {
  query: {
    pages: {
      1: {
        imageinfo: [
          {
            thumburl: "https://upload.wikimedia.org/a.jpg",
            descriptionurl: "https://commons.wikimedia.org/wiki/File:A.jpg",
            extmetadata: {
              Artist: { value: '<a href="x">A &amp; B</a>' },
              LicenseShortName: { value: "CC BY-SA 4.0" },
              LicenseUrl: {
                value: "https://creativecommons.org/licenses/by-sa/4.0/",
              },
            },
          },
        ],
      },
    },
  },
};
test("photo lookup only accepts exact public OSM record identities", () => {
  assert.deepEqual(osmRecord("https://www.openstreetmap.org/way/123"), {
    type: "way",
    id: "123",
  });
  for (const value of [
    "http://localhost/node/1",
    "https://openstreetmap.org.evil/node/1",
    "https://openstreetmap.org/node/1?url=x",
    "https://openstreetmap.org/node/-1",
  ])
    assert.equal(osmRecord(value), null);
});
test("Commons attribution is plain text and incomplete licenses are rejected", () => {
  assert.equal(commonsPhoto(file, "File:A.jpg").author, "A & B");
  const bad = structuredClone(file);
  bad.query.pages[1].imageinfo[0].extmetadata.LicenseUrl.value =
    "javascript:alert(1)";
  assert.equal(commonsPhoto(bad, "File:A.jpg"), null);
});
test("unlinked places never fall back to a name or nearby image; negative results are cached", async () => {
  let calls = 0;
  const service = createPhotoService({
    fetcher: async (url: string) => {
      calls++;
      assert.equal(
        new URL(url).searchParams.get("data"),
        "[out:json][timeout:4];node(12);out tags;",
      );
      return new Response(
        JSON.stringify({
          elements: [{ type: "node", id: 12, tags: { name: "A park" } }],
        }),
      );
    },
  });
  assert.deepEqual(await service("https://openstreetmap.org/node/12"), {
    photo: null,
  });
  await service("https://openstreetmap.org/node/12");
  assert.equal(calls, 1);
});
test("exact Wikidata P18 links resolve to credited Commons photos", async () => {
  const calls: string[] = [];
  const service = createPhotoService({
    fetcher: async (url: string) => {
      calls.push(url);
      return new Response(
        JSON.stringify(
          url.includes("/api/interpreter?")
            ? {
                elements: [{ type: "way", id: 23, tags: { wikidata: "Q123" } }],
              }
            : url.includes("Special:EntityData")
              ? {
                  entities: {
                    Q123: {
                      claims: {
                        P18: [
                          {
                            rank: "normal",
                            mainsnak: {
                              snaktype: "value",
                              datavalue: { value: "A.jpg" },
                            },
                          },
                        ],
                      },
                    },
                  },
                }
              : file,
        ),
      );
    },
  });
  const result = await service("https://openstreetmap.org/way/23");
  assert.equal(
    result.photo.source,
    "https://commons.wikimedia.org/wiki/File:A.jpg",
  );
  assert.equal(calls.length, 3);
});

test("photo lookups coalesce and provider failures back off without fabricating absence", async () => {
  let calls = 0;
  let release: (() => void) | undefined;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const service = createPhotoService({
    fetcher: async () => {
      calls++;
      await wait;
      return new Response("busy", { status: 429 });
    },
  });
  const first = service("https://openstreetmap.org/node/1");
  const second = service("https://openstreetmap.org/node/1");
  release!();
  const results = await Promise.allSettled([first, second]);
  assert.equal(calls, 1);
  assert.ok(results.every((result) => result.status === "rejected"));
  const cached = await service("https://openstreetmap.org/node/1");
  assert.equal(cached.photo, null);
  assert.equal(cached.error, "Photo provider unavailable");
  assert.equal(calls, 1);
});

test("unsupported non-free photo licenses are not accepted", () => {
  const restricted = structuredClone(file);
  restricted.query.pages[1].imageinfo[0].extmetadata.LicenseShortName.value =
    "CC BY-NC 4.0";
  assert.equal(commonsPhoto(restricted, "File:A.jpg"), null);
});

test("HTTP-200 provider errors are not reported as missing photos", async () => {
  const service = createPhotoService({
    fetcher: async () =>
      new Response(JSON.stringify({ remark: "Query timed out", elements: [] })),
  });
  await assert.rejects(service("https://openstreetmap.org/way/1"));
});
