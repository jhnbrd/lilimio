export type StationReading = {value: number; observedAt: string; stale: boolean};
export type Observation = {
  status: 'fresh' | 'stale' | 'unavailable' | 'no_nearby' | 'not_supported';
  sourceUrl?: string;
  retrievedAt?: string;
  refreshFailed?: boolean;
  station?: {
    id: string; name: string; latitude: number; longitude: number;
    type: 'automatic'; distanceKm: number;
    readings: {temperature?: StationReading; humidity?: StationReading; heat_index?: StationReading};
  };
};
export function validObservation(value: unknown): value is Observation {
  if (!value || typeof value !== 'object') return false;
  const o = value as Observation;
  if (!['fresh','stale','unavailable','no_nearby','not_supported'].includes(o.status)) return false;
  if (o.sourceUrl !== undefined && o.sourceUrl !== 'https://www.panahon.gov.ph/') return false;
  if (o.status !== 'fresh' && o.status !== 'stale') return !o.station;
  const s = o.station;
  if (!s || !s.readings || typeof s.id !== 'string' || typeof s.name !== 'string' || !s.name || s.name.length > 200 ||
    !Number.isFinite(s.latitude) || Math.abs(s.latitude) > 90 || !Number.isFinite(s.longitude) || Math.abs(s.longitude) > 180 ||
    !Number.isFinite(s.distanceKm) || s.distanceKm < 0 || s.distanceKm > 50 || s.type !== 'automatic' ||
    typeof o.retrievedAt !== 'string' || !Number.isFinite(Date.parse(o.retrievedAt))) return false;
  if (!s.readings.temperature) return false;
  const limits = {temperature: [-50,60], heat_index: [-60,90], humidity: [0,100]};
  return Object.entries(limits).every(([key, [min,max]]) => {
    const r = s.readings[key as keyof typeof limits];
    return r === undefined || (!!r && typeof r === 'object' && typeof r.value === 'number' && Number.isFinite(r.value) && r.value >= min && r.value <= max &&
      typeof r.observedAt === 'string' && /\+08:00$/.test(r.observedAt) && Number.isFinite(Date.parse(r.observedAt)) && typeof r.stale === 'boolean');
  });
}
export const observationArea = (lat: number, lon: number) => lat >= 4 && lat <= 22 && lon >= 116 && lon <= 127;
