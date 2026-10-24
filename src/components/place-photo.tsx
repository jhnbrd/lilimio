import { useEffect, useState } from "react";
import { Modal } from "../ui";
import { Camera, ImageOff } from "lucide-react";
import type { Place } from "../lib/data";
type Photo = {
  url: string;
  source: string;
  author: string;
  license: string;
  licenseUrl: string;
  title?: string;
};
/** Only exact OSM-linked Commons files are eligible; proximity is not identity. */
export function PlacePhoto({ place }: { place: Place }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!requested || !place.osm) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/places/photo?record=${encodeURIComponent(place.osm.url)}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (data.error) throw new Error();
        if (
          data.photo &&
          /^https:\/\/upload\.wikimedia\.org\//.test(data.photo.url)
        ) {
          setPhoto(data.photo);
          setOpen(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requested, attempt, place.osm?.url]);
  return (
    <figure className="place-photo">
      {photo ? (
        <>
          <button className="button outline" onClick={() => setOpen(true)}>
            <Camera size={20} />
            View place photo
          </button>
          {open && (
            <Modal title="Place photo" onClose={() => setOpen(false)}>
              <figure className="photo-view">
                <img
                  decoding="async"
                  referrerPolicy="no-referrer"
                  src={photo.url}
                  alt={place.name}
                  onError={() => {
                    setPhoto(null);
                    setError(true);
                    setOpen(false);
                  }}
                />
                <figcaption>
                  <a href={photo.source} target="_blank" rel="noreferrer">
                    {photo.title || place.name}
                  </a>
                  <br />
                  {photo.author} ·{" "}
                  <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
                    {photo.license}
                  </a>
                  <br />
                  Wikimedia Commons · Cropped to fit
                </figcaption>
              </figure>
            </Modal>
          )}
        </>
      ) : (
        <div className="photo-placeholder">
          {error ? (
            <>
              <ImageOff size={28} />
              <button
                className="button text"
                onClick={() => setAttempt((n) => n + 1)}
              >
                Photos unavailable · Retry
              </button>
            </>
          ) : requested && !loading ? (
            <>
              <ImageOff size={28} />
              <span>No linked photo available</span>
            </>
          ) : (
            <>
              <Camera size={28} />
              <button
                className="button text"
                disabled={loading || !place.osm}
                onClick={() => setRequested(true)}
              >
                {loading ? "Looking for a linked photo…" : "Find a place photo"}
              </button>
            </>
          )}
        </div>
      )}
    </figure>
  );
}
