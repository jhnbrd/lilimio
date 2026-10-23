import test from 'node:test';
import assert from 'node:assert/strict';
import {localIso, timestamp, freshnessLabel} from '../src/lib/time';
import {fetchForecast, parseForecast, dailyPeaks, dateLabel} from '../src/lib/weather';
import {planActivity, isStale} from '../src/lib/heat';
function payload(start: string, count = 72, timezone = 'America/New_York') {
  const time = Array.from({length: count}, (_,i) => Date.parse(start)/1000 + i*3600);
  return {timezone, current: {time:time[12], temperature_2m:30, relative_humidity_2m:60, weather_code:0, wind_speed_10m:5}, hourly:{time, temperature_2m:time.map(()=>30),relative_humidity_2m:time.map(()=>60),weather_code:time.map(()=>0),wind_speed_10m:time.map(()=>5),precipitation_probability:time.map(()=>10),uv_index:time.map(()=>2)}};
}
test('US coordinates use global provider timezone and Unix timestamps', async () => {
  const data = payload('2026-10-23T04:00Z');
  const w = await fetchForecast({id:'nyc',name:'New York',region:'USA',latitude:40.71,longitude:-74}, new AbortController().signal, async input => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('timezone'),'auto');
    assert.equal(url.searchParams.get('timeformat'),'unixtime');
    return Response.json(data);
  });
  assert.equal(w.timezone,'America/New_York');
  assert.equal(w.current.time,'2026-10-23T12:00:00-04:00');
  const now = timestamp(w.current.time);
  const fresh = {...w, fetchedAt: new Date(now).toISOString()};
  assert.equal(isStale(fresh, now),false);
  const plans = planActivity(fresh,'Walking',60,'Afternoon',now);
  assert.ok(plans.length);
  assert.ok(plans.every(p=>timestamp(p.time)>=now));
  assert.ok(plans.every(p=>timestamp(p.end)-timestamp(p.time)===3600000));
  assert.match(dateLabel(w.current.time,{hour:'numeric',hour12:false}),/12/);
});
test('DST fallback retains both 1 AM hours and a complete 25-hour day', () => {
  const w = parseForecast(payload('2026-11-01T04:00Z',25));
  assert.equal(w.hourly[1].time,'2026-11-01T01:00:00-04:00');
  assert.equal(w.hourly[2].time,'2026-11-01T01:00:00-05:00');
  assert.equal(timestamp(w.hourly[2].time)-timestamp(w.hourly[1].time),3600000);
  assert.equal(dailyPeaks(w).length,1);
  const duplicate = {...w,hourly:[...w.hourly.slice(0,24),w.hourly[23]]};
  assert.equal(dailyPeaks(duplicate).length,0);
});
test('DST spring-forward accepts complete 23-hour day', () => {
  const w = parseForecast(payload('2026-03-08T05:00Z',23));
  assert.equal(dailyPeaks(w).length,1);
  assert.equal(w.hourly[2].time,'2026-03-08T03:00:00-04:00');
});
test('fractional zones, legacy saves and date formatting keep local wall time', () => {
  assert.equal(localIso(Date.parse('2026-10-23T00:00Z'),'Asia/Kathmandu'),'2026-10-23T05:45:00+05:45');
  assert.equal(timestamp('2026-10-23T12:00'),Date.parse('2026-10-23T04:00Z'));
  assert.match(dateLabel('2026-10-23T12:00+08:00',{hour:'numeric',hour12:false}),/12/);
});
test('retrieval ages distinguish recent, old, and invalid times', () => {
  const now = Date.parse('2026-10-23T12:00Z');
  assert.equal(freshnessLabel('2026-10-23T11:55Z',now),'Retrieved 5 minutes ago');
  assert.equal(freshnessLabel('2026-10-23T09:00Z',now),'Retrieved 3 hours ago');
  assert.equal(freshnessLabel('2026-10-24T12:00Z',now),'Retrieval time unavailable');
});
