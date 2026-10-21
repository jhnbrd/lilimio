# lilimio.

**Know the heat. Find your shade.** A mobile-first Philippine heat-awareness React PWA, implemented from the approved mobile/desktop reference boards and UI/UX guidelines.

## Run locally

Requires Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm install
npm run dev
npm test
npm run typecheck
npm run build
npm run preview
```

Production files are generated in `dist/`. Service workers require HTTPS or localhost. Static hosting must rewrite application routes to `/index.html`, while serving asset URLs normally. `public/_redirects` provides Netlify-style SPA routing; adapt to the chosen host. No public hosting was provisioned.

For the existing `http://localhost:3000/` preview, run `npm run build`, then `npm run preview -- --port 3000 --strictPort` and keep that server running. Reload the tab and accept the app's **Update now** prompt when a new offline version is ready. A stopped server can leave an older cached interface visible, including the archived Next.js interface on browsers that previously used it.

## Debian home server

For the Debian home server, `compose.yaml` builds a production Nginx image and binds it to **http://127.0.0.1:8063**. Your existing tunnel handles public HTTPS separately. See [Docker instructions](docs/DOCKER.md) for the commands to run later; preparing the configuration does not start Docker.

## Implemented application

- Three-stage illustrated onboarding with optional city/device-location selection and a skip path. Deep-linked guides remain accessible without onboarding or accounts.
- Responsive desktop sidebar and mobile Today / Plan / More navigation. Forecast, directory, guides, updates, settings, saved items and downloads are exposed by name.
- Live Open-Meteo current model estimates and three days of hourly data, with NOAA/NWS calculated heat index. Daily peaks use complete days only. No illustrative weather is substituted for a failed request.
- Front-page air temperature alongside the estimated heat index on mobile and desktop, both following the selected Celsius/Fahrenheit units.
- City-specific browser caching, source/retrieval/model timestamps, cancellation, refresh, missing/stale/offline states and recovery actions.
- Experimental activity-window comparisons across heat, duration, intensity, UV, rain and preferred period. Inputs are preserved, past/incomplete/stale windows are excluded, and selected plans save locally. Recheck uses the plan's saved location.
- MapLibre/OpenFreeMap map with worldwide city search and live OpenStreetMap places through Photon: parks/gardens, libraries/malls, and mapped drinking-water points. Includes category searches, source links, coordinate-specific caching, accessible lists, directions, local bookmarks and correction drafts.
- Searchable WHO-linked safety guides, detailed reading, local download list and downloadable text files. All guide code/content and the app shell are precached for offline reading after the first successful online load.
- Forecast-derived updates separated from official-source links. Preferences for temperature units, motion, notification drafts, installation instructions and privacy/local-data controls.
- PWA install handling, update prompt, revisioned offline cache, app icons and Apple home-screen icon.
- Anime.js staggered copy, GSAP scene reveal, Motion route/notice/onboarding transitions, CSS hover/focus feedback. Reduced motion and React cleanup are respected.

## Data and integration boundaries

Public-use terms, privacy/storage information, source attribution and the rights-reserved application license are accessible in onboarding and Settings, and under `/legal/`. The storage notice describes essential browser storage without inventing tracking cookies. The optional home-screen reminder supports session dismissal, persistent opt-out and reset, and is hidden in standalone mode. See `docs/PUBLIC_NOTICES.md` for behavior and publication review requirements.

Forecast readings are **model estimates**, not PAGASA observations or official advisories. Heat index describes shade/light-wind conditions; direct sun, activity, clothing and actual conditions differ. The experimental planner is an explainable comparison, not a validated safe-exposure limit. Extreme-heat windows and high-heat exercise/work options are conservatively withheld by the comparison UI.

The relief directory loads **real community-mapped places**, not a verified cooling-centre registry. Each search covers up to 50 results within 3 km of a selected city centre. Access, hours, shade and air conditioning appear only when supplied; missing tags remain explicitly unknown. Water points reflect OSM tagging, not current water-quality inspections. Category icons do not imply facility photographs. The earlier three starter entries remain available only for legacy bookmarks.

Official advisory synchronization, automatic Web Push, remote correction submissions, moderator/admin tools and Supabase authentication/data are **not connected**. The mockups explicitly represent these unavailable states; local preferences/drafts do not imply alerts or reports were sent. The preserved `supabase/` SQL is a backend foundation, not a configured service. These integrations require actual service configuration and verified data before release.

Weather coordinates are sent from the browser to Open-Meteo after location selection. Directory city names go to Open-Meteo/GeoNames; the separately selected city centre goes to Photon for nearby places. Device GPS coordinates are not automatically reused for the global directory. Maps request third-party tiles. No sign-in or analytics integration is required. Never put secrets in `VITE_` variables. Review provider usage terms and validate the safety method before public deployment. See `docs/RELIEF_DIRECTORY.md` for API behavior, attribution and production scaling.

## Project structure

```text
src/
  App.tsx, state.tsx, pwa.tsx, motion.tsx, ui.tsx
  pages/        # Today, Forecast, Onboarding, Planner/Saved,
                # Explore, Learn/Downloads, Updates, Settings, More
  lib/          # heat calculation, forecast parsing, content, storage
  assets/fonts/ # locally bundled Plus Jakarta Sans
public/
  art/          # optimized complete reference boards, used only for art crops
  images/brand/lilimio/ # logo/icons/marketing assets, all retained
mockups/        # exact approved originals, desktop/mobile + guidelines
supabase/       # preserved SQL foundation; no active connection
tests/          # meaningful forecast/heat/planner tests
.old/           # recoverable original Next.js project, ignored, never imported
implementation-backup/ # React foundation before this implementation, ignored
```

The UI is built from semantic, responsive components. SVG viewboxes show **only illustration regions** of the approved boards; complete screen images are never used as functioning interfaces. Raw mockups, marketing/source-prompt files and archived application files are not included in the production copy step.

See `docs/IMPLEMENTATION.md` for the reference mapping and verification record, and `docs/ANIMATION_SYSTEM.md` for animation ownership. The earlier reset documents describe history, not the current feature scope.
