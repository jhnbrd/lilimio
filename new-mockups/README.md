# lilimio. — new mockups

Viewport-first UI/UX overhaul concepts, created 24 October 2026. These are design references for the v0.4.0 implementation; the running app includes subsequent layout refinements.

Open [the gallery](index.html) in a browser, or inspect the PNG files directly. Read [the design brief](DESIGN_BRIEF.md) for screen budgets, tokens, short-screen behavior, and accessibility requirements.

## Image boards

| Board | Format |
| --- | --- |
| [Today, forecast and station details](mobile/01-today-forecast-station-v2.png) | Mobile |
| [Plan setup, comparisons and saved plans](mobile/02-planner-comparison-saved.png) | Mobile |
| [Relief map, paged list and place detail](mobile/03-relief-map-list-place-v2.png) | Mobile |
| [Guide library, paginated reading and updates](mobile/04-guides-reader-updates.png) | Mobile |
| [More, settings and installation](mobile/05-more-settings-install.png) | Mobile |
| [Onboarding and location selection](mobile/06-onboarding-location-consent.png) | Mobile |
| [Offline recovery, updates and compact dialogs](mobile/07-offline-notices-and-pickers-v2.png) | Mobile |
| [Compact-height Today, guides and settings](mobile/08-compact-viewport.png) | Mobile |
| [Desktop Today overview](desktop/01-today-v2.png) | Desktop |
| [Desktop planner comparison](desktop/02-planner-v2.png) | Desktop |
| [Desktop relief directory](desktop/03-relief-v2.png) | Desktop |
| [Desktop guide library and reader](desktop/04-guides-v2.png) | Desktop |
| [Desktop preferences and detail dialog](desktop/05-settings-v2.png) | Desktop |

The mobile boards show related views side by side, not multiple panels inside one phone. Desktop boards show one complete desktop application view. Weather, station values, dates, saved records, and counts are illustrative; “Concept · sample data” is a review label, not production interface content.

## What changes in this direction

- Today: primary model reading and brief risk guidance; compact nearby-station entry opens a station dialog.
- Forecast: bounded hourly/daily summaries and paging; detailed hours open separately.
- Planning: concise inputs and two understandable comparisons; the rationale is behind a labeled action.
- Directory: bounded map or paged results, concise place facts, explicit unknown access/facilities.
- Guides and legal text: sectioned readers with Previous/Next; no clipped articles.
- Saved lists, settings categories, and updates: small pages, clear continuation, no endless list.
- Installation and onboarding: short optional steps; device location and consent remain explicit.
- Recovery: one reserved status/notice slot; no competing notice stack over controls.

## Limits and next review

These are raster design concepts, not tested responsive layouts. A screen fitting the image is not evidence of fit at every viewport, large-text setting, language, or keyboard state. Exact typography, icons, selection states, and small generated text must be reconciled against the written brief before implementation. The brief and actual data contracts take precedence over incidental image details.

The default-text target is a single non-scrolling viewport, using content pagination and short dialogs. Accessibility enlargement must retain all text and actions: repaginate/reflow rather than shrink, hide, or disable zoom. See the brief's fallback rule for exceptional device constraints.

Generated with the built-in image generation tool. Generation and correction prompts are saved in [source-prompts/prompts.json](source-prompts/prompts.json). Public assets and the existing `mockups/` folder are preserved. No production release, deployment, or source-code changes are part of this mockup task.

The selected set contains 13 boards: eight mobile boards (including compact-height adaptations) and five desktop views. PNG integrity and gallery links were checked.
