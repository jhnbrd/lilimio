// PANaHON's public website feed; no user credentials or private API tokens.
export const SOURCE_URL = 'https://www.panahon.gov.ph/';
export const CACHE_MS = 5 * 60_000;
export const MAX_OBSERVATION_AGE_MS = 2 * 60 * 60_000;
const MAX_RETAIN_MS = 24 * 60 * 60_000;
const FUTURE_TOLERANCE_MS = 5 * 60_000;
const PARAMETERS = {temperature: [-50, 60], heat_index: [-60, 90], humidity: [0, 100]};

export function isPhilippineArea(latitude, longitude) {
  return latitude >= 4 && latitude <= 22 && longitude >= 116 && longitude <= 127;
}
export function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}
function distanceKm(lat, lon, station) {
  const rad = Math.PI / 180;
  const a = Math.sin((station.latitude - lat) * rad / 2) ** 2 +
    Math.cos(lat * rad) * Math.cos(station.latitude * rad) * Math.sin((station.longitude - lon) * rad / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}
function observationTime(raw) {
  // The public site displays these timezone-less timestamps as Philippine local time.
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) return null;
  const iso = raw.replace(' ', 'T') + '+08:00';
  const epoch = Date.parse(iso);
  if (!Number.isFinite(epoch)) return null;
  // Date.parse can roll an invalid day into the next month.
  if (new Date(epoch + 8 * 3600_000).toISOString().slice(0, 19) !== iso.slice(0, 19)) return null;
  return iso;
}
export function normalizeFeeds(feeds, retrievedAt = new Date().toISOString()) {
  const stations = new Map();
  const now = Date.parse(retrievedAt);
  if (!Number.isFinite(now)) throw new Error('Invalid retrieval time');
  for (const [parameter, bounds] of Object.entries(PARAMETERS)) {
    const feed = feeds[parameter];
    if (!feed || feed.success !== true || !Array.isArray(feed.data) || feed.data.length > 5000)
      throw new Error('Incomplete station response');
    for (const row of feed.data) {
      if (!row || row.parameter !== parameter || typeof row.site_id !== 'string' ||
          !/^[\w-]{1,80}$/.test(row.site_id) || typeof row.site_name !== 'string' ||
          !row.site_name.trim() || row.site_name.length > 200 ||
          typeof row.lat !== 'number' || typeof row.lon !== 'number' || !validCoordinates(row.lat, row.lon) ||
          !isPhilippineArea(row.lat, row.lon)) continue;
      const raw = row.value;
      if (typeof raw !== 'number' && (typeof raw !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(raw.trim()))) continue;
      const value = Number(raw);
      const observedAt = observationTime(row.observed_at);
      if (!observedAt || !Number.isFinite(value) || value < bounds[0] || value > bounds[1] ||
          Date.parse(observedAt) > now + FUTURE_TOLERANCE_MS) continue;
      const expectedUnit = parameter === 'humidity' ? '%' : '°C';
      if (row.readable_unit !== expectedUnit) continue;
      const station = stations.get(row.site_id) || {
        id: row.site_id, name: row.site_name.trim(), latitude: row.lat, longitude: row.lon,
        type: 'automatic', readings: {},
      };
      // A reused ID with different metadata must not combine unrelated readings.
      if (station.name !== row.site_name.trim() || station.latitude !== row.lat || station.longitude !== row.lon) continue;
      const previous = station.readings[parameter];
      if (!previous || Date.parse(observedAt) > Date.parse(previous.observedAt))
        station.readings[parameter] = {value, observedAt};
      stations.set(row.site_id, station);
    }
  }
  const usable = [...stations.values()].filter(s => s.readings.temperature);
  if (!usable.length) throw new Error('No usable station observations');
  return {retrievedAt, stations: usable};
}
export function selectObservation(snapshot, latitude, longitude, now = Date.now(), refreshFailed = false) {
  const candidates = snapshot.stations.map(station => ({...station, distanceKm: distanceKm(latitude, longitude, station)}))
    .filter(station => station.distanceKm <= 50).sort((a,b) => a.distanceKm - b.distanceKm);
  if (!candidates.length) return {status: 'no_nearby', sourceUrl: SOURCE_URL, retrievedAt: snapshot.retrievedAt};
  // Closest station, never a hidden switch to a more distant station with a nicer reading.
  const station = candidates[0];
  const readings = Object.fromEntries(Object.entries(station.readings).map(([key, reading]) => [key, {
    ...reading, stale: now - Date.parse(reading.observedAt) > MAX_OBSERVATION_AGE_MS || Date.parse(reading.observedAt) > now + FUTURE_TOLERANCE_MS,
  }]));
  const stale = refreshFailed || now - Date.parse(snapshot.retrievedAt) > CACHE_MS || Object.values(readings).some(r => r.stale);
  return {status: stale ? 'stale' : 'fresh', sourceUrl: SOURCE_URL, retrievedAt: snapshot.retrievedAt,
    refreshFailed, station: {...station, readings}};
}

export function createProvider(fetcher = fetch) {
  let session = null;
  async function request(url, options = {}) {
    const response = await fetcher(url, {
      ...options, signal: AbortSignal.timeout(12_000), redirect: 'error',
      headers: {'User-Agent': 'lilimio/0.3 (+https://lilimio.jhnbrd.com)', Accept: 'application/json,text/html', ...options.headers},
    });
    if (!response.ok) throw new Error('Station provider unavailable');
    const text = await response.text();
    if (text.length > 4_000_000) throw new Error('Station response too large');
    return {response, text};
  }
  return async function fetchSnapshot() {
    if (!session || Date.now() - session.at > 30 * 60_000) {
      const {response, text} = await request(SOURCE_URL);
      const token = text.match(/<meta\s+[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i)?.[1];
      if (!token || token.length > 500 || /[\r\n]/.test(token)) throw new Error('Public station session unavailable');
      const cookie = response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
      session = {token, cookie, at: Date.now()};
    }
    try {
      const entries = await Promise.all(Object.keys(PARAMETERS).map(async parameter => {
        const url = new URL('/api/v1/aws', SOURCE_URL);
        url.searchParams.set('token', session.token);
        url.searchParams.set('parameter', parameter);
        const {text} = await request(url, {headers: {Cookie: session.cookie, Referer: SOURCE_URL}});
        return [parameter, JSON.parse(text)];
      }));
      return normalizeFeeds(Object.fromEntries(entries));
    } catch {
      session = null;
      // Never expose upstream URLs, cookies, or session tokens in errors.
      throw new Error('Station provider unavailable');
    }
  };
}
export function createObservationService(provider = createProvider(), clock = Date.now) {
  let snapshot = null;
  let pending = null;
  let lastAttempt = -Infinity;
  let refreshFailed = false;
  return async (latitude, longitude) => {
    if (!validCoordinates(latitude, longitude)) throw new RangeError('Invalid coordinates');
    if (!isPhilippineArea(latitude, longitude)) return {status: 'not_supported', sourceUrl: SOURCE_URL};
    const now = clock();
    if ((!snapshot || now - Date.parse(snapshot.retrievedAt) >= CACHE_MS) && now - lastAttempt >= CACHE_MS) {
      lastAttempt = now;
      pending = provider().then(value => {snapshot = value; refreshFailed = false;})
        .catch(() => {refreshFailed = true;}).finally(() => {pending = null;});
    }
    if (pending) await pending;
    if (!snapshot || clock() - Date.parse(snapshot.retrievedAt) > MAX_RETAIN_MS)
      return {status: 'unavailable', sourceUrl: SOURCE_URL};
    return selectObservation(snapshot, latitude, longitude, clock(), refreshFailed);
  };
}
