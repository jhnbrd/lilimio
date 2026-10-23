# lilimio.

**Know the heat. Find your shade.**

Know the heat wherever your day takes you. Compare forecasts, plan outdoor time, and find nearby places to cool down.

**[Open the app](https://lilimio.jhnbrd.com)** · [Server operations](docs/DOCKER.md) · [Releases](docs/RELEASING.md)

## Features

- Nearby PAGASA automatic-station readings for Philippine locations, with distance, timestamps, and stale/unavailable states.
- Air temperature, estimated heat index, and three-day forecasts with source and freshness labels.
- Experimental activity-window comparisons and locally saved plans.
- Worldwide city search and community-mapped parks, indoor places, and drinking-water points.
- Searchable safety guides, offline reading, installation, and update prompts.
- Responsive layouts, Celsius/Fahrenheit, and reduced-motion preferences.

Forecasts are Open-Meteo model estimates, not PAGASA observations or official advisories. Planning is not a validated safe-exposure limit. OpenStreetMap places have unverified access and facilities; unknown details stay unknown. Failed requests never receive fabricated live data.

## Development

Use Node.js 22.12+ (Node 24 recommended) and npm:

```sh
npm ci
npm run dev
```

For PAGASA station data locally, also run `npm run observations` in a second terminal. Vite proxies `/api/observations/` to localhost:8090.

Before committing:

```sh
npm test && npm run typecheck && npm run build
```

`npm run preview` serves the production build in `dist/`. PWA installation and service workers require HTTPS or localhost.

## Deployment

The app is manually hosted on a Debian home server with Docker Compose and Nginx. An existing tunnel exposes [lilimio.jhnbrd.com](https://lilimio.jhnbrd.com). GitHub Actions only records completed manual deployments; it does not deploy the app. See [server setup, updates, and recovery](docs/DOCKER.md).

## Code and data

| Location | Purpose |
| --- | --- |
| `src/pages/` | App screens |
| `src/lib/` | Forecast, heat, planner, storage, and content logic |
| `src/state.tsx`, `src/pwa.tsx` | Shared state and PWA lifecycle |
| `tests/` | Domain and data-validation tests |
| `public/` | Preserved public assets |
| `mockups/` | Approved mobile and desktop references |
| `supabase/` | SQL foundation; no active backend connection |
| `.old/` | Ignored recovery archive; never imported at runtime |

React + TypeScript + Vite, MapLibre, Motion, Anime.js, and GSAP. Forecast, directory, and map requests run in the browser. A small Node sidecar caches public PANaHON station observations and exposes a same-origin API. Plans and preferences stay in browser storage; no sign-in or analytics integration is required. `VITE_` values are public: never put secrets there.

Official advisory synchronization, automatic Web Push, remote reports, moderation, and Supabase authentication are not connected. Local drafts do not send notifications or reports.

## Documentation

- [Worldwide weather and accuracy](docs/WEATHER_ACCURACY.md)
- [Current scope and verification history](docs/IMPLEMENTATION.md)
- [Directory sources and limitations](docs/RELIEF_DIRECTORY.md)
- [Animation ownership and cleanup](docs/ANIMATION_SYSTEM.md)
- [Mobile viewport behavior](docs/IOS_VIEWPORT.md)
- [Public notices and install reminder](docs/PUBLIC_NOTICES.md)
- [Versioning and release process](docs/RELEASING.md) · [Changelog](CHANGELOG.md)

`NEW_BEGINNING.md` and `RESET_VERIFICATION.md` in `docs/` are historical records.

## Terms and attribution

[Terms](TERMS.md) · [Privacy](PRIVACY.md) · [License](LICENSE.md) · [Third-party notices](THIRD_PARTY_NOTICES.md)

Application rights are reserved; third-party assets and dependencies retain their respective licenses.
