import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFeeds, selectObservation, createObservationService, createProvider, CACHE_MS} from '../server/pagasa.mjs';
import {observationServer} from '../server/index.mjs';
import {validObservation} from '../src/lib/observations';
const now = Date.parse('2026-10-23T17:00:00Z');
function row(parameter: string, value: unknown = '26', overrides = {}) {
  return {site_id:'98',site_name:'Science Garden',lat:14.645101,lon:121.044258,parameter,
    readable_unit:parameter === 'humidity' ? '%' : '°C',observed_at:'2026-10-24 00:50:00',value,...overrides};
}
function feeds() {return Object.fromEntries(['temperature','heat_index','humidity'].map(parameter => [parameter,{success:true,data:[row(parameter,parameter === 'humidity' ? '82.1' : '26')]}]));}
const snapshot = () => normalizeFeeds(feeds(),new Date(now).toISOString());
test('official values retain source station and per-reading Philippine observation times', () => {
  const result = selectObservation(snapshot(),14.64,121.04,now);
  assert.equal(result.status,'fresh');
  assert.ok(result.station.distanceKm < 1);
  assert.equal(result.station.readings.humidity.value,82.1);
  assert.equal(result.station.readings.temperature.observedAt,'2026-10-24T00:50:00+08:00');
  assert.equal(validObservation(result),true);
});
test('missing and invalid observations never become invented zero or computed heat index', () => {
  const f = feeds();
  f.heat_index.data = [row('heat_index',null),row('heat_index','NA'),row('heat_index',''),row('heat_index','26',{readable_unit:'°F'})];
  f.humidity.data = [row('humidity','101')];
  const result = normalizeFeeds(f,new Date(now).toISOString());
  assert.equal(result.stations[0].readings.heat_index,undefined);
  assert.equal(result.stations[0].readings.humidity,undefined);
  f.temperature.data = [row('temperature','0')];
  assert.equal(normalizeFeeds(f,new Date(now).toISOString()).stations[0].readings.temperature.value,0);
});
test('future, invalid calendar, and inconsistent station records are excluded', () => {
  const f = feeds();
  f.heat_index.data = [row('heat_index','45',{observed_at:'2026-10-25 00:00:00'}),row('heat_index','40',{observed_at:'2026-02-30 00:00:00'})];
  f.humidity.data = [row('humidity','50',{site_name:'Another station'})];
  const s = normalizeFeeds(f,new Date(now).toISOString());
  assert.deepEqual(Object.keys(s.stations[0].readings),['temperature']);
  assert.throws(()=>normalizeFeeds({...f,temperature:{success:false,data:[]}},new Date(now).toISOString()));
});
test('distant stations and old or failed-refresh readings cannot appear fresh', () => {
  const s = snapshot();
  assert.equal(selectObservation(s,7.07,125.61,now).status,'no_nearby');
  assert.equal(selectObservation(s,14.64,121.04,now+3*3600_000).status,'stale');
  assert.equal(selectObservation(s,14.64,121.04,now,true).status,'stale');
  const changed = {...s,stations:[{...s.stations[0],readings:{...s.stations[0].readings,humidity:{value:80,observedAt:'2026-10-23T20:00:00+08:00'}}}]};
  assert.equal(selectObservation(changed,14.64,121.04,now).station.readings.humidity.stale,true);
});
test('cache coalesces callers, backs off failures, retains stale data, then expires it', async () => {
  let at = now, calls = 0, fail = false;
  const service = createObservationService(async()=>{calls++; await Promise.resolve(); if(fail)throw new Error('private upstream URL'); return snapshot();},()=>at);
  await Promise.all([service(14.64,121.04),service(14.64,121.04)]);
  assert.equal(calls,1);
  fail = true; at += CACHE_MS + 1;
  assert.equal((await service(14.64,121.04)).status,'stale');
  await service(14.64,121.04); assert.equal(calls,2);
  at += 25*3600_000;
  assert.equal((await service(14.64,121.04)).status,'unavailable');
});
test('US users do not send coordinates to PAGASA and unavailable never receives a mock', async () => {
  let calls=0;
  const service=createObservationService(async()=>{calls++;throw new Error('failure');},()=>now);
  assert.equal((await service(40.71,-74)).status,'not_supported'); assert.equal(calls,0);
  assert.equal((await service(14.64,121.04)).status,'unavailable');
  assert.equal((await service(14.64,121.04)).station,undefined); assert.equal(calls,1);
});
test('public provider session stays server-side and failures are sanitized', async () => {
  const urls: string[] = [];
  const provider = createProvider(async (input: string, init: RequestInit) => {
    urls.push(String(input));
    if (String(input)==='https://www.panahon.gov.ph/') return new Response('<meta name="csrf-token" content="test-session">',{headers:{'set-cookie':'public=example; Path=/; HttpOnly'}});
    assert.equal(new Headers(init.headers).get('Cookie'),'public=example');
    const url = new URL(String(input));
    const parameter = url.searchParams.get('parameter')!;
    assert.equal(url.searchParams.get('token'),'test-session');
    return Response.json({success:true,data:[row(parameter)]});
  });
  const data=await provider();
  assert.equal(urls.length,4);
  assert.equal(JSON.stringify(data).includes('test-session'),false);
  const broken=createProvider(async()=>new Response('upstream error token=secret',{status:503}));
  await assert.rejects(broken(),e=>!String(e).includes('secret'));
});
test('browser contract rejects source substitution and impossible station readings', () => {
  const result=selectObservation(snapshot(),14.64,121.04,now);
  assert.equal(validObservation({...result,sourceUrl:'https://example.com'}),false);
  assert.equal(validObservation({...result,station:{...result.station,distanceKm:51}}),false);
});
test('HTTP API validates queries and never fetches data for health checks', async () => {
  let calls=0;
  const server=observationServer(async()=>{calls++;return {status:'unavailable'};});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address() as {port:number}; const root=`http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(root+'/healthz')).status,200);assert.equal(calls,0);
    assert.equal((await fetch(root+'/api/observations/pagasa?lat=&lon=121')).status,400);
    assert.equal((await fetch(root+'/api/observations/pagasa?lat=91&lon=121')).status,400);
    const response=await fetch(root+'/api/observations/pagasa?lat=14&lon=121');
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal((await response.json()).status,'unavailable');assert.equal(calls,1);
    assert.equal((await fetch(root+'/api/observations/pagasa',{method:'POST'})).status,405);
  } finally {await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
