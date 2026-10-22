# Implementation and verification

## Current scope

Vite + React + TypeScript static PWA. The browser connects directly to weather, geocoding, directory, and map providers. There is no application server or configured Supabase connection.

| Area | Behavior |
| --- | --- |
| Today and forecast | Air temperature, calculated heat index, three complete forecast days when available, manual refresh, source/model/retrieval timestamps |
| Planner | Experimental heat/UV/rain/activity comparisons; excludes past, stale, incomplete, and unsuitable windows; plans save locally |
| Directory | Worldwide city search, OSM places through Photon, MapLibre map/list, category filters, directions, bookmarks, local correction drafts |
| Guides | Search, detailed reading, local download list, text export, offline app shell and guide content after a successful initial load |
| Preferences | Units, reduced motion, install/update prompts, public notices, local-data controls |
| Onboarding | Optional location selection, explicit terms acknowledgement, skip path, public guide deep links |

Weather city selection covers six Philippine cities; device weather coordinates are limited to the Philippine bounding region. Directory location selection is independent and supports international cities.

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

The current 34 tests cover heat calculations, planner validity, provider parsing, coordinate caches, directory validation/bookmarks, browser storage, and notice selection. Builds generate revisioned PWA assets. Existing build warnings concern the lazy map chunk size and a shared static/dynamic forecast import.

Historical browser checks covered onboarding, weather refresh, planning/saves, directory interactions, notices, offline guide reload, units, and selected mobile/desktop layouts. These checks do not establish full device, accessibility, or scientific validation. Physical-device installation, broader assistive-technology review, and safety-method validation remain separate work.

See [the historical verification log](VERIFICATION_HISTORY.md) for dated checks. Server updates and health verification are documented in [DOCKER.md](DOCKER.md); GitHub deployment records are owner attestations, not server revision checks.
