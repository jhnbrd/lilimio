# Changelog

Versions follow [the release policy](docs/RELEASING.md). Release publication and manual server deployment are separate events.

## 0.4.0 — Pending publication

- Forest/ivory design overhaul with responsive page shells, bottom-anchored footers, normal-sized controls, and focused detail dialogs.
- Available-space pagination for planning options, relief places and other lists; weather display scales with viewport height.
- Worldwide street, barangay, district and city search, optional GPS and map-pin selection, with an area-forecast accuracy disclaimer.
- Relief searches can reuse the selected forecast location; previous saved directory areas remain available.
- Five-minute in-memory location-search caching and corrected request/timeout cleanup.
- Optional exact-place Wikimedia photo lookup with attribution, bounded caching and explicit unavailable states.
- Shared interaction motion with reduced-motion support, updated onboarding and source/privacy documentation, and design reference boards.

This release requires rebuilding both Compose services. No server update is performed by pushing source or preparing its release.

## 0.3.0 — 2026-10-23

- Worldwide weather city/device selection with local forecast/planner times and DST-aware timestamps.
- Settings version/build identity and uncached server build metadata; Docker revision stamping.
- Visible retrieval age, model-valid time, location, stale/offline/error labels, and official-source explanations.
- Planner trade-off details, visible facility uncertainties, and explicit map-area search.
- On-demand maps and smaller offline downloads; guides remain precached.
- Pull-request/main quality checks, production-container smoke checks, and a 3 MiB offline budget.

- Nearby PAGASA automatic-station readings through a private Node sidecar, with per-reading times, cache/error handling, distance, and separately labeled model comparisons.

No server deployment or scientific accuracy validation is implied.

## 0.2.0 — 2026-10-22

First GitHub release of the existing React PWA, from commit `84e6cf4`.

- Live air temperature, estimated heat index, and three-day forecasts with freshness and source labels.
- Experimental activity comparisons, saved plans, and explicit stale/error recovery.
- Worldwide community-mapped relief directory and local bookmarks.
- Offline safety guides, PWA installation and updates, accessible responsive layouts, and reduced motion.
- Public terms/privacy notices and Docker Compose hosting configuration.

Forecasts are model estimates; plans are experimental; mapped facilities are unverified. Official advisory sync, Web Push, remote reports, moderation, and authentication remain unconnected.
