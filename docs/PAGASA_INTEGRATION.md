# PAGASA observation integration

## Source and verified discovery

The source is [PAGASA PANaHON](https://www.panahon.gov.ph/), not iHeatMap's gridded forecast. On 24 October 2026, its public website feed returned 112 automatic weather stations with temperature, humidity, and heat index. Science Garden's timestamped API record reported 26.03°C air temperature, 26°C heat index, and 82.1% humidity at 00:50 PHT. These describe the discovery sample, not hardcoded application readings.

The current integration follows the public website's own request flow: read its transient public CSRF/session metadata, then GET `/api/v1/aws` for `temperature`, `humidity`, and `heat_index`. No private login, embedded credential, or access-control bypass is used. These are undocumented website endpoints, not a supported API agreement. Public availability does not establish redistribution rights or an official partnership; confirm ongoing use/access terms with PAGASA before relying on this at scale.

The station catalog from iHeatMap is not itself a sensor reading. Its issue date and station-data date differ; neither is used to invent a current observation. PANaHON's static HTML contains example values, so the adapter never scrapes those placeholders as observations.

## Server contract

`GET /api/observations/pagasa?lat=14.6451&lon=121.0443`

- `fresh`: usable nearby station, recent retrieval, and readings no more than two hours old.
- `stale`: old observation/retrieval or failed refresh; exact observation/retrieval times remain available.
- `no_nearby`: no usable temperature station within 50 km of the selected coordinates.
- `not_supported`: coordinates outside the Philippine coverage bounding region; no upstream call.
- `unavailable`: no successful snapshot, unusable upstream response, or a snapshot older than 24 hours.

The bounding region is a coverage filter, not a country-boundary determination. Distance is straight-line from selected coordinates. The closest station with a valid temperature reading is used, even if a more distant station has newer values. Automatic-station provenance remains explicit; observations are not presented as synoptic-certified records.

Every parameter retains its own observation timestamp. Timezone-less `observed_at` values are interpreted as Philippine local time (`+08:00`), matching the public interface and discovery sample. Changing this upstream format causes rejection rather than a silent timezone shift. Provider confirmation of timestamp semantics remains desirable.

Values must have expected units (`°C` or `%`), plausible bounds, valid timestamps, and consistent station identity/coordinates. Missing/blank/null/NA values never become zero. Missing station heat index is not recalculated from potentially mismatched station readings. This is structural/plausibility validation, not a substitute for provider sensor-quality flags.

## Caching and failure behavior

All callers share a five-minute nationwide in-memory cache with concurrent refresh coalescing. Failed refreshes back off for five minutes and retain a labeled last successful snapshot for at most 24 hours. All API responses use `no-store`; PWA caching does not cache the observation endpoint. Tokens/cookies stay in memory and errors are sanitized. Browser coordinates are used only to select from the cached station list, not sent upstream. The visible online Today card rechecks every five minutes and on model refresh/reconnect; hidden tabs do not poll. No polling daemon or historical database is added.

The adapter process applies a conservative 600 requests/minute per socket-address limit. Behind the supplied Nginx sidecar, this acts as a gateway limit rather than a per-user IP quota; excess requests get 429 with Retry-After. Provider requests are still globally cache-limited. Endpoint query logging is disabled in supplied Nginx; review external tunnel logging separately.

## UI and comparisons

Today shows a separate station card, even when model weather fails. It is hidden for locations outside the coverage region. Values use the selected Celsius/Fahrenheit setting; station times are labeled PHT. Missing fields say “Not reported.” Failures preserve only the last retrieved in-session station card, marked as saved/out of date; there is no fabricated fallback.

Where recent model and station temperature times differ by at most 30 minutes, an optional difference is labeled as a comparison across different locations. It does not measure accuracy or apply a correction. Planner inputs, heat categories, model readings, and forecasts are unchanged by the station feed.

## Run and verify

Local: `npm run observations` alongside `npm run dev` (or production preview). Docker: the regular `docker compose up -d --build` builds and starts both services. Node 24 is bundled in the private sidecar; no host Node installation is needed on Debian. `/healthz` is process liveness, not provider health.

Tests cover units, null/zero/missing readings, time validity, mismatched station metadata, nearest/distant stations, stale/failed-refresh handling, cache coalescing/backoff/expiration, session sanitization, frontend contracts, and HTTP input validation. Live verification is separate from synthetic test fixtures; no fixtures are used by the production server.
