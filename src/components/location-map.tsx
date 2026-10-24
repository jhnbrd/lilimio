import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { City } from "../lib/data";
import { Button } from "../ui";
maplibregl.setWorkerUrl(workerUrl);

export default function LocationMap({
  initial,
  onChoose,
  onBack,
}: {
  initial: City;
  onChoose: (city: City) => void;
  onBack: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState({
    latitude: initial.latitude,
    longitude: initial.longitude,
  });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    let map: maplibregl.Map | undefined;
    let marker: maplibregl.Marker | undefined;
    let observer: ResizeObserver | undefined;
    let active = true;
    try {
      map = new maplibregl.Map({
        container: root.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [initial.longitude, initial.latitude],
        zoom: 14,
        attributionControl: { compact: true },
      });
      marker = new maplibregl.Marker({ draggable: true, color: "#244D39" })
        .setLngLat([initial.longitude, initial.latitude])
        .addTo(map);
      const update = (latitude: number, longitude: number) =>
        setPoint({
          latitude,
          longitude: ((((longitude + 180) % 360) + 360) % 360) - 180,
        });
      marker.on("dragend", () => {
        const p = marker!.getLngLat();
        update(p.lat, p.lng);
      });
      map.on("click", (e) => {
        marker!.setLngLat(e.lngLat);
        update(e.lngLat.lat, e.lngLat.lng);
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
      map.on("error", () => {
        if (active && !map?.isStyleLoaded()) setFailed(true);
      });
      observer = new ResizeObserver(() => map?.resize());
      observer.observe(root.current);
    } catch {
      setFailed(true);
    }
    return () => {
      active = false;
      observer?.disconnect();
      marker?.remove();
      map?.remove();
    };
  }, [initial.latitude, initial.longitude]);
  return (
    <section className="location-map-picker">
      <p>
        Tap the map or drag the pin. For keyboard selection, return to location
        search.
      </p>
      <div
        ref={root}
        className="location-pin-map"
        role="region"
        aria-label="Choose a location on the map"
      />
      {failed && (
        <p role="alert">
          The map could not load. Use location search or device location
          instead.
        </p>
      )}
      <p className="muted">
        Selected pin: {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
      </p>
      <Button
        disabled={failed}
        onClick={() =>
          onChoose({
            id: `pin-${point.latitude}-${point.longitude}`,
            name: "Selected map pin",
            region: "Pinned location",
            ...point,
          })
        }
      >
        Use this location
      </Button>
      <Button variant="text" onClick={onBack}>
        Back to location search
      </Button>
    </section>
  );
}
