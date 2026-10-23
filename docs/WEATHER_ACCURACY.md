# Weather coverage and accuracy

## What changed in 0.3.0

Weather now supports valid coordinates worldwide and worldwide city search. Previously, city/device coordinates outside the Philippine bounding box were rejected. Requests now use Open-Meteo's automatic local timezone and Unix timestamps; explicit per-reading offsets preserve local dates, planner windows, and daylight-saving changes. Old Philippine saved plans remain readable. The versioned forecast cache avoids mixing legacy timestamps with the new format.

This app assesses heat, not all weather hazards. The existing heat-index categories remain the app's categories; they are not locally issued advisories. Official alert synchronization is not connected.

## Current sources

- [Open-Meteo](https://open-meteo.com/en/docs): weather-model temperature/humidity plus hourly UV/rain; a current reading is a model estimate, not a station at the user's address. Provider model selection is automatic.
- [NOAA/NWS heat-index method](https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml): calculated from temperature and humidity for shade/light wind.
- [PAGASA heat-index reports](https://www.pagasa.dost.gov.ph/weather/heat-index/): separate Philippine official reference. PAGASA notes reported data may be corrected and automated-station readings may contain gaps, bias, or errors.
- [NWS API](https://www.weather.gov/documentation/services-web-api): a potential US observation/forecast source. It provides station discovery and observation endpoints; station quality varies and requests must identify the application.

The app links to official information under Settings → Weather sources & accuracy. The server adapter now ingests PANaHON automatic-station observations. Today displays nearby station readings separately and can show a temperature difference when observation/model-valid times are within 30 minutes. Different locations and a small time difference still limit interpretation: this is not scientific accuracy validation. NWS station ingestion remains unconnected. See [PAGASA integration](PAGASA_INTEGRATION.md).

## How to measure accuracy

1. Obtain a documented, authorized observation feed with station IDs, coordinates, elevation, observation times, units, and quality flags. A public chart or iframe alone is not a stable API contract. Confirm PAGASA access, redistribution terms, and historical availability before implementing an adapter.
2. Archive forecast snapshots with retrieval/issue time, valid time, coordinates, model selection, and lead time. Fetching a historical forecast after the fact is not the same as preserving what users originally saw.
3. Pair quality-controlled observations with forecasts for the same valid time and variable. Record time difference, station distance, elevation difference, and missing values. Choose and disclose matching tolerances before measuring; nearby does not automatically mean representative.
4. Compare air temperature and humidity first. Compute model/station heat index using the same method where inputs permit. Compare daily maximum with daily maximum, never with the current reading.
5. Report sample count, missing/invalid pairs, mean error (bias), mean absolute error, and root mean squared error. Break results down by station, lead time, season, and heat category; report uncertainty and sample limitations.
6. Validate any proposed bias correction on a separate time period. Adopt it only if it improves held-out results without masking dangerous misses. Do not average providers and call that more accurate.

A useful interface would show **Model estimate** and **Nearby station observation** separately, each with time, station distance, source, and quality state. A disagreement should stay visible; a missing station must not become a fabricated agreement.

## Further validation

The Debian adapter now handles public PANaHON data with caching, validation, provenance, and a request limit. Next obtain a supported access contract, verify station timestamp/units with the provider, add operational monitoring and a historical evaluation dataset, then evaluate model differences before any calibration. No scientific accuracy improvement, official partnership, or automated NWS observation feed is claimed.
