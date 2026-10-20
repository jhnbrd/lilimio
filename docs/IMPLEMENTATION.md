# React PWA implementation

## Debian Docker configuration (2026-10-20)

Added a Node 24 build stage and an unprivileged Nginx static runtime, Compose binding `127.0.0.1:8063:8080`, SPA deep-link fallback, PWA update/cache handling, health check, read-only root and bounded logs. The existing host tunnel remains separate. `.dockerignore` excludes copied Windows dependencies, archives, design references, local secrets and generated output; Docker installs Linux dependencies from the lockfile. See DOCKER.md for later Debian commands and the localhost assumption for the tunnel agent.

Compose validation, all 34 application tests, typecheck and local production compilation passed. No Docker image build, container start or tunnel changes were performed, as requested. Container/Nginx startup and live tunnel verification are deferred to the user's Debian run.

## Public notices and home-screen reminder (2026-10-20)

Added public-use terms, privacy/storage details, source licensing and a rights-reserved application LICENSE.md, with shared offline-readable pages and onboarding/Settings links. The final onboarding review records a versioned local acknowledgement only after an explicit unchecked-by-default agreement. Public guides remain accessible without setup. The storage notice accurately describes essential browser storage; no analytics or advertising integration was added.

The generated-icon home-screen reminder supports session Close, persistent “Don't show again,” and Settings reset. Standalone/iOS home-screen detection and appinstalled suppress it. A single reduced-motion-aware notice slot prevents competing cookie/storage, install, update and toast cards. See PUBLIC_NOTICES.md for exact behavior and publication review items.

All 34 tests, typecheck and production build passed. Browser verified storage acknowledgement/reload, reminder session dismissal/reload, persistent opt-out in a fresh tab, reset, in-place terms reading, unchecked/disabled onboarding completion, and mobile/desktop notice layouts without horizontal overflow in the checked 390px and 1280px views. Browser error/warning log was empty. The final disabled agreement button has a distinct muted appearance. Actual terms acceptance and native installation were intentionally not performed; installed-mode logic is unit-tested, with physical-device verification still outstanding. Existing map-chunk/shared-import build warnings remain.

## Global directory API (2026-10-20)

Find relief now uses real OpenStreetMap places via Photon and worldwide city search via Open-Meteo / GeoNames. The global directory location is independent of Philippine weather. Category-specific searches, per-city/category caches, source metadata, validated saved-place snapshots, and legacy-bookmark support replace the hardcoded three-place directory. See RELIEF_DIRECTORY.md for coverage, uncertainty, provider policy, attribution and production requirements.

Verified actual API results for Davao (35 places with the final category query), London, and 15 London drinking-water points; saved-record reload; grouped map pin → chooser → actual place detail → back; and mobile/1440px desktop layouts with no horizontal overflow. All 30 tests, typecheck and production build passed. Grouping uses projected screen coordinates and retains every place; map interactions make no extra directory API calls.

## Map rendering recovery (2026-10-20)

MapLibre's lazy CSS applied `position: relative` to the same element as our `.map-canvas`, overriding its absolute positioning and collapsing the container to zero height. The scoped `.relief-map > .map-canvas` rule now fixes its position and dimensions regardless of stylesheet arrival order. This restores rendered tiles, markers, and controls on mobile and desktop.

The map can now retry initialization after a failure. Successful idle/load events clear a recoverable error overlay, and graphics-context loss exposes the recovery control. Place-access uncertainty remains explicit because this starter directory has no verified hours/facility feed.

Browser verification: visible Davao streets and markers, marker → correct place details → back, cooling-space filter, nonzero canvas bounds (345 × 230px mobile, approximately 694 × 430px desktop), no horizontal document overflow at 1440px, and no browser errors. All 20 tests, typecheck, and production build passed. Native device/network-loss testing remains separate.

## Refresh recovery (2026-10-20)

The reported localhost:3000 failure was reproduced in an archived Next.js screen still loaded from its offline cache while no local server was running. The current Vite production build is now served on that port, and its offline update was activated through the app's update prompt.

Today now exposes a refresh control beside the source on mobile and desktop. Requests bypass the browser HTTP cache, keep existing readings during loading, and show an explicit completion message explaining that model values can remain unchanged. Cached-data refresh failures are visible with a retry action instead of being hidden behind the saved forecast. Automatic revalidation does not produce manual-refresh success notifications.

Verified a real Davao refresh through loading → updated source time → success confirmation in the browser. All 20 tests, `npm run typecheck`, and `npm run build` passed. Build warnings about the existing lazy map chunk and shared forecast import remain unchanged.

## Visual contract

Direction: **spacious, warm, practical**. The canonical references are `mockups/mobile/01–08` and `mockups/desktop/01–07`, plus `mockups/references/UNIVERSAL_PREMIUM_UI_UX_GUIDELINES.md` (particularly section 29). The implementation uses the approved forest/ivory palette, Plus Jakarta Sans, custom raster wordmark, Lucide icons, scenic illustration edges, generous mobile gutters, readable controls, and single-task hierarchy. Forecast numbers, dates and facility names are real/explicitly labeled data rather than fixed screenshot contents, so they will naturally differ from the boards. Pixel-perfect identity at every browser/font/data state has not been claimed.

## Reference mapping

| Reference | Routes and behavior |
| --- | --- |
| Daily planning | `/`, `/plan`: heat summary, source, actions, picker rows, real comparisons |
| Location and relief | city dialog, `/explore`, `/explore/:id`: manual/device choice, map/list, details, directions, bookmarks |
| Guides and updates | `/more`, `/learn`, `/learn/:id`, `/updates`: searchable guides, source separation |
| Forecast | `/forecast`: hourly/daily, readable chart data, hour details, source |
| Plans and reading | `/saved`, guide detail: local plans, recheck, removal, download/read |
| Preferences and install | `/settings`, `/settings/install`, `/settings/notifications`, `/settings/privacy` |
| Offline and recovery | missing/stale/cached forecast states, retry/change-location, correction draft form |
| Onboarding | `/welcome`: welcome, city choice, final review; location optional, no accounts |
| Desktop boards | sidebar, split Today/forecast/planner/directory/reading/settings layouts |

## Accessibility and motion

Native buttons, links, forms, selects and modal dialogs; visible keyboard focus; labels and readable chart-value alternative; dialog Escape/focus return; route focus and scroll handling; meaningful error/empty states; safe-area mobile navigation. Text/controls grow with content and detail views scroll naturally. Reduced motion works via device preference and an explicit local setting across Motion, Anime.js, GSAP and CSS. No autoplay loops, scroll hijacking or artificial loading delay.

## Data behavior

Direct Open-Meteo requests are canceled on location change and time out at 15s. Payloads and cached values are checked, incomplete readings fail, and caches are coordinate-specific. Three complete hourly days support daily peaks. The copied/reviewed NOAA method and activity logic live under `src/lib`, not in `.old`. The planner checks full-window coverage, current retrieval/model times, actual absolute category, UV, rain and preference mismatch. Saved plans keep the original forecast time and city for rechecking.

Weather city coverage is six named Philippine cities; weather device coordinates support locations within the Philippine bounding region. Directory city searches cover international locations independently; place coverage depends on OpenStreetMap/Photon. Map tiles require internet. The map worker is bundled with Vite's documented `?worker&url` import for MapLibre 6.

## Verification record

- TypeScript checks and production Vite/PWA build passed during implementation.
- 20 tests passed: NOAA example/screening, boundaries, invalid inputs, planner ranking/full duration/past/stale/gaps, future timestamps, provider parsing, incomplete/null data, coordinate caches, daily coverage and blocked/malformed browser storage.
- Browser verified three-stage onboarding and explicit location choice, successful live weather retrieval, picker dialogs with focus return, a real walking comparison and saved plan, guide download/list, units and reduced-motion settings, map loading, place bookmark and locally saved correction draft.
- Responsive harness inspected nominal 320, 360, 390, 768, 1024 and 1440px widths. Checked views had no horizontal document overflow. Native scrollbar gutters reduce available content width by 15px in this test environment. A 320px More screen also reflowed at 200% root text size. This is a scoped visual/DOM check, not an assertion that every content/state/device combination has been audited.
- `qa.html` is a development-only iframe inspection harness, ignored and excluded from the build. Archived files, marketing boards and `.old` are not imported by the runtime.

Physical-device installation, cross-browser/assistive-technology review, complete WCAG conformance, public-host rewrites and scientifically validated exposure recommendations still require their respective deployment/device/domain checks. Official advisory/push/report/admin integrations remain unconfigured, as clearly shown in their screens.

## Sources reviewed

- [Open-Meteo forecast API](https://open-meteo.com/en/docs)
- [NOAA/NWS heat-index equation](https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml)
- [WHO heat and health](https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health)
- [MapLibre installation / Vite worker](https://maplibre.org/maplibre-gl-js/docs/)

No deployment or social-media publishing was performed.

Final production build: 60 revisioned precache entries, approximately 5.8 MB before transfer compression. Map code and animation engines are split into separate chunks. Vite reports a large lazy map chunk; no compilation error. npm audit reported zero vulnerabilities.

Production offline-cache check: after stopping the preview server, the /learn/outdoors deep link reloaded with its full guide content, fonts and illustration from cache. The preview server was then restarted for review at http://localhost:4180/. This verifies server-unavailable recovery; full network-disconnection and physical-device checks are separate.


## Mobile frame refinement (2026-10-19)

See IOS_VIEWPORT.md for the fixed app frame and verified conditional scrolling. Mockup matching refined Today artwork, four-row More menu, compact Settings, mobile map plus one preview, and decorative scenes outside document flow. Full pixel-level parity across every state is not asserted.

