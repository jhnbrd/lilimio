/** Exact OSM -> Wikidata P18 / Commons file links only. No proximity or name guesses. */
const plain = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(?:amp|quot|apos|lt|gt|nbsp);/g,
      (entity) =>
        ({
          "&amp;": "&",
          "&quot;": '"',
          "&apos;": "'",
          "&lt;": "<",
          "&gt;": ">",
          "&nbsp;": " ",
        })[entity],
    )
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Math.min(Number(n), 0x10ffff)),
    )
    .trim()
    .slice(0, 500);
export function osmRecord(value) {
  const match =
    /^https:\/\/(?:www\.)?openstreetmap\.org\/(node|way|relation)\/([1-9]\d{0,14})\/?$/.exec(
      value || "",
    );
  return match ? { type: match[1], id: match[2] } : null;
}
export function commonsPhoto(data, title) {
  const info = Object.values(data?.query?.pages || {})[0]?.imageinfo?.[0];
  const metadata = info?.extmetadata;
  if (
    !info ||
    !metadata ||
    !/^https:\/\/upload\.wikimedia\.org\//.test(info.thumburl || "") ||
    !/^https:\/\/commons\.wikimedia\.org\//.test(info.descriptionurl || "")
  )
    return null;
  const license = plain(metadata.LicenseShortName?.value);
  const licenseUrl = String(metadata.LicenseUrl?.value || "").replace(
    /^http:\/\//,
    "https://",
  );
  // Reject unclear/non-free reuse terms, and never render metadata HTML.
  if (
    !license ||
    !/^https:\/\/(?:creativecommons\.org|commons\.wikimedia\.org)\//.test(
      licenseUrl || "",
    ) ||
    !/^(?:CC0(?: \d\.\d)?|CC BY(?:-SA)?(?: \d\.\d)?|Public domain)$/i.test(
      license,
    )
  )
    return null;
  const author = plain(metadata.Attribution?.value || metadata.Artist?.value);
  if (!author) return null;
  return {
    url: info.thumburl,
    source: info.descriptionurl,
    author,
    license,
    licenseUrl,
    title: plain(title),
  };
}
export function createPhotoService({ fetcher = fetch, clock = Date.now } = {}) {
  const cache = new Map(),
    pending = new Map();
  async function json(url) {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(4500),
      redirect: "error",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "lilimio/0.3 (https://github.com/jhnbrd/lilimio) place-photo lookup",
      },
    });
    if (!response.ok) throw new Error("Photo provider unavailable");
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error("Photo response too large");
    const body = JSON.parse(text);
    if (body?.error || body?.remark)
      throw new Error("Photo provider unavailable");
    return body;
  }
  async function lookup(record) {
    const query = `[out:json][timeout:4];${record.type}(${record.id});out tags;`;
    const osm = await json(
      `https://overpass-api.de/api/interpreter?${new URLSearchParams({ data: query })}`,
    );
    const element = osm?.elements?.find(
      (item) => item.type === record.type && String(item.id) === record.id,
    );
    const tags = element?.tags || {};
    let file = /^File:.{1,240}$/u.test(tags.wikimedia_commons || "")
      ? tags.wikimedia_commons
      : null;
    if (!file && /^Q[1-9]\d{0,12}$/.test(tags.wikidata || "")) {
      const entity = await json(
        `https://www.wikidata.org/wiki/Special:EntityData/${tags.wikidata}.json`,
      );
      const statements = entity?.entities?.[tags.wikidata]?.claims?.P18 || [];
      const statement =
        statements.find(
          (s) => s.rank === "preferred" && s.mainsnak?.snaktype === "value",
        ) ||
        statements.find(
          (s) => s.rank !== "deprecated" && s.mainsnak?.snaktype === "value",
        );
      const value = statement?.mainsnak?.datavalue?.value;
      if (typeof value === "string" && value.length <= 240)
        file = `File:${value}`;
    }
    if (!file) return { photo: null };
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: file,
      iiprop: "url|extmetadata",
      iiurlwidth: "800",
    });
    const data = await json(
      `https://commons.wikimedia.org/w/api.php?${params}`,
    );
    return { photo: commonsPhoto(data, file) };
  }
  return async (value) => {
    const record = osmRecord(value);
    if (!record) throw new TypeError("Invalid OpenStreetMap record");
    const key = `${record.type}/${record.id}`;
    const hit = cache.get(key);
    if (hit && hit.expires > clock()) return hit.value;
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= 2) throw new Error("Photo lookup busy");
    const work = lookup(record)
      .then((value) => {
        if (cache.size >= 250) cache.delete(cache.keys().next().value);
        cache.set(key, {
          value,
          expires: clock() + (value.photo ? 86400_000 : 3600_000),
        });
        return value;
      })
      .catch((error) => {
        if (cache.size >= 250) cache.delete(cache.keys().next().value);
        cache.set(key, {
          value: { photo: null, error: "Photo provider unavailable" },
          expires: clock() + 30_000,
        });
        throw error;
      })
      .finally(() => pending.delete(key));
    pending.set(key, work);
    return work;
  };
}
