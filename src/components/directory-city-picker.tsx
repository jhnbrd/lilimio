import { useEffect, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Modal, Button } from "../ui";
import { searchDirectoryCities, type DirectoryCenter } from "../lib/directory";
export function DirectoryCityPicker({
  onChoose,
  onClose,
}: {
  onChoose: (center: DirectoryCenter) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const current = useRef<AbortController | null>(null);
  useEffect(() => () => current.current?.abort(), []);
  async function search() {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);
    const timeout = setTimeout(
      () =>
        controller.abort(
          new DOMException("City search timed out", "TimeoutError"),
        ),
      12000,
    );
    try {
      const cities = await searchDirectoryCities(query, controller.signal);
      if (current.current === controller && !controller.signal.aborted) {
        setResults(cities);
        setSearched(true);
      }
    } catch (e) {
      if (
        current.current === controller &&
        (!controller.signal.aborted ||
          controller.signal.reason?.name === "TimeoutError")
      )
        setError(
          e instanceof Error ? e.message : "City search is unavailable.",
        );
    } finally {
      clearTimeout(timeout);
      if (current.current === controller && !controller.signal.aborted)
        setLoading(false);
      else if (controller.signal.reason?.name === "TimeoutError")
        setLoading(false);
    }
  }
  return (
    <Modal title="Explore a city" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label className="field-label" htmlFor="directory-city">
          City name
        </label>
        <div className="search-field">
          <Search />
          <input
            id="directory-city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. London, Tokyo, Cebu"
            minLength={3}
            maxLength={100}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search cities"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {searched && !results.length && (
        <p role="status">
          No matching cities. Try a nearby city or a different spelling.
        </p>
      )}
      {results.map((c) => (
        <button
          className="picker-row"
          key={`${c.latitude},${c.longitude}`}
          onClick={() => onChoose(c)}
        >
          <MapPin size={20} />
          <span>
            {c.name} <small>{c.region}</small>
          </span>
        </button>
      ))}
      <p className="source">
        City search:{" "}
        <a
          href="https://open-meteo.com/en/docs/geocoding-api"
          target="_blank"
          rel="noreferrer"
        >
          Open-Meteo / GeoNames
        </a>
        . Directory searches do not change your Philippine weather location.
      </p>
    </Modal>
  );
}
