# Design implementation checks — 24 October 2026

The checks below use Chromium emulation. They do not establish physical-device frame rates or scientific accuracy.

## Automated checks

- TypeScript compilation and unused-local checks.
- 55 domain and adapter tests passed, including exact-place photo identity, safe attribution metadata, supported licenses, coalescing and failure backoff.
- Production Vite/Workbox build. Maps remain lazy-loaded and excluded from precache; the offline bundle remains below the existing 3 MiB budget.

## Browser checks

A temporary Playwright harness checked 15 routes at each of 320×568, 360×640, 390×844, 768×1024, 1024×768 and 1440×900. It measured both document width and actual main-content overflow after lazy routes finished loading. Additional checks cover hourly/daily views, official-source pagination, settings categories, and source/license passages.

Interaction checks at 320×568 cover activity pickers, comparison results and reasons, saving a plan, saved-plan summaries, populated relief lists, place details, facilities/source details, correction drafts, photo lookup failure, station Reading / Comparison / Sources tabs, city selection, dialog focus restoration, and reduced motion. The production guide also reloads and changes sections while offline. Onboarding steps retain an unchecked agreement and fit the small phone, large phone and desktop checks. Optional notices use a header entry and details dialog; transient feedback reserves its own slot.

At 200% text, the content remains reachable through the intended overflow escape; all six More destinations remain present. Layouts respond to the visual viewport for a keyboard, but physical iOS/Android keyboard behavior still needs device testing.

Browser-only weather, station and directory fixtures exercised deterministic populated and failure states. These fixtures are outside the application and are never runtime fallback data.

## External-service limits

Live read-only photo-provider requests timed out or were throttled in this environment. Exact OSM → Wikidata / Commons resolution, credit validation and error behavior passed fixture tests; live photo coverage remains unverified. An explicitly linked image can still be missing, outdated or incorrectly associated in community data. The app makes no facility-verification claim.

Docker is unavailable in this local environment. Existing container configuration was updated for the photo endpoint, but container rebuilding and server deployment were not performed here.

## Footer spacing correction

Reviewed Plan, More, Settings and Today at 390×875. Plan controls now use 56px minimum heights and ordinary 16px group spacing; Settings rows retain their natural height. Spare space follows the controls, with submission/provenance footers anchored above navigation. More cards size to their contents instead of filling the screen. The weather landscape is reflected independently of the text, placing the sun to the right of the reading. The 320×568 weather view was checked separately for overflow.

## Available-space pagination

Lists now measure their row heights and available main-content area, reserving space for following content and footers. Browser resize checks showed both planning options without pagination at 390×875 and 390×1000, and one option per page at 390×568. A populated relief fixture showed four rows at 390×875, one at 390×568 and five at 390×1000, without main-content overflow. The daily tab no longer gives the inactive hourly container spare height. Today scales its reading and weather panel with viewport height while retaining compact-screen sizing. The 90-route/viewport matrix and additional forecast/dialog checks passed.

## Precise location selection

57 automated domain/adapter tests pass, including location-coordinate preservation, address/barangay labels, deduplication, invalid results and provider failures. Browser fixtures verified searching and saving a barangay, one-time GPS selection, choosing and saving a map pin, and returning to search after a map-provider failure. Map interaction used a fixture style; these checks do not establish live geocoder coverage or GPS precision on physical devices. The 90-route/viewport matrix, additional view/dialog checks, type checking and production build passed. Map loading stays lazy; the existing large map-library bundle warning remains.

The disclaimer describes area estimates rather than claiming city-only inputs: forecast requests use the chosen coordinates, while the model supplies gridded estimates. See [Open-Meteo forecast documentation](https://open-meteo.com/en/docs) and [Photon search documentation](https://github.com/komoot/photon/blob/master/docs/api-v1.md). No server deployment was performed.

## Location search latency

A live Photon request for Davao returned HTTP 200 in 7.85 seconds from this environment; this is a single sample, not a latency guarantee. Search now cancels both debounce and request timeout timers on query changes, clears stale loading/error state, and keeps up to 50 successful searches in memory for five minutes. Repeated normalized queries reuse results without another provider request. 58 automated tests, type checking and production build passed. First-time provider latency remains external.
