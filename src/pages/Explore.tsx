import {
  lazy,
  Suspense,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Search,
  TreePine,
  MapPin,
  ChevronRight,
  Clock,
  Armchair,
  ExternalLink,
  Bookmark,
  TriangleAlert,
  Map,
  AlignJustify,
  Send,
  Droplets,
  Building2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../state";
import { places as legacyPlaces, cities, type Place } from "../lib/data";
import { readStored, writeStored } from "../lib/storage";
import { Art, Back, Button, Row, ActionLink } from "../ui";
import {
  directoryKinds,
  validCenter,
  validDirectoryPlace,
  type DirectoryCenter,
  type DirectoryKind,
} from "../lib/directory";
import { readDirectoryCaches, useDirectory } from "../use-directory";
import { readSavedPlaces, saveDirectoryPlace } from "../lib/directory-storage";
import { DirectoryCityPicker } from "../components/directory-city-picker";
import { dateLabel } from "../lib/weather";
const ReliefMap = lazy(() => import("../relief-map"));
export default function Explore() {
  const [narrow, setNarrow] = useState(window.innerWidth < 768);
  useEffect(() => {
    const media = window.matchMedia("(max-width:767px)");
    const change = () => setNarrow(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const { city } = useApp();
  const [center, setCenter] = useState<DirectoryCenter>(() =>
    readStored(
      "lilimio-directory-center-v1",
      city && city.id !== "device" ? city : cities[0],
      validCenter,
    ),
  );
  const [cityPicker, setCityPicker] = useState(false);
  const [type, setType] = useState<DirectoryKind>(() =>
    readStored("lilimio-directory-category-v1", "All", (v) =>
      directoryKinds.includes(v as DirectoryKind),
    ),
  );
  const directory = useDirectory(center, type);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("List");
  const [mapEnabled, setMapEnabled] = useState(false);
  const searchArea = useCallback((area: DirectoryCenter) => {
    setCenter(area); setSelection(null); setQuery("");
    writeStored("lilimio-directory-center-v1", area);
    directory.load();
  }, [directory.load]);
  const [selection, setSelection] = useState<Place | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const storedSelection = readStored<Place | null>(
    "lilimio-directory-selection-v1",
    null,
    validDirectoryPlace,
  );
  const available = [
    ...(directory.result?.places || []),
    ...readDirectoryCaches().flatMap((r) => r.places),
    ...readSavedPlaces(),
    ...legacyPlaces,
    ...(storedSelection ? [storedSelection] : []),
  ];
  const selected = id ? available.find((p) => String(p.id) === id) : selection;
  const visible = useMemo(
    () =>
      (directory.result?.places || []).filter(
        (p) =>
          (type === "All" || type === p.kind) &&
          (p.name + " " + p.address)
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [directory.result, type, query],
  );
  const choose = useCallback(
    (p: Place) => {
      setSelection(p);
      if (p.osm) writeStored("lilimio-directory-selection-v1", p);
      if (window.matchMedia("(max-width: 767px)").matches)
        navigate(`/explore/${p.id}`);
    },
    [navigate],
  );
  if (id && selected)
    return (
      <div className="standalone-place">
        <Back to="/explore" />
        <PlaceDetail key={selected.id} place={selected} />
      </div>
    );
  if (id)
    return (
      <div className="empty-state">
        <Back to="/explore" />
        <h1>Place not available on this device</h1>
        <p>Search the directory again, or open a place you’ve saved.</p>
        <ActionLink to="/explore">Find places</ActionLink>
      </div>
    );
  return (
    <div className="explore-layout">
      <section className="explore-index">
        <h1>Find relief</h1>
        <p className="lead desktop-only">
          Explore nearby parks, indoor destinations, and mapped drinking water.
        </p>
        <button
          className="directory-center"
          onClick={() => setCityPicker(true)}
        >
          <MapPin size={20} />
          <span>
            {center.name}
            <small>{center.region}</small>
          </span>
          <ChevronDown size={18} />
        </button>
        <div className="directory-load">
          <Button
            variant="outline"
            onClick={() => directory.load()}
            disabled={directory.loading}
          >
            <RefreshCw size={18} />
            {directory.loading
              ? "Finding places…"
              : directory.result
                ? "Refresh nearby places"
                : "Find nearby places"}
          </Button>
        </div>
        {directory.loading && (
          <p className="source" role="status">
            Searching within 3 km of {center.name}…
          </p>
        )}
        {directory.error && (
          <div className="warning" role="alert">
            <div>
              <strong>Places couldn’t load</strong>
              <p>
                {directory.error}{" "}
                {directory.result
                  ? "Showing the last saved search."
                  : "Try another city or come back later."}
              </p>
              <button
                onClick={() => directory.load()}
                disabled={directory.loading}
              >
                Try again
              </button>
            </div>
          </div>
        )}
        <label className="field-label" htmlFor="place-search">
          Search places
        </label>
        <div className="search-field">
          <Search />
          <input
            id="place-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelection(null);
            }}
            placeholder="Search places"
          />
        </div>
        <label className="filter-field">
          <TreePine />
          <span className="sr-only">Place type</span>
          <select
            value={type}
            onChange={(e) => {
              const category = e.target.value as DirectoryKind;
              setType(category);
              writeStored("lilimio-directory-category-v1", category);
              setSelection(null);
              if (directory.result) directory.load();
            }}
          >
            <option value="All">Type: All places</option>
            <option>Parks &amp; gardens</option>
            <option>Indoor places</option>
            <option>Drinking water</option>
          </select>
        </label>
        <div
          className="tabs mobile-only"
          role="group"
          aria-label="Directory view"
        >
          {["Map", "List"].map((v) => (
            <button
              key={v}
              className={view === v ? "selected" : ""}
              aria-pressed={view === v}
              onClick={() => { setView(v); if (v === "Map") setMapEnabled(true); }}
            >
              {v}
            </button>
          ))}
        </div>
        <div
          className={`mobile-map mobile-only ${view !== "Map" ? "hidden" : ""}`}
        >
          {narrow && view === "Map" && (
            <Suspense fallback={<p className="map-loading">Loading map…</p>}>
              <ReliefMap city={center} places={visible} onSelect={choose} onSearchArea={searchArea} />
            </Suspense>
          )}
        </div>
        <p
          className={`source directory-count ${narrow && view === "Map" ? "desktop-only" : ""}`}
        >
          {visible.length} {visible.length === 1 ? "place" : "places"} ·
          {directory.result
            ? "OpenStreetMap · within 3 km"
            : "Search nearby to load real places."}
        </p>
        <div className="place-list">
          {(narrow && view === "Map" ? visible.slice(0, 1) : visible).map(
            (p) => (
              <button
                className="place-row"
                key={p.id}
                onClick={() => choose(p)}
              >
                <PlaceIllustration place={p} />
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    <MapPin size={17} />
                    {p.distanceKm?.toFixed(1)} km · {p.kind}
                  </small>
                  <small>{accessLabel(p)} · {p.osm?.openingHours ? "Hours mapped; check before travel" : "Hours unknown"}</small>
                  <small>{p.kind === "Drinking water" ? "Water quality unverified" : p.kind === "Indoor places" ? `Cooling: ${p.osm?.airConditioning || "unknown"}` : `Shade: ${p.osm?.shade || "unknown"}`}</small>
                </span>
                <ChevronRight size={20} />
              </button>
            ),
          )}
          {!visible.length && (
            <div className="empty-state">
              <TreePine size={32} />
              <h3>
                {directory.loading
                  ? "Finding nearby places…"
                  : directory.result
                    ? "No matching places"
                    : "Explore a city anywhere"}
              </h3>
              <p>
                {directory.result
                  ? "Try another category or city. OpenStreetMap coverage varies; an empty search does not prove there are no places nearby."
                  : "Choose a city and select Find nearby places to search OpenStreetMap."}
              </p>
            </div>
          )}
        </div>
        <p className="source directory-provenance">
          {directory.result && (
            <>
              Retrieved{" "}
              {dateLabel(directory.result.fetchedAt, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {directory.stale ? " · Saved search needs refreshing." : ""}
              <br />
            </>
          )}
          ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap contributors
          </a>{" "}
          ·{" "}
          <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">
            Photon search
          </a>
          . Up to 50 places within 3 km; distances are straight-line from the
          selected search centre. Search sends those coordinates. These are
          mapped places, not certified cooling centres. Check access, hours,
          shade, and water conditions before visiting.
        </p>
      </section>
      <section className="explore-map desktop-only">
        {!narrow && !mapEnabled && <Button variant="outline" onClick={() => setMapEnabled(true)}>Load interactive map</Button>}
        {!narrow && mapEnabled && (
          <Suspense fallback={<p className="map-loading">Loading map…</p>}>
            <ReliefMap city={center} places={visible} onSelect={choose} onSearchArea={searchArea} />
          </Suspense>
        )}
        {(selected || visible[0]) && (
          <PlaceDetail
            key={(selected || visible[0]).id}
            place={selected || visible[0]}
            compact
          />
        )}
      </section>
      {cityPicker && (
        <DirectoryCityPicker
          onClose={() => setCityPicker(false)}
          onChoose={(c) => {
            setCenter(c);
            writeStored("lilimio-directory-center-v1", c);
            setSelection(null);
            setQuery("");
            setType("All");
            writeStored("lilimio-directory-category-v1", "All");
            setCityPicker(false);
            directory.load();
          }}
        />
      )}
    </div>
  );
}
function accessLabel(place: Place) {
  const access = place.osm?.access;
  return access === "yes" || access === "public"
    ? "Public access mapped"
    : access === "permissive"
      ? "Permissive access mapped"
      : access === "customers"
        ? "Customers only (mapped)"
        : access
          ? `Access: ${access} (mapped)`
          : place.osm
            ? "Access not mapped"
            : "Access unverified";
}
function PlaceIllustration({ place }: { place: Place }) {
  if (!place.osm)
    return (
      <Art
        scene="park"
        label="Concept illustration, not a photograph of this place"
      />
    );
  const Icon =
    place.kind === "Drinking water"
      ? Droplets
      : place.kind === "Indoor places"
        ? Building2
        : TreePine;
  return (
    <div
      className={`place-illustration ${place.kind === "Drinking water" ? "water" : place.kind === "Indoor places" ? "indoor" : "park"}`}
      aria-hidden="true"
    >
      <Icon size={36} />
    </div>
  );
}
export function PlaceDetail({
  place,
  compact = false,
}: {
  place: Place;
  compact?: boolean;
}) {
  const { notify } = useApp();
  const [draft, setDraft] = useState(false);
  const [issue, setIssue] = useState("Opening hours");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(() =>
    readSavedPlaces().some((p) => p.id === place.id),
  );
  function save() {
    if (saveDirectoryPlace(place, !saved)) {
      setSaved(!saved);
      notify(
        saved
          ? "Place removed from saved items."
          : "Place saved on this device.",
      );
    } else notify("Could not save this place.");
  }
  return (
    <article className={`place-detail ${compact ? "compact" : ""}`}>
      <PlaceIllustration place={place} />
      <div>
        <h2>{place.name}</h2>
        <p className="error-text">
          <TriangleAlert size={22} />
          {place.osm ? "OpenStreetMap listing" : "Unverified starter listing"}
        </p>
        <p className="muted">{place.address}</p>
        {!compact && <p>{place.description}</p>}
        <div className="place-facts">
          <span>
            <Clock />
            <span>
              <strong>Hours</strong>
              <small>{place.osm?.openingHours || "Not mapped"}</small>
            </span>
          </span>
          <span>
            <Armchair />
            <span>
              <strong>Amenities</strong>
              <small>
                {place.osm ? place.amenities.join(" · ") : "Not confirmed"}
              </small>
            </span>
          </span>
        </div>
        {place.osm && (
          <div className="place-data">
            <p>
              {accessLabel(place)}
              {place.osm.fee ? ` · Fee: ${place.osm.fee} (mapped)` : ""}
            </p>
            {place.kind === "Indoor places" && (
              <p>
                Air conditioning: {place.osm.airConditioning || "not mapped"}
              </p>
            )}
            {place.kind === "Parks & gardens" && (
              <p>Shade: {place.osm.shade || "not mapped"}</p>
            )}
            <p className="source">
              Community tags, not a live inspection.{" "}
              <a href={place.osm.url} target="_blank" rel="noreferrer">
                View the OpenStreetMap record <ExternalLink size={13} />
              </a>{" "}
              · Retrieved{" "}
              {dateLabel(place.osm.fetchedAt, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
        <p className="muted">Check access and opening hours before travelling. {place.kind === "Drinking water" ? "A mapped water point is not a water-quality inspection." : "Mapped facilities may be unavailable or unsuitable when you arrive."}</p>
        <a
          className="button primary"
          href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={21} />
          Open directions
        </a>
        {compact && (
          <Link className="button outline" to={`/explore/${place.id}`}>
            View place details
          </Link>
        )}
        <Button variant="text" onClick={save}>
          <Bookmark size={21} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved on this device" : "Save place"}
        </Button>
        <Button variant="text" onClick={() => setDraft((v) => !v)}>
          Correct place details
        </Button>
        {draft && (
          <form
            className="correction-form"
            onSubmit={(e) => {
              e.preventDefault();
              const drafts = readStored<unknown[]>(
                "lilimio-correction-drafts",
                [],
                Array.isArray,
              );
              if (
                writeStored("lilimio-correction-drafts", [
                  ...drafts,
                  {
                    place: place.id,
                    issue,
                    text,
                    savedAt: new Date().toISOString(),
                  },
                ])
              ) {
                notify(
                  "Draft saved on this device. It has not been submitted.",
                );
                setDraft(false);
                setText("");
              } else notify("Could not save draft.");
            }}
          >
            <label className="field-label" htmlFor="issue">
              Issue
            </label>
            <select
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            >
              <option>Opening hours</option>
              <option>Access</option>
              <option>Amenities</option>
              <option>Other</option>
            </select>
            <label className="field-label" htmlFor="correction">
              What changed?
            </label>
            <textarea
              id="correction"
              required
              minLength={8}
              maxLength={500}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="muted">
              {text.length}/500 · Saved on this device only. Report submission
              is not connected.
            </p>
            <Button type="submit">
              <Send size={21} />
              Save draft
            </Button>
          </form>
        )}
      </div>
    </article>
  );
}

