# Data sources & third-party notices

Updated 20 October 2026

## Public data, free public access

lilimio. makes its public features available free of charge. Public data remains subject to attribution, licensing and provider usage conditions. It is not all public domain. This project’s source-code license does not replace those conditions or grant rights to third-party material.

## Weather — Open-Meteo

Weather model data is supplied by [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). lilimio. calculates heat index and activity comparisons from the returned weather values; those derived estimates are not provider-issued warnings. Forecast screens identify the source and retrieval time. [Free API service terms](https://open-meteo.com/en/terms) restrict use to eligible non-commercial applications and impose request limits. Free access to the app does not itself guarantee eligibility for that service tier.

## City names — GeoNames / Open-Meteo

Worldwide city search uses the [Open-Meteo geocoding API](https://open-meteo.com/en/docs/geocoding-api), based on [GeoNames](https://www.geonames.org/), which provides its data under CC BY 4.0. Search results are locations, not a verification of relief facilities.

## Places and map data — OpenStreetMap

© OpenStreetMap contributors. Map and place records are licensed under the [Open Data Commons Open Database License (ODbL)](https://www.openstreetmap.org/copyright). Attribution and applicable database share-alike obligations remain in force. Place details link to the original OSM record. A category or map pin does not verify current access, cooling, hours or water quality.

## Place search and maps

Place search is provided by [Photon by komoot](https://github.com/komoot/photon), using OpenStreetMap data. Its public demo service permits reasonable use and can throttle or block excessive requests; availability is not guaranteed. Map rendering uses MapLibre GL JS with [OpenFreeMap](https://openfreemap.org/quick_start/) and OpenMapTiles / OpenStreetMap data. On-map attribution is retained. Provider changes or larger usage may require different hosting or paid services.

## Health and official references

The [NOAA / NWS heat-index method](https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml) informs calculations. Educational guidance links to [WHO heat and health](https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health). [DOST-PAGASA](https://www.pagasa.dost.gov.ph/) is an official Philippine reference. These organizations do not endorse lilimio. Reference links do not mean live official advisory synchronization or a license to redistribute all of those organizations’ materials.

## Fonts, software and artwork

Plus Jakarta Sans is by the Plus Jakarta Sans Project Authors, under the SIL Open Font License 1.1. The complete bundled font notice appears below. Runtime dependencies retain their respective upstream licenses, including React, React Router, Motion, Anime.js, GSAP, Lucide, MapLibre GL JS and Workbox. Their complete distributed package notices are retained with the project’s dependency installation; this page is not a replacement for those licenses.

The custom lilimio. wordmark, brand assets and illustration references are separate from the font and map-data licenses. No general reuse license is granted to the brand or artwork by this notice. See the [application license](/legal/license).

## PAGASA PANaHON station observations

Nearby Philippine automatic-station readings are retrieved from [PAGASA PANaHON](https://www.panahon.gov.ph/) through this app’s server adapter. They retain provider-reported values, station identity, distance, observation times, and automatic-station limitations. Public website availability is not a claim of an official partnership or unrestricted redistribution license. The feed is undocumented and may change; supported ongoing access and terms should be confirmed with PAGASA. See [PAGASA heat-index reports](https://www.pagasa.dost.gov.ph/weather/heat-index/) for the agency’s data-quality notices.

## Optional place photographs

Place photos are resolved through an exact OpenStreetMap record’s Wikimedia Commons file link or Wikidata P18 statement, using the read-only Overpass service. [Wikidata structured data](https://www.wikidata.org/wiki/Wikidata:Licensing) is available under CC0; photographs have their own individual licenses. The app requests [Commons image metadata](https://www.mediawiki.org/wiki/API:Imageinfo) and displays an author credit, original file link and license link beside every accepted photo. Missing attribution or unsupported reuse metadata prevents display. Photo availability and association do not verify current facilities. The app does not assert ownership or general public-domain status for Commons photographs.
