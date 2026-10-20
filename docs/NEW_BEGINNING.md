> Historical reset record. See IMPLEMENTATION.md and README.md for the current rebuilt app.

# New beginning

The user requested a React PWA reset with the old files in `.old` while retaining mockups and assets. Next.js was already React-based; this change removes its server runtime and conventions in favor of a static Vite app.

## Archive and recovery

All former project-root entries except `public`, `mockups` and Git metadata were moved into `.old`. Old `public/sw.js` and `public/manifest.webmanifest` were also moved there; all visual assets remain at their original URLs. Local font files were copied to `public/fonts`. No archive content was deleted. To restore, first stop the dev server, preserve the new source/configuration separately, and restore the corresponding `.old` entries. Never blindly merge dependency installations or service workers.

The archive includes old heat calculations, weather validation, planning logic, SQL and tests for deliberate reuse. None are imported by the new runtime.

## Implementation order

1. Match `mockups/mobile/08-onboarding.png` and the approved desktop/mobile references with reusable accessible components.
2. Connect weather with explicit loading/error/offline states. Moving away from Next means `/api/weather` no longer exists; choose direct Open-Meteo browser requests or a separately deployed server function. Preserve stale-data rules and validation from the archive.
3. Rebuild planning, directory/map, guides, updates and preferences incrementally. Reuse verified pure domain logic and meaningful tests after review.
4. Connect Supabase/PostGIS and moderation separately. Keep service-role credentials on a backend. Permission and install prompts remain optional.

## PWA behavior

The build generates a new Workbox `sw.js` and manifest; assets are revisioned, `index.html` is the navigation fallback, and fonts plus the welcome illustration/wordmark are precached. Large mockup/marketing/reference files are not bulk-precached. A user-triggered update prompt avoids forced reloads. Test using the production preview after building; service workers are disabled for development. The new worker uses the same scope/URL as the previous worker, permitting replacement on a future production visit. Existing old caches may remain in upgraded browsers; clean those only after verifying migration on the actual deployment.

## Verification limits

Production build and type checking are required. Device installation, offline reload and deployment-route behavior must also be checked against the selected host before release. This foundation is not the former feature-complete app.
