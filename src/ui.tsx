import {
  useEffect,
  lazy,
  Suspense,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ComponentProps,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  MapPin,
  Search,
  LocateFixed,
  X,
  CloudSun,
  Sun,
  CloudRain,
  TriangleAlert,
  RefreshCw,
  Cloud,
  Moon,
} from "lucide-react";
import { useApp } from "./state";
import { cities, type City } from "./lib/data";
import { isStale } from "./lib/heat";
import { freshnessLabel } from "./lib/time";
import { LOCATION_DISCLAIMER, searchLocations } from "./lib/locations";
import { dateLabel } from "./lib/weather";
import { Paged } from "./components/pagination";

const LocationMap = lazy(() => import("./components/location-map"));

const scenes = {
  heat: { src: "today", box: "284 217 510 193" },
  mobileHeat: { src: "daily", box: "350 248 153 177" },
  foliage: { src: "guides", box: "180 638 335 220" },
  corner: { src: "settings", box: "1100 0 436 520" },
  bottom: { src: "today", box: "0 810 1536 178" },
  sun: { src: "forecast", box: "1090 532 414 152" },
  planner: { src: "plan", box: "0 750 760 274" },
  guide: { src: "learn", box: "742 264 750 225" },
  park: { src: "relief", box: "760 658 300 245" },
  welcome: { src: "onboarding", box: "126 172 398 384" },
  city: { src: "onboarding", box: "580 185 380 245" },
  ready: { src: "onboarding", box: "1015 165 400 270" },
};
export function Art({
  scene,
  className = "",
  label,
}: {
  scene: keyof typeof scenes;
  className?: string;
  label?: string;
}) {
  const s = scenes[scene];
  return (
    <svg
      className={`art art-${scene} ${className}`}
      viewBox={s.box}
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <image href={`/art/${s.src}.webp`} width="1536" height="1024" />
    </svg>
  );
}
export function Wordmark() {
  return (
    <img
      className="wordmark"
      src="/images/brand/lilimio/png/wordmark-640.png"
      alt="lilimio."
    />
  );
}
export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "outline" | "text" }) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function ActionLink({
  to,
  children,
  variant = "text",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <Link className={`button ${variant} ${className}`} to={to}>
      {children}
      <ArrowRight size={21} />
    </Link>
  );
}
export function Back({ to, label = "Back" }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button className="back" onClick={() => (to ? navigate(to) : navigate(-1))}>
      <ArrowLeft size={24} />
      <span>{label}</span>
    </button>
  );
}
export function WeatherIcon({
  code = 0,
  size = 42,
  hour,
}: {
  code?: number;
  size?: number;
  hour?: number;
}) {
  const Icon =
    code >= 51
      ? CloudRain
      : code > 2
        ? Cloud
        : code > 0
          ? CloudSun
          : hour !== undefined && (hour < 6 || hour > 18)
            ? Moon
            : Sun;
  return (
    <Icon
      className={code >= 51 ? "rain-icon" : "sun-icon"}
      size={size}
      strokeWidth={1.6}
      aria-hidden
    />
  );
}
export function Row({
  icon,
  children,
  detail,
  to,
  onClick,
  trailing,
}: {
  icon?: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  to?: string;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const body = (
    <>
      {icon && <span className="row-icon">{icon}</span>}
      <span className="row-copy">
        <span>{children}</span>
        {detail && <small>{detail}</small>}
      </span>
      {trailing || <ChevronRight size={22} />}
    </>
  );
  return to ? (
    <Link className="row" to={to}>
      {body}
    </Link>
  ) : onClick ? (
    <button className="row" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="row static">{body}</div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { motionPreference } = useApp();
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  function close() {
    if (closing) return;
    if (
      motionPreference === "reduced" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 140);
  }
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      old?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${closing ? "dialog-closing" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-labelledby={titleId}
    >
      <div className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X />
        </button>
      </div>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}
export function CityPicker({
  onChoose,
  chosen,
  onBrowse,
}: {
  onChoose: (city: City) => void;
  chosen?: City | null;
  onBrowse?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [remoteCities, setRemoteCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    setRemoteCities([]);
    setSearching(false);
    setError("");
    if (query.trim().length < 3) return;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      setSearching(true);
      timeout = setTimeout(() => {
        controller.abort();
        setSearching(false);
        setError(
          "Location search is taking too long. Try adding a city, use your location, or choose on the map.",
        );
      }, 10000);
      searchLocations(query, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setRemoteCities(results);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              "Location search unavailable. Try again or use your location.",
            );
        })
        .finally(() => {
          clearTimeout(timeout);
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);
  const results = [
    ...remoteCities,
    ...cities.filter(
      (c) =>
        !remoteCities.some(
          (r) => r.latitude === c.latitude && r.longitude === c.longitude,
        ) &&
        (c.name + " " + c.region)
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    ),
  ];
  function locate() {
    if (!navigator.geolocation) {
      setError("Location is unavailable. Choose a city instead.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!active.current) return;
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          setError("Location coordinates are invalid.");
          return;
        }
        onChoose({
          id: "device",
          name: "Your location",
          region: "Device coordinates",
          latitude,
          longitude,
        });
      },
      () => {
        if (active.current) {
          setLocating(false);
          setError(
            "Location access was unavailable. You can choose a city instead.",
          );
        }
      },
      { timeout: 15000, maximumAge: 60000, enableHighAccuracy: true },
    );
  }
  if (showMap)
    return (
      <Suspense fallback={<p role="status">Loading location map…</p>}>
        <LocationMap
          initial={chosen || cities[0]}
          onChoose={onChoose}
          onBack={() => setShowMap(false)}
        />
      </Suspense>
    );
  return (
    <div className="city-picker">
      <label className="field-label" htmlFor="city-search">
        Location
      </label>
      <div className="search-field">
        <Search size={23} />
        <input
          id="city-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City, barangay, district or street"
          autoComplete="off"
        />
      </div>
      <p className="muted">
        Search worldwide. Include the city or country to narrow results.
      </p>
      <div className="city-results">
        <Paged label="Cities">
          {results.map((c) => (
            <button
              key={c.id}
              className={`city-option ${chosen?.id === c.id ? "selected" : ""}`}
              onClick={() => onChoose(c)}
            >
              <MapPin size={22} />
              <span>
                {c.name}
                <small>{c.region}</small>
              </span>
              {chosen?.id === c.id ? (
                <span aria-label="Selected">●</span>
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          ))}
        </Paged>
        {!results.length && (
          <p>
            {searching
              ? "Searching locations…"
              : "No location matches. Try adding a city, or choose a map pin."}
          </p>
        )}
      </div>
      <Button variant="outline" onClick={locate} disabled={locating}>
        <LocateFixed size={21} />
        {locating ? "Finding your location…" : "Use my location"}
      </Button>
      <Button variant="outline" onClick={() => setShowMap(true)}>
        Choose on map <MapPin size={21} />
      </Button>
      <p className="muted">{LOCATION_DISCLAIMER}</p>
      <p className="muted">
        Search text goes to Photon / OpenStreetMap. Location is optional.
        Coordinates are sent to Open-Meteo for your forecast.
      </p>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {onBrowse && (
        <Button variant="text" onClick={onBrowse}>
          Browse safety guides <ArrowRight size={20} />
        </Button>
      )}
    </div>
  );
}
export function CityButton() {
  const { city, setChooser } = useApp();
  return (
    <button
      className="city-button"
      aria-label={`Change location: ${city?.name || "Choose your city"}`}
      title={city?.name || "Choose your city"}
      onClick={() => setChooser(true)}
    >
      <MapPin size={24} />
      <span>{city?.name || "Choose your city"}</span>
      <ChevronDown size={21} />
    </button>
  );
}
export function Source({
  full = false,
  compact = false,
  refreshable = false,
}: {
  full?: boolean;
  compact?: boolean;
  refreshable?: boolean;
}) {
  const { weather, loading, refresh, city, online, error } = useApp();
  void compact;
  const [, setClock] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setClock((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <p className="source" aria-live="polite">
        {full
          ? `${city?.name} · Open-Meteo model estimate · `
          : "Open-Meteo estimate · "}
        {loading
          ? "Refreshing…"
          : weather
            ? freshnessLabel(weather.fetchedAt)
            : "Not loaded"}
        {weather &&
          (!online
            ? " · Offline saved data"
            : error
              ? " · Refresh failed"
              : isStale(weather)
                ? " · Out of date"
                : "")}
        {refreshable && (
          <button
            className="source-refresh"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh forecast"
          >
            <RefreshCw size={18} />
          </button>
        )}
        {weather && full && (
          <>
            <br />
            Conditions:{" "}
            {dateLabel(weather.current.time, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {weather.timezone || "Asia/Manila"}. Model estimates, not station
            observations.
          </>
        )}
      </p>
      {full && (
        <p className="location-accuracy-note">
          Area forecast, not a street-level measurement. Local conditions vary.
        </p>
      )}
    </>
  );
}

export function ForecastGuard({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const { city, setChooser, weather, loading, error, refresh, online } =
    useApp();
  if (!city)
    return (
      <div className="recovery">
        <Art scene="city" />
        <h2>Your local outlook</h2>
        <p>Choose your city for a heat outlook and outdoor-time comparisons.</p>
        <Button onClick={() => setChooser(true)}>
          Choose a city <MapPin size={20} />
        </Button>
        <ActionLink to="/learn">Read safety guides</ActionLink>
      </div>
    );
  if (!weather)
    return (
      <div className="recovery">
        <Art scene="sun" />
        {loading ? (
          <>
            <h2>Checking the outlook…</h2>
            <p role="status">Getting the latest forecast for {city.name}.</p>
            <div className="loading-line" />
          </>
        ) : (
          <>
            <h2>{online ? "Forecast unavailable" : "You’re offline"}</h2>
            <p>{error || "We couldn’t load the latest forecast."}</p>
            <Button onClick={refresh}>
              <RefreshCw size={21} />
              Retry
            </Button>
            <Button variant="text" onClick={() => setChooser(true)}>
              Change location
            </Button>
            <ActionLink to="/learn">Read safety guides</ActionLink>
          </>
        )}
      </div>
    );
  return (
    <>
      {!compact && (isStale(weather) || error) && (
        <div className="warning compact-warning" role="status">
          <TriangleAlert size={20} />
          <span>
            {isStale(weather)
              ? "Out-of-date forecast"
              : "Refresh failed · saved forecast"}
          </span>
          <button onClick={refresh} disabled={loading}>
            Retry
          </button>
        </div>
      )}
      {children}
    </>
  );
}
