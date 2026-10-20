import { places as legacyPlaces, type Place } from "./data";
import { readStored, writeStored } from "./storage";
import { validDirectoryPlace } from "./directory";
export function readSavedPlaces(): Place[] {
  const live = readStored<Place[]>(
    "lilimio-saved-osm-places-v1",
    [],
    (v) => Array.isArray(v) && v.every(validDirectoryPlace),
  );
  const ids = readStored<number[]>(
    "lilimio-places-v2",
    [],
    (v) => Array.isArray(v) && v.every(Number.isInteger),
  );
  return [...live, ...legacyPlaces.filter((p) => ids.includes(p.id))];
}
export function saveDirectoryPlace(place: Place, save: boolean): boolean {
  if (typeof place.id === "number") {
    const ids = readStored<number[]>(
      "lilimio-places-v2",
      [],
      (v) => Array.isArray(v) && v.every(Number.isInteger),
    );
    return writeStored(
      "lilimio-places-v2",
      save
        ? [...new Set([...ids, place.id])]
        : ids.filter((id) => id !== place.id),
    );
  }
  if (!validDirectoryPlace(place)) return false;
  const current = readSavedPlaces().filter(
    (p) => typeof p.id === "string" && p.id !== place.id,
  );
  return writeStored(
    "lilimio-saved-osm-places-v1",
    save ? [...current, place] : current,
  );
}
