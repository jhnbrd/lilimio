# Implementation and verification

## Current scope

Vite + React + TypeScript static PWA. The browser connects directly to forecast, geocoding, directory, and map providers. A Node sidecar caches public PANaHON automatic-station readings behind a same-origin observation API. There is no configured Supabase connection.

| Area | Behavior |
| --- | --- |
| Today and forecast | Air temperature, calculated heat index, three complete forecast days when available, manual refresh, source/model/retrieval timestamps |
| Planner | Experimental heat/UV/rain/activity comparisons; excludes past, stale, incomplete, and unsuitable windows; plans save locally |
| Directory | Worldwide city search, OSM places through Photon, MapLibre map/list, category filters, directions, bookmarks, local correction drafts |
| Guides | Search, detailed reading, local download list, text export, offline app shell and guide content after a successful initial load |
| Preferences | Units, reduced motion, install/update prompts, public notices, local-data controls |
| Onboarding | Optional location selection, explicit terms acknowledgement, skip path, public guide deep links |

Weather and directory search support worldwide cities and coordinates independently. Forecasts carry the selected location’s timezone and explicit timestamp offsets, including daylight-saving changes. See [coverage and accuracy](WEATHER_ACCURACY.md).

## Data guarantees

- Validate provider payloads and browser caches; fail explicitly rather than substituting mock weather or places.
- Cancel weather requests on location changes and apply timeouts. Cache readings by coordinates with visible stale/offline recovery.
- Preserve source and uncertainty labels. NOAA/NWS heat index is an estimate for shade/light wind, not a direct-sun or safe-exposure guarantee.
- Treat mapped facilities as community data. Missing hours, cooling, access, shade, and water-quality details are not invented.
- Keep plans/preferences/drafts in browser storage; draft actions do not imply remote delivery.

Official advisories, automatic Web Push, remote submissions, moderation, and authentication remain unconnected. See [directory details](RELIEF_DIRECTORY.md) and [public notices](PUBLIC_NOTICES.md).

## Interface conventions

Approved references live in `mockups/mobile`, `mockups/desktop`, and `mockups/references`. Use spacious forest/ivory layouts, Plus Jakarta Sans, semantic controls, keyboard focus, and responsive navigation. Illustration crops are decorative; full-screen mockups are not functional interfaces.

Motion, Anime.js, GSAP, and CSS have separate ownership and cleanup rules in [ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md). Preserve reduced motion. See [IOS_VIEWPORT.md](IOS_VIEWPORT.md) for mobile frame behavior. Never import runtime code from `.old/`.

## Required checks

```sh
npm test && npm run typecheck && npm run build
```

The test suite cover heat calculations, planner validity, provider parsing, coordinate caches, directory validation/bookmarks, browser storage, and notice selection. Builds generate revisioned PWA assets. Existing build warnings concern the lazy map chunk size and a shared static/dynamic forecast import.

Historical browser checks covered onboarding, weather refresh, planning/saves, directory interactions, notices, offline guide reload, units, and selected mobile/desktop layouts. These checks do not establish full device, accessibility, or scientific validation. Physical-device installation, broader assistive-technology review, and safety-method validation remain separate work.

See [the historical verification log](VERIFICATION_HISTORY.md) for dated checks. Server updates and health verification are documented in [DOCKER.md](DOCKER.md); GitHub deployment records are owner attestations, not server revision checks.

## 0.3.0 local verification — 23 October 2026

48 tests passed, including US coordinates, offset timestamps, 23/25-hour DST days, fractional timezones, legacy timestamps, freshness ages, and complete-day validation. Type checking, production compilation, and the offline-download budget check passed. The shared forecast-import warning was removed by extracting the reusable chart; the deferred MapLibre size warning remains.

Live provider requests succeeded for New York and Davao. Chromium checks verified worldwide city search (San Diego), US device coordinates, local planner windows and saved-plan persistence, build information, sources/accuracy reading, opt-in map loading, the pan-to-search affordance, and offline guide deep-link reload. No page errors or document overflow were observed in the checked 390px/1280px views.

Precache is approximately 1.7 MiB versus the previous 6.2 MiB. The map/worker are excluded from precaching and loaded on request. Core guide content and guide artwork remain precached; other artwork is cached as visited.

The GitHub workflow is prepared for pull requests, main pushes, and manual runs. It checks the application and builds/smoke-tests the production Nginx container, independently of manual deployment records. Docker is unavailable in this local environment, so the container job has not been executed here. The station adapter itself was run locally and verified against the live PANaHON feed. These changes have not been deployed to Debian or recorded as a new production deployment.

## PAGASA adapter — 24 October 2026

Added the same-origin Node observation adapter and a separate Today station card with automatic-station provenance, closest usable station within 50 km, per-parameter times, units, cache age, stale/unavailable handling, and public source links. The card is independent of model forecast success and hidden outside the coverage region. Model forecasts and planner rankings are unchanged. See [PAGASA_INTEGRATION.md](PAGASA_INTEGRATION.md) for the public-feed contract, cache/failure policy, deployment wiring, and limitations. The privacy notice now describes server-side coordinate selection and provider fetching; its acknowledgement version was updated.

Browser verified the live Science Garden card at mobile/desktop widths, parameter values and PHT times, explicit saved-reading behavior after a failed station refresh, and continued station access when the model request fails. US locations made no station request. The checked views had no horizontal document overflow or page errors. The public deployment has not been updated.
