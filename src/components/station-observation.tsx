import {useEffect, useState} from 'react';
import {useApp} from '../state';
import {isStale} from '../lib/heat';
import {dateLabel} from '../lib/weather';
import {freshnessLabel, timestamp} from '../lib/time';
import {observationArea, validObservation, type Observation} from '../lib/observations';

export function StationObservation() {
  const {city, units, weather, online} = useApp();
  const [attempt, setAttempt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [state, setState] = useState<{key: string; result?: Observation; loading: boolean; error?: string}>({key:'',loading:false});
  const key = city ? `${city.latitude},${city.longitude}` : '';
  const supported = !!city && observationArea(city.latitude, city.longitude);
  const stationTemp = (value: number) => units === 'F'
    ? `${((value * 9) / 5 + 32).toFixed(1)}°F`
    : `${value.toLocaleString('en', {maximumFractionDigits:2})}°C`;
  useEffect(() => {
    if (!supported) return;
    const refresh = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) setAttempt(n => n + 1);
    }, 5 * 60_000);
    return () => clearInterval(refresh);
  }, [supported]);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!city || !supported) return;
    const controller = new AbortController();
    let active = true;
    setState(previous => ({key, result: previous.key === key ? previous.result : undefined, loading:true}));
    const timeout = setTimeout(() => controller.abort(), 18_000);
    const params = new URLSearchParams({lat:String(city.latitude),lon:String(city.longitude)});
    fetch(`/api/observations/pagasa?${params}`, {signal:controller.signal, cache:'no-store', headers:{Accept:'application/json'}})
      .then(async response => {
        if (!response.ok) throw new Error('Station service unavailable');
        const data: unknown = await response.json();
        if (!validObservation(data)) throw new Error('Invalid station response');
        if (active) setState({key,result:data,loading:false});
      }).catch(() => {
        if (active) setState(previous => ({...previous, loading:false,error:'Station readings could not be refreshed.'}));
      }).finally(() => clearTimeout(timeout));
    return () => {active = false; clearTimeout(timeout); controller.abort();};
  }, [key, supported, attempt, weather?.fetchedAt, online]);
  if (!supported) return null;
  const current = state.key === key ? state : {key,loading:true};
  const result = current.result;
  const station = result?.station;
  const ageStale = station && Object.values(station.readings).some(r => r &&
    (clock - Date.parse(r.observedAt) > 2 * 3600_000 || Date.parse(r.observedAt) > clock + 5 * 60_000));
  const stationTemperature = station?.readings.temperature;
  const comparable = !staleReading(stationTemperature, clock) && stationTemperature && weather && !isStale(weather, clock) &&
    Math.abs(timestamp(weather.current.time) - Date.parse(stationTemperature.observedAt)) <= 30 * 60_000;
  const cacheStale = result?.retrievedAt && clock - Date.parse(result.retrievedAt) > 5 * 60_000;
  const stale = !online || !!current.error || result?.status === 'stale' || ageStale || cacheStale;
  return (
    <section className="station-observation" aria-labelledby="pagasa-observation-title">
      <h2 id="pagasa-observation-title">Nearby PAGASA station</h2>
      <p className="source">Automatic weather station · separate from the forecast estimate</p>
      {current.loading && <p role="status">Checking station readings…</p>}
      {station ? <>
        <p><strong>{station.name}</strong> · {station.distanceKm.toFixed(1)} km away, straight-line</p>
        {stale && <p className="error-text" role="status">Saved or out-of-date station reading. Do not treat this as current conditions.</p>}
        {current.error && <p role="status">{current.error} Showing the last retrieved station reading.</p>}
        <dl className="station-readings">
          {(['temperature','heat_index','humidity'] as const).map(key => {
            const reading = station.readings[key];
            return <div key={key}>
              <dt>{key === 'temperature' ? 'Air temperature' : key === 'heat_index' ? 'Station heat index' : 'Humidity'}</dt>
              <dd><strong>{reading ? key === 'humidity' ? `${reading.value}%` : stationTemp(reading.value) : 'Not reported'}</strong>
                {reading && <small>Observed {dateLabel(reading.observedAt,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} PHT{reading.stale ? ' · out of date' : ''}</small>}
              </dd>
            </div>;
          })}
        </dl>
        {result?.retrievedAt && <p className="source">{freshnessLabel(result.retrievedAt, clock)} by the server. Observation times are shown separately above.</p>}
        {comparable && !stale && <p className="source">
          Station air temperature is {Math.abs(stationTemperature!.value - weather!.current.temperature).toFixed(1)}°C {stationTemperature!.value >= weather!.current.temperature ? 'above' : 'below'} the model estimate for your selected location ({dateLabel(weather!.current.time,{hour:"numeric",minute:"2-digit"})}, {weather!.timezone || "Asia/Manila"}). Times are within 30 minutes; locations differ. This is a comparison, not a correction or accuracy score.
        </p>}
        <p className="source">A reading at this station, not your exact address. Automated data may have gaps or errors. Station values are not averaged into the forecast or used to change planner rankings.</p>
      </> : !current.loading && <p role="status">{result?.status === 'no_nearby' ? 'No usable station reading within 50 km. Your forecast remains a model estimate.' : 'PAGASA station readings are unavailable. Your forecast remains a model estimate.'}</p>}
      {!current.loading && <button type="button" className="button text" onClick={() => setAttempt(n=>n+1)}>Recheck station</button>}
      <p className="source"><a href="https://www.panahon.gov.ph/" target="_blank" rel="noreferrer">View PAGASA PANaHON</a> · <a href="https://www.pagasa.dost.gov.ph/weather/heat-index/" target="_blank" rel="noreferrer">PAGASA heat-index reports</a></p>
    </section>
  );
}

function staleReading(reading: {observedAt: string; stale: boolean} | undefined, now: number) {
  return !reading || reading.stale || now - Date.parse(reading.observedAt) > 2 * 3600_000 || Date.parse(reading.observedAt) > now + 5 * 60_000;
}
