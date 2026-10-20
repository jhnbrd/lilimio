import type { Place } from "./data";

/** Screen-space groups preserve exact place coordinates and avoid overlapping pins. */
export function groupMapPlaces(
  places: Place[],
  project: (place: Place) => { x: number; y: number },
  radius = 52,
) {
  const groups: { anchor: Place; places: Place[]; x: number; y: number }[] = [];
  for (const place of places) {
    const point = project(place);
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    const nearby = groups.find(
      (group) => Math.hypot(group.x - point.x, group.y - point.y) < radius,
    );
    if (nearby) nearby.places.push(place);
    else groups.push({ anchor: place, places: [place], ...point });
  }
  return groups;
}
