# Worldwide relief directory

The directory uses existing OpenStreetMap data via [Photon](https://github.com/komoot/photon), with international city search through [Open-Meteo / GeoNames](https://open-meteo.com/en/docs/geocoding-api). No account, API key, paid subscription or backend service was provisioned.

In Find relief, select a city using the location button, then choose **Find nearby places**. A new city selection searches automatically. The text field filters loaded place names and addresses. Selecting a category performs a bounded category-specific query when necessary, so a dense park dataset does not crowd water points out of the result limit.

## Data contract

- Search radius: 3 km from the chosen city centre. Up to 50 results per API/category search, sorted by straight-line distance. This is a subset of mapped POIs, not an exhaustive inventory or walking-distance calculation.
- Categories: `leisure=park/garden`, `amenity=library`, `shop=mall`, and `amenity=drinking_water`. Generic community centres were excluded because the broad tag can include institutions unsuitable as public relief destinations.
- Node, way and relation IDs retain separate namespaces. Each place links to its actual OpenStreetMap record and displays the retrieval time.
- Photon is a search index and may omit OSM features, especially unnamed features, and most detailed tags. An empty category does not establish that no facilities exist locally. Returned geometry represents a point or centroid; it may differ from a public entrance.
- Categories do not certify cooling, shade, free entry, public access or water quality. Missing information remains “not mapped.” Opening hours, access, fees, shade and air conditioning are shown only if supplied as extra tags. Explicit private/no/permit/employee/military access and nonpotable water tags are excluded when supplied. A library without access metadata still requires checking before a visit.
- No fabricated entries replace failed requests. The earlier three Davao samples are retained solely to resolve existing numeric bookmarks and are labeled as unverified starter listings.

## Requests, caching and saves

Place queries run on user actions, not every pan or keystroke. The app caches the most recent eight city/category searches locally. Cached results are available without a new request; results older than 24 hours are labeled for refresh. Explicit refresh revalidates. Searches cancel when superseded and time out after 30 seconds. On failure, same-search cached results remain visible with an error; unrelated-city results are never shown under a different city.

Nearby screen-space pins are grouped into count buttons to keep small maps readable. Groups update after zoom/pan without making place API calls. Selecting a group opens the accessible place chooser; every member retains its exact source coordinates and detail record.

Saved places keep a validated source snapshot independently of search caches. Existing numeric bookmarks continue to work. Detail URLs resolve locally from the current/cached/selected/saved records; sharing an uncached record URL to another device is not yet a live single-record lookup.

Global directory selection is independent of the Philippine weather location. Precise GPS coordinates are not automatically reused for directory searches. Provider/source links and coordinate-sharing copy are visible in the flow and privacy settings.

## Provider and license

[Photon's public-server policy](https://github.com/komoot/photon#demo-server) allows reasonable project usage, offers no availability guarantee, and requires large deployments to use their own instance. This direct-browser integration is suitable for the current local prototype. Before a public launch with substantial traffic, use a managed OSM places provider or a backend/Photon instance with shared caching, monitoring and rate limits. Do not treat the community endpoint as a guaranteed emergency service.

[OpenStreetMap attribution and ODbL](https://www.openstreetmap.org/copyright) apply to the place data. The UI credits OSM contributors separately from the existing OpenFreeMap/OpenMapTiles map attribution. The app does not silently submit corrections to OSM; correction drafts remain local.

Overpass was evaluated first. Private.coffee and other tested Overpass endpoints timed out from this environment; Photon returned live results and was selected instead. No automatic provider hopping or broad worldwide scraping was implemented.

## Verification

Unit tests cover bounded international queries, category isolation, real OSM identities, coordinate/response validation, explicit access exclusions, no invented cooling/shade/hours, failure/cancellation, country-disambiguated city search and bookmark migration/persistence. Browser checks used actual Davao and London responses, including a category-specific London drinking-water query and saved-record reload. Provider test fixtures are confined to tests and never used as runtime fallback data.

Final automated checks: 30 tests passed, `npm run typecheck` passed, and `npm run build` passed. Existing large-map-chunk/shared-forecast-import build warnings remain.
