> Historical reset record. See IMPLEMENTATION.md and README.md for the current rebuilt app.

# React PWA reset verification

- Previous Next.js source, configuration, docs, SQL, tests, installation and build output preserved in .old.
- 8 mobile and 7 desktop reference boards retained; public visual assets retained.
- npm install completed; audit reported 0 vulnerabilities.
- npm run build passed TypeScript checking and Vite production compilation.
- Workbox generated manifest.webmanifest, sw.js and 18 precache entries.
- Browser verified welcome rendering, client navigation to /today, offline-ready notification and cached deep-route reload after preview server was stopped. Cached navigation back to welcome also succeeded.
- Phone-size visual inspection, physical-device installation, update lifecycle and deployed-host rewrites have not been verified.
- Forecast, planner, maps, guides and backend flows are intentionally unconnected in this fresh foundation. Prior implementations are in .old.
