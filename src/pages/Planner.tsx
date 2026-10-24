import { Paged } from "../components/pagination";
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
  Bookmark,
  MapPin,
  Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cities, type Place } from "../lib/data";
import { readSavedPlaces, saveDirectoryPlace } from "../lib/directory-storage";
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
import { ActionLink, Art, Button, Modal, Source } from "../ui";

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
          Math.abs(timestamp(w.time) - timestamp(first.time)) >= 3 * 3600000,
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
        document
          .getElementById("main")
          ?.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
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
            <div className="result-heading">
              <h2>Outdoor options</h2>
              <button
                className="button text"
                onClick={() => setCompared(false)}
              >
                Edit
              </button>
            </div>
            <p className="muted">
              {activity} · {duration} minutes
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
                <Paged label="Options">
                  {options.map((w, i) => (
                    <button
                      className={`window-option ${selected === i ? "selected" : ""}`}
                      key={w.time}
                      onClick={() => {
                        setSelected(i);
                        setDetails(true);
                      }}
                      aria-haspopup="dialog"
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
                          {i === 0 ? "Option 1" : "Option 2"} ·{" "}
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
                        <small className="window-weather">
                          UV {w.uv.toFixed(1)} · {w.rain}% rain chance
                        </small>
                      </span>
                      <ChevronRight />
                    </button>
                  ))}
                </Paged>

                {details && (
                  <Modal
                    title="Why these times?"
                    onClose={() => setDetails(false)}
                  >
                    <Paged size={1} label="Reason">
                      <div className="reason-row">
                        <Thermometer />
                        <div>
                          <h3>Heat conditions</h3>
                          <p>
                            {temp(chosen.heatIndex)} maximum estimated heat
                            index during this window.
                          </p>
                        </div>
                      </div>
                      <div className="reason-row">
                        <Sun className="sun-icon" />
                        <div>
                          <h3>UV and rain</h3>
                          <p>
                            UV index up to {chosen.uv.toFixed(1)}. Rain
                            probability up to {chosen.rain}%.
                          </p>
                        </div>
                      </div>
                      <div className="reason-row">
                        <CalendarDays />
                        <div>
                          <h3>Your preferred schedule</h3>
                          <p>
                            {chosen.preferred ? "Within" : "Outside"} your
                            preferred {period.toLowerCase()}.
                          </p>
                        </div>
                      </div>
                      <ActionLink to="/forecast">View forecast</ActionLink>
                      <p>
                        The experimental score weighs heat, effort, duration,
                        UV, rain and your preferred period. This comparison
                        cannot guarantee safe exposure.
                      </p>
                    </Paged>
                  </Modal>
                )}
                <p className="comparison-note">Not a safety guarantee.</p>
                <Source compact />
                <div className="result-actions">
                  <Button onClick={save}>
                    Save plan <Bookmark size={20} />
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => setDetails(true)}
                  >
                    Why these times?
                  </Button>
                </div>
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
  const [tab, setTab] = useState("Plans");
  const [detail, setDetail] = useState<SavedPlan | null>(null);
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
  function unsavePlace(place: Place) {
    if (saveDirectoryPlace(place, false)) setSavedPlaces(readSavedPlaces());
    else notify("This place could not be removed.");
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
      <h1>Saved on this device</h1>
      <div className="tabs" role="group" aria-label="Saved type">
        {["Plans", "Places", "Reading"].map((value) => (
          <button
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {tab === "Reading" && (
        <ActionLink to="/downloads">Downloaded guides</ActionLink>
      )}
      {tab === "Plans" && (
        <>
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
              <Paged size={1} label="Plans">
                {plans.map((p) => (
                  <button
                    className="row saved-plan-summary"
                    key={p.id}
                    onClick={() => setDetail(p)}
                  >
                    <Bookmark size={22} />
                    <span className="row-copy">
                      <strong>
                        {p.activity} · {p.city.name}
                      </strong>
                      <small>
                        {dateLabel(p.window.time)} · {timeLabel(p.window.time)}{" "}
                        – {timeLabel(p.window.end)}
                      </small>
                    </span>
                    <ChevronRight size={20} />
                  </button>
                ))}
              </Paged>
            </div>
          )}
        </>
      )}
      {detail && (
        <Modal title={detail.activity} onClose={() => setDetail(null)}>
          <p>
            {detail.city.name} · {detail.duration} minutes
          </p>
          <p>
            {dateLabel(detail.window.time)} · {timeLabel(detail.window.time)} –{" "}
            {timeLabel(detail.window.end)}
          </p>
          <p>
            {Date.parse(detail.window.end) < Date.now() ? "Past plan. " : ""}
            Original estimate: {temp(detail.window.heatIndex)}. Saved{" "}
            {dateLabel(detail.forecastTime, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            . Recheck before heading out.
          </p>
          <Link
            className="button primary"
            to="/forecast"
            onClick={() => recheck(detail)}
          >
            Recheck forecast
          </Link>
          <ActionLink to="/plan">Edit activity</ActionLink>
          <Button
            className="danger-text"
            variant="text"
            onClick={() => {
              remove(detail.id);
              setDetail(null);
            }}
          >
            Remove plan
          </Button>
        </Modal>
      )}
      {tab === "Places" && (
        <section className="saved-places">
          <h2>Saved places</h2>
          {savedPlaces.length ? (
            <Paged label="Places">
              {savedPlaces.map((place) => {
                const id = place.id;
                return place ? (
                  <div className="saved-place-line" key={id}>
                    <Link className="row" to={`/explore/${id}`}>
                      <MapPin />
                      <span className="row-copy">
                        {place.name}
                        <small>
                          {place.osm
                            ? "OpenStreetMap · recheck access and hours"
                            : "Unverified starter listing"}
                        </small>
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
              })}
            </Paged>
          ) : (
            <p className="muted">
              Places you save in Find relief will appear here.
            </p>
          )}
        </section>
      )}
    </>
  );
}
