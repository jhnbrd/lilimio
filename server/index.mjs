import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createPhotoService, osmRecord } from "./place-photos.mjs";
import { createObservationService } from "./pagasa.mjs";

export function observationServer(
  service = createObservationService(),
  clock = Date.now,
  photoService = createPhotoService(),
) {
  const clients = new Map();
  return createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const reply = (status, body) => {
      res.writeHead(status);
      res.end(JSON.stringify(body));
    };
    if (req.method !== "GET") return reply(405, { error: "GET required" });
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/healthz") return reply(200, { ok: true });
    const photoRequest = url.pathname === "/api/places/photo";
    if (!photoRequest && url.pathname !== "/api/observations/pagasa")
      return reply(404, { error: "Not found" });
    const now = clock(),
      client = req.socket.remoteAddress || "unknown";
    for (const [key, value] of clients)
      if (now - value.start >= 60_000) clients.delete(key);
    if (clients.size >= 5000 && !clients.has(client))
      return reply(429, { error: "Try again later" });
    const usage = clients.get(client) || { start: now, count: 0 };
    clients.set(client, usage);
    if (++usage.count > 600) {
      res.setHeader("Retry-After", "60");
      return reply(429, { error: "Try again later" });
    }
    if (photoRequest) {
      const record = url.searchParams.get("record");
      if (!osmRecord(record))
        return reply(400, { error: "Invalid OpenStreetMap record" });
      if (usage.count > 60) {
        res.setHeader("Retry-After", "60");
        return reply(429, { error: "Try again later" });
      }
      try {
        return reply(200, await photoService(record));
      } catch {
        return reply(503, { photo: null, error: "Photo provider unavailable" });
      }
    }
    const rawLat = url.searchParams.get("lat"),
      rawLon = url.searchParams.get("lon");
    if (!rawLat?.trim() || !rawLon?.trim())
      return reply(400, { error: "Coordinates required" });
    const lat = Number(rawLat),
      lon = Number(rawLon);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    )
      return reply(400, { error: "Invalid coordinates" });
    try {
      return reply(200, await service(lat, lon));
    } catch {
      return reply(503, { status: "unavailable" });
    }
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number(process.env.PORT || 8090);
  const server = observationServer();
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.listen(port, process.env.HOST || "127.0.0.1", () =>
    console.log(`Station adapter listening on port ${port}`),
  );
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
