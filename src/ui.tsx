import {
  useEffect,
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
  BookOpen,
  Cloud,
  Moon,
} from "lucide-react";
import { useApp } from "./state";
import { cities, type City } from "./lib/data";
import { isStale } from "./lib/heat";
import { dateLabel } from "./lib/weather";

const scenes = {
  heat: {src:"today",box:"284 217 517 193"},
  mobileHeat:{src:"daily",box:"350 248 153 177"},
  foliage:{src:"guides",box:"180 638 335 220"},
  corner:{src:"settings",box:"1100 0 436 520"},
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
      className="dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X />
        </button>
      </div>
      {children}
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
  const [error, setError] = useState("");
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const results = cities.filter((c) =>
    (c.name + " " + c.region).toLowerCase().includes(query.toLowerCase()),
  );
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
          latitude < 4 ||
          latitude > 22 ||
          longitude < 116 ||
          longitude > 127
        ) {
          setError("Choose a location in the Philippines.");
          return;
        }
        onChoose({
          id: "device",
          name: "Your location",
          region: "Philippines",
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
      { timeout: 10000, maximumAge: 300000 },
    );
  }
  return (
    <div className="city-picker">
      <label className="field-label" htmlFor="city-search">
        City
      </label>
      <div className="search-field">
        <Search size={23} />
        <input
          id="city-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a city"
          autoComplete="off"
        />
      </div>
      <p className="muted">
        Choose one of six supported cities, or use device coordinates.
      </p>
      <div className="city-results">
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
        {!results.length && (
          <p>
            No supported city matches. Try a nearby city or use device location.
          </p>
        )}
      </div>
      <Button variant="outline" onClick={locate} disabled={locating}>
        <LocateFixed size={21} />
        {locating ? "Finding your location…" : "Use my location"}
      </Button>
      <p className="muted">
        Location is optional. Coordinates are sent to Open-Meteo for your
        forecast.
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
    <button className="city-button" onClick={() => setChooser(true)}>
      <MapPin size={24} />
      <span>{city?.name || "Choose your city"}</span>
      <ChevronDown size={21} />
    </button>
  );
}
export function Source({ full = false, compact = false, refreshable = false }: { full?: boolean; compact?: boolean; refreshable?: boolean }) {
  const { weather, loading, refresh } = useApp();
  return (
    <p className="source" aria-live="polite">
      Open-Meteo ·{" "}
      {loading
        ? "Refreshing forecast…"
        : weather
        ? `Updated ${dateLabel(weather.fetchedAt, { day: compact ? undefined : "numeric", month: compact ? undefined : "short", hour: "numeric", minute: "2-digit" })}`
        : "Forecast not loaded"}
      {refreshable && (
        <button className="source-refresh" type="button" onClick={refresh} disabled={loading} aria-label={loading ? "Refreshing forecast" : "Refresh forecast"} aria-busy={loading} title="Refresh forecast">
          <RefreshCw size={18} aria-hidden />
        </button>
      )}
      {full && weather && (
        <>
          <br />
          Model time:{" "}
          {dateLabel(weather.current.time, {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          })}
          . Estimates, not station observations.
        </>
      )}
    </p>
  );
}
export function ForecastGuard({ children }: { children: ReactNode }) {
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
      {isStale(weather) && (
        <div className="warning" role="status">
          <TriangleAlert size={24} />
          <div>
            <strong>Outdated data</strong>
            <p>
              Saved{" "}
              {dateLabel(weather.fetchedAt, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              . Current comparisons are unavailable.
            </p>
            <button onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh forecast"}</button>
          </div>
        </div>
      )}
      {error && (
        <div className="warning" role="alert">
          <TriangleAlert size={24} />
          <div>
            <strong>Couldn’t refresh the forecast</strong>
            <p>{error} Showing the last saved readings; check their update time.</p>
            <button onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Try again"}</button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
