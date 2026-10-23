import { timestamp } from "../lib/time";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Footprints,
  Sun,
  Thermometer,
  CalendarDays,
  Info,
  Bookmark,
  Check,
  MapPin,
  Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cities,type Place } from "../lib/data";
import {readSavedPlaces,saveDirectoryPlace} from '../lib/directory-storage';
import { useApp, validCity } from "../state";
import {
  activities,
  planActivity,
  isStale,
  type Activity,
  type Period,
} from "../lib/heat";
import { dateLabel, timeLabel } from "../lib/weather";
import { readStored, writeStored } from "../lib/storage";
import { ActionLink, Art, Back, Button, Modal, Source } from "../ui";

type Window = ReturnType<typeof planActivity>[number];
export type SavedPlan = {
  id: string;
  activity: Activity;
  duration: number;
  period: Period;
  city: { name: string; id: string };
  window: Window;
  forecastTime: string;
  savedAt: string;
};
export function validPlans(v: unknown): v is SavedPlan[] {
  return (
    Array.isArray(v) &&
    v.every(
      (p) =>
        typeof p?.id === "string" &&
        activities.includes(p.activity) &&
        [15, 30, 60, 120].includes(p.duration) &&
        ["Morning", "Afternoon", "Evening"].includes(p.period) &&
        typeof p?.city?.name === "string" &&
        typeof p?.window?.time === "string" &&
        Number.isFinite(timestamp(p.window.time)) &&
        Number.isFinite(Date.parse(p.window.end)) &&
        Number.isFinite(p.window.heatIndex),
    )
  );
}
export const planKey = "lilimio-plans-v2";
export default function Planner() {
  const {
    city,
    weather,
    loading,
    refresh,
    setChooser,
    temp,
    notify,
    motionPreference,
  } = useApp();
  const reduce = useReducedMotion() || motionPreference === "reduced";
  const navigate = useNavigate();
  const draft = readStored<{
    activity: Activity | "";
    duration: number;
    period: Period | "";
  }>(
    "lilimio-plan-draft-v2",
    { activity: "", duration: 0, period: "" },
    (v) =>
      !!v &&
      typeof v === "object" &&
      "activity" in v &&
      "duration" in v &&
      "period" in v,
  );
  const [activity, setActivity] = useState<Activity | "">(
    activities.includes(draft.activity as Activity) ? draft.activity : "",
  );
  const [duration, setDuration] = useState(
    [15, 30, 60, 120].includes(draft.duration) ? draft.duration : 0,
  );
  const [period, setPeriod] = useState<Period | "">(
    ["Morning", "Afternoon", "Evening"].includes(draft.period)
      ? draft.period
      : "",
  );
  useEffect(() => {
    writeStored("lilimio-plan-draft-v2", { activity, duration, period });
  }, [activity, duration, period]);
  const [picker, setPicker] = useState<
    "activity" | "duration" | "period" | null
  >(null);
  const [compared, setCompared] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(0);
  const [details, setDetails] = useState(false);
  const stale = weather ? isStale(weather) : false;
  const all =
    weather && activity && duration && period && !stale
      ? planActivity(weather, activity, duration, period).filter(
          (w) =>
            w.heatIndex < 52 &&
            (!(activity === "Exercise" || activity === "Outdoor work") ||
              w.heatIndex < 42),
        )
      : [];
  const first = all[0];
  const alternative = first
    ? all.find(
        (w) =>
          Math.abs(
            timestamp(w.time) - timestamp(first.time),
          ) >=
          3 * 3600000,
      )
    : undefined;
  const options = [first, alternative].filter((w): w is Window => !!w);
  const chosen = options[selected] || options[0];
  function compare(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!city) {
      setChooser(true);
      setError("Choose a location before comparing.");
      return;
    }
    if (!activity || !duration || !period) {
      setError("Choose your activity, duration and preferred time.");
      return;
    }
    writeStored("lilimio-plan-draft-v2", { activity, duration, period });
    setCompared(true);
    setSelected(0);
    if (window.matchMedia("(max-width:767px)").matches)
      requestAnimationFrame(() => {
        const result = document.getElementById("plan-results");
        result?.focus({ preventScroll: true });
        document.getElementById("main")?.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
      });
  }
  function save() {
    if (
      !chosen ||
      !weather ||
      isStale(weather) ||
      !city ||
      !activity ||
      !period
    ) {
      notify("Refresh the forecast before saving this plan.");
      return;
    }
    const saved: SavedPlan = {
      id: crypto.randomUUID(),
      activity,
      duration,
      period,
      city,
      window: chosen,
      forecastTime: weather.fetchedAt,
      savedAt: new Date().toISOString(),
    };
    const previous = readStored<SavedPlan[]>(planKey, [], validPlans);
    if (writeStored(planKey, [saved, ...previous].slice(0, 30))) {
      notify("Saved on this device. Recheck conditions before heading out.");
      navigate("/saved");
    } else notify("The plan could not be saved. Browser storage may be full.");
  }
  return (
    <div className={`planner-layout ${compared ? "has-results" : ""}`}>
      <section className="planner-form">
        <h1>Plan outdoor time</h1>
        <p className="lead desktop-only">
          Choose your activity, duration and preferred time to compare outdoor
          options{city ? ` in ${city.name}` : ""}.
        </p>
        <form onSubmit={compare}>
          <div className="selection-field">
            <label>Activity</label>
            <button
              type="button"
              onClick={() => setPicker("activity")}
              aria-haspopup="dialog"
            >
              <Footprints />
              <span>{activity || "Choose an activity"}</span>
              <ChevronRight />
            </button>
          </div>
          <div className="selection-field">
            <label>Duration</label>
            <button
              type="button"
              onClick={() => setPicker("duration")}
              aria-haspopup="dialog"
            >
              <Clock />
              <span>
                {duration
                  ? duration < 60
                    ? `${duration} minutes`
                    : `${duration / 60} ${duration === 60 ? "hour" : "hours"}`
                  : "How long?"}
              </span>
              <ChevronRight />
            </button>
          </div>
          <div className="selection-field">
            <label>Preferred time</label>
            <button
              type="button"
              onClick={() => setPicker("period")}
              aria-haspopup="dialog"
            >
              <Sun className="sun-icon" />
              <span>{period || "Choose a time of day"}</span>
              <ChevronRight />
            </button>
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <Button type="submit">
            Compare times <ArrowRight size={22} />
          </Button>
          <p className="muted">
            Uses upcoming forecast conditions. Actual exposure can differ.
          </p>
        </form>
        <Art scene="planner" className="planner-art" />
      </section>
      <section id="plan-results" className="plan-results" tabIndex={-1}>
        {!compared ? (
          <div className="planner-intro">
            <Art scene="ready" />
            <h2>
              A little planning.
              <br />A little more shade.
            </h2>
            <p>Compare upcoming heat, UV and rain before heading out.</p>
            <ActionLink to="/saved">Your saved plans</ActionLink>
          </div>
        ) : (
          <motion.div
            key={`${activity}-${duration}-${period}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button className="back" onClick={() => setCompared(false)}>
              ← Edit activity
            </button>
            <h2>Your outdoor options</h2>
            <p className="muted">
              {activity} · {duration} minutes · {city?.name}
            </p>
            {!weather || stale ? (
              <div className="empty-state">
                <Sun size={38} />
                <h3>
                  {loading
                    ? "Checking the forecast…"
                    : "A current forecast is needed"}
                </h3>
                <p>
                  {stale
                    ? "Saved weather is out of date. Refresh to compare upcoming times."
                    : "Connect to load the latest conditions."}
                </p>
                <Button onClick={refresh} disabled={loading}>
                  {loading ? "Refreshing…" : "Refresh forecast"}
                </Button>
                <ActionLink to="/learn">Read safety guides</ActionLink>
              </div>
            ) : !chosen ? (
              <div className="empty-state">
                <h3>No suitable window identified</h3>
                <p>
                  Try a shorter activity or a fresh forecast. Extremely hot
                  windows and high-heat exercise/work windows are excluded.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDuration(30);
                    setCompared(false);
                  }}
                >
                  Change activity
                </Button>
                <ActionLink to="/learn">Read safety guides</ActionLink>
              </div>
            ) : (
              <>
                {options.map((w, i) => (
                  <button
                    className={`window-option ${selected === i ? "selected" : ""}`}
                    key={w.time}
                    onClick={() => setSelected(i)}
                  >
                    <span className="window-icon">
                      {i === 0 ? (
                        <Sun size={44} className="sun-icon" />
                      ) : (
                        <Clock size={36} />
                      )}
                    </span>
                    <span>
                      <small>
                        {i === 0 ? "Lower-score comparison" : "Alternative"} ·{" "}
                        {dateLabel(w.time)}
                      </small>
                      <strong>
                        {timeLabel(w.time)} – {timeLabel(w.end)}
                      </strong>
                      <small>
                        {w.preferred
                          ? `Within your preferred ${period.toLowerCase()}.`
                          : `Outside your preferred ${period.toLowerCase()}.`}
                      </small>
                      <small>
                        {temp(w.heatIndex)} peak · {w.risk.label}
                      </small>
                      <small>UV up to {w.uv.toFixed(1)} · rain chance up to {w.rain}%.
                        {i > 0 && first ? ` Compared with the first option: ${Math.abs(w.heatIndex - first.heatIndex).toFixed(1)}°C ${w.heatIndex < first.heatIndex ? "lower" : "higher"} heat index; ${Math.abs(w.uv - first.uv).toFixed(1)} ${w.uv < first.uv ? "lower" : "higher"} UV.` : " Ranked by heat, effort, duration, UV, rain and your preferred period."}
                      </small>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
                <details
                  className="reasons"
                  open={details}
                  onToggle={(e) => setDetails(e.currentTarget.open)}
                >
                  <summary>
                    <Info />
                    Why these times?
                  </summary>
                  <div className="reason-row">
                    <Thermometer />
                    <div>
                      <h3>Heat conditions</h3>
                      <p>
                        {temp(chosen.heatIndex)} maximum estimated heat index
                        during this window.
                      </p>
                    </div>
                  </div>
                  <div className="reason-row">
                    <Sun className="sun-icon" />
                    <div>
                      <h3>UV and rain</h3>
                      <p>
                        UV index up to {chosen.uv.toFixed(1)}. Rain probability
                        up to {chosen.rain}%.
                      </p>
                    </div>
                  </div>
                  <div className="reason-row">
                    <CalendarDays />
                    <div>
                      <h3>Your preferred schedule</h3>
                      <p>
                        {chosen.preferred ? "Within" : "Outside"} your preferred{" "}
                        {period.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                </details>
                <p className="muted">
                  A comparison of forecast conditions, not a safety guarantee.
                  The experimental score weighs heat, activity, duration, UV,
                  rain and your preferred period.
                </p>
                <Source />
                <Button onClick={save}>
                  Save plan <Bookmark size={20} />
                </Button>
                <ActionLink to="/forecast">View forecast</ActionLink>
              </>
            )}
          </motion.div>
        )}
      </section>
      {picker && (
        <Modal
          title={
            picker === "activity"
              ? "What will you be doing?"
              : picker === "duration"
                ? "How long will you be outdoors?"
                : "When would you prefer to go?"
          }
          onClose={() => setPicker(null)}
        >
          {(picker === "activity"
            ? activities
            : picker === "duration"
              ? [15, 30, 60, 120]
              : ["Morning", "Afternoon", "Evening"]
          ).map((value) => (
            <button
              className="picker-row"
              key={value}
              onClick={() => {
                if (picker === "activity") setActivity(value as Activity);
                else if (picker === "duration") setDuration(Number(value));
                else setPeriod(value as Period);
                setCompared(false);
                setPicker(null);
              }}
            >
              {typeof value === "number"
                ? value < 60
                  ? `${value} minutes`
                  : `${value / 60} ${value === 60 ? "hour" : "hours"}`
                : value}
              <ChevronRight size={22} />
            </button>
          ))}
        </Modal>
      )}
    </div>
  );
}
export function Saved() {
  const { notify, refresh, temp, setCity, setChooser } = useApp();
  const [savedPlaces, setSavedPlaces] = useState(readSavedPlaces);
  function recheck(p: SavedPlan) {
    const location = validCity(p.city)
      ? p.city
      : cities.find((c) => c.id === p.city.id);
    if (location) {
      setCity(location);
      refresh();
    } else {
      setChooser(true);
      notify("Choose the saved plan’s location to recheck.");
    }
  }
  function unsavePlace(place:Place) {
    if (saveDirectoryPlace(place,false)) setSavedPlaces(readSavedPlaces());
    else notify('This place could not be removed.');
  }
  const [plans, setPlans] = useState(() =>
    readStored<SavedPlan[]>(planKey, [], validPlans),
  );
  function remove(id: string) {
    const next = plans.filter((p) => p.id !== id);
    if (writeStored(planKey, next)) {
      setPlans(next);
      notify("Plan removed from this device.");
    } else notify("This plan could not be removed.");
  }
  return (
    <>
      <Back to="/settings" />
      <h1>Saved plans</h1>
      <p className="lead">Your outdoor plans, kept on this device.</p>
      {!plans.length ? (
        <div className="empty-state">
          <Bookmark size={36} />
          <h2>No plans saved yet</h2>
          <p>Compare outdoor times and save a window to find it here.</p>
          <ActionLink variant="primary" to="/plan">
            Plan outdoor time
          </ActionLink>
        </div>
      ) : (
        <div className="saved-plans">
          {plans.map((p) => (
            <article className="saved-plan" key={p.id}>
              <div className="section-top">
                <h2>{p.activity}</h2>
                <Bookmark fill="currentColor" />
              </div>
              <strong>
                {dateLabel(p.window.time)} · {timeLabel(p.window.time)} –{" "}
                {timeLabel(p.window.end)}
              </strong>
              <p>
                <MapPin size={19} />
                {p.city.name} · {p.duration} minutes
              </p>
              <p className="muted">
                {Date.parse(p.window.end) < Date.now() ? "Past plan · " : ""}
                Original estimate: {temp(p.window.heatIndex)}. Forecast saved{" "}
                {dateLabel(p.forecastTime, {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                .
              </p>
              <Art scene="planner" />
              <Link
                className="button primary"
                to="/forecast"
                onClick={() => recheck(p)}
              >
                Recheck forecast <ArrowRight size={20} />
              </Link>
              <ActionLink variant="outline" to="/plan">
                Edit activity
              </ActionLink>
              <Button
                className="danger-text"
                variant="text"
                onClick={() => remove(p.id)}
              >
                <Trash2 size={18} />
                Remove plan
              </Button>
            </article>
          ))}
        </div>
      )}
      <section className="saved-places">
        <h2>Saved places</h2>
        {savedPlaces.length ? (
          savedPlaces.map((place) => {
            const id=place.id;
            return place ? (
              <div className="saved-place-line" key={id}>
                <Link className="row" to={`/explore/${id}`}>
                  <MapPin />
                  <span className="row-copy">
                    {place.name}
                    <small>{place.osm?'OpenStreetMap · recheck access and hours':'Unverified starter listing'}</small>
                  </span>
                  <ChevronRight />
                </Link>
                <button
                  className="icon-button danger-text"
                  onClick={() => unsavePlace(place)}
                  aria-label={`Remove ${place.name}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ) : null;
          })
        ) : (
          <p className="muted">
            Places you save in Find relief will appear here.
          </p>
        )}
      </section>
    </>
  );
}
