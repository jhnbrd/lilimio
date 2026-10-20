import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);
import { Map, RefreshCw } from "lucide-react";
import { type Place } from "./lib/data";
import { type DirectoryCenter } from "./lib/directory";
import { groupMapPlaces } from "./lib/map-groups";
import { Modal } from "./ui";
export default function ReliefMap({
  city,
  places,
  onSelect,
}: {
  city: DirectoryCenter;
  places: Place[];
  onSelect: (p: Place) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [groupChoices, setGroupChoices] = useState<Place[] | null>(null);
  const latest = useRef(onSelect);
  const instance = useRef<maplibregl.Map | null>(null);
  latest.current = onSelect;
  useEffect(() => {
    if (!root.current) return;
    let map: maplibregl.Map | undefined;
    let observer: ResizeObserver | undefined;
    let active = true;
    setFailed(false);
    try {
      map = new maplibregl.Map({
        container: root.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [city.longitude, city.latitude],
        zoom: 12,
        attributionControl: { compact: true },
      });
      instance.current = map;
      observer = new ResizeObserver(() => map?.resize());
      observer.observe(root.current);
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "bottom-right",
      );
      map.on("error", () => {
        if (active && !map?.isStyleLoaded()) setFailed(true);
      });
      map.on("load", () => {
        if (active) setFailed(false);
      });
      // A recoverable tile error must not leave the failure overlay over a loaded map.
      map.on("idle", () => {
        if (active && map?.isStyleLoaded()) setFailed(false);
      });
      map.on("webglcontextlost", () => {
        if (active) setFailed(true);
      });
    } catch {
      setFailed(true);
    }
    return () => {
      active = false;
      observer?.disconnect();
      map?.remove();
      instance.current = null;
    };
  }, [city, attempt]);
  useEffect(() => {
    const map = instance.current;
    if (!map) return;
    let markers: maplibregl.Marker[] = [];
    function renderMarkers() {
      markers.forEach((marker) => marker.remove());
      markers = [];
      const groups = groupMapPlaces(places, (p) =>
        map!.project([p.lng, p.lat]),
      );
      groups.forEach((group) => {
        const p = group.anchor;
        const button = document.createElement("button");
        button.className = "map-marker";
        button.type = "button";
        button.textContent =
          p.kind === "Drinking water"
            ? "●"
            : p.kind === "Indoor places"
              ? "⌂"
              : "♣";
        button.dataset.kind = p.kind;
        button.setAttribute("aria-label", `${p.name}, ${p.kind}`);
        if (group.places.length > 1) {
          button.classList.add("map-marker-cluster");
          button.textContent = String(group.places.length);
          button.removeAttribute("data-kind");
          button.setAttribute(
            "aria-label",
            `Choose from ${group.places.length} nearby places`,
          );
          button.onclick = () => setGroupChoices(group.places);
        } else button.onclick = () => latest.current(p);
        markers.push(
          new maplibregl.Marker({ element: button })
            .setLngLat([p.lng, p.lat])
            .addTo(map!),
        );
      });
    }
    map.on("moveend", renderMarkers);
    map.on("resize", renderMarkers);
    if (places.length) {
      const bounds = new maplibregl.LngLatBounds();
      places.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
    }
    renderMarkers();
    return () => {
      map.off("moveend", renderMarkers);
      map.off("resize", renderMarkers);
      markers.forEach((marker) => marker.remove());
    };
  }, [city, places, attempt]);
  return (
    <div className="relief-map" aria-label={`Map around ${city.name}`}>
      <div className="map-canvas" ref={root} />
      {failed && (
        <div className="map-fallback" role="status">
          <Map size={32} />
          <strong>Map is unavailable</strong>
          <p>
            Use the place list instead. Map tiles need an internet connection.
          </p>
          <button
            type="button"
            className="button outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            <RefreshCw size={18} aria-hidden />
            Retry map
          </button>
        </div>
      )}
      <p className="map-disclaimer">
        Mapped places · check access &amp; facilities
      </p>
      {groupChoices && (
        <Modal
          title={`${groupChoices.length} nearby places`}
          onClose={() => setGroupChoices(null)}
        >
          {groupChoices.map((place) => (
            <button
              type="button"
              key={place.id}
              className="picker-row"
              onClick={() => {
                setGroupChoices(null);
                latest.current(place);
              }}
            >
              <span>
                {place.name}
                <small>{place.kind}</small>
              </span>
            </button>
          ))}
        </Modal>
      )}
    </div>
  );
}
