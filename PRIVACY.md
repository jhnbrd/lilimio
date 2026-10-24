# Privacy & storage

Updated 24 October 2026 · Version 2026-10-24

## No account required

This version of lilimio. has no sign-in, advertising or analytics integration. The app itself does not set cookies. It uses browser local storage, session storage and an offline service-worker cache for the features described here. The storage notice acknowledges these existing practices; it does not enable optional tracking.

## What stays on this device

Chosen city and coordinates, temperature units, motion preference, onboarding acknowledgement, storage-notice choice, install-prompt preference, saved plans, place bookmarks, downloaded-guide lists and correction drafts are stored in this browser. Weather and recent directory results are cached locally. Closing the install reminder lasts for this browser-tab session; “Don’t show again” lasts until reset or this site’s data is cleared. These preferences are not synchronized between devices.

Local items generally remain until removed, overwritten by newer cache entries or cleared by you or the browser. Directory cache is limited to eight searches; entries older than 24 hours are marked stale. Cached weather shows its retrieval time and stale status. Correction drafts remain local and are not submitted. Files you separately download remain on your device even after clearing site data.

## What leaves your device

Weather requests send the chosen coordinates to Open-Meteo. If you choose device location, your browser requests permission first; resulting coordinates are used for the weather request and saved chosen location. You can choose a city manually instead. Location searches (cities, streets, barangays and districts) send your search text to Photon by komoot for OpenStreetMap results. A map pin loads OpenFreeMap resources. The chosen coordinates are saved locally and sent to Open-Meteo for forecasts. The relief directory starts from your forecast location when no previous directory area is saved; you can explicitly reuse the forecast location or choose a different search area. Nearby-place searches send that selected area’s coordinates to Photon. No background GPS tracking is performed.

For selected weather coordinates within the Philippine coverage area, the browser also requests nearby PAGASA observations from this app’s server. The server uses those coordinates to select a station within 50 km from a cached nationwide PANaHON feed; it does not send your coordinates to PAGASA. It keeps station data in memory for a five-minute refresh cache (retaining a labeled last successful snapshot for up to 24 hours if the provider fails). It stores no location history. Query access logging is disabled for this endpoint in the supplied Nginx configuration; outer hosting/tunnel logs remain subject to their own settings.

When you choose **Find a place photo**, this app’s server receives the selected OpenStreetMap record ID and checks that exact record through Overpass, then its explicitly linked Wikidata / Wikimedia Commons image. These lookups do not send your GPS location or browser IP address to those providers; loading a returned thumbnail connects your browser to Wikimedia. Photo metadata is held in a bounded server-memory cache for up to 24 hours; no photo-search history is stored. External services receive normal connection information and may keep their own logs.

Map requests go to OpenFreeMap and its map resources. Directions open Google Maps only when chosen. Following a source link opens that provider’s website. External services and the website host receive standard connection information, such as your IP address and request details, and may keep logs under their own policies. lilimio. does not control those logs or promise that external sites use no cookies.

## Your controls

Use Settings → Privacy & data to review this notice, reopen the storage notice or clear lilimio’s local saved items. Use your browser’s site-data controls to remove offline caches, service workers and any site cookies. Clearing app-local saved items alone does not remove the offline application cache or files already downloaded. Blocking browser storage can prevent persistence and offline features; the app will still let you browse with available functionality.

Device location permissions can be revoked in browser settings. Installation is optional. Install-reminder preferences can be reset in Settings → Install. Notification switches currently save a preference only; push delivery is not connected. No browser permissions are granted by accepting the storage notice or terms.

## Providers and changes

See [Open-Meteo terms and privacy](https://open-meteo.com/en/terms), [Photon’s public service information](https://github.com/komoot/photon), [OpenFreeMap](https://openfreemap.org/), and [Google’s privacy policy](https://policies.google.com/privacy). This notice describes this version’s behavior and will be updated if collection or integrations change.
