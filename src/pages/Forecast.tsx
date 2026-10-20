import { useState, useId, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { useApp } from "../state";
import { type Hour, risk } from "../lib/heat";
import { upcoming, dailyPeaks, dateLabel, timeLabel } from "../lib/weather";
import {
  Art,
  ActionLink,
  Back,
  Button,
  ForecastGuard,
  Source,
  WeatherIcon,
  Modal,
  CityButton,
} from "../ui";

export function Chart({
  hours,
  onSelect,
}: {
  hours: Hour[];
  onSelect?: (h: Hour) => void;
}) {
  const [narrow, setNarrow] = useState(window.innerWidth < 768);
  useEffect(() => {
    const media = window.matchMedia("(max-width:767px)");
    const change = () => setNarrow(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const width = narrow ? 320 : 560;
  const { temp, units } = useApp();
  const id = useId().replace(/:/g, "");
  if (!hours.length) return <p>No upcoming hourly estimates are available.</p>;
  const values = hours.map((h) =>
      units === "F" ? (h.heatIndex * 9) / 5 + 32 : h.heatIndex,
    ),
    min = Math.floor((Math.min(...values) - 3) / 5) * 5,
    max = Math.ceil((Math.max(...values) + 3) / 5) * 5;
  const points = values.map((v, i) => [
    30 +
      (hours.length === 1
        ? (width - 60) / 2
        : (i * (width - 60)) / (hours.length - 1)),
    190 - ((v - min) / (max - min)) * 150,
  ]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return (
    <div className="chart">
      <p className="chart-unit">Estimated heat index (°{units})</p>
      <svg
        viewBox={`0 0 ${width} 240`}
        role="img"
        aria-label="Upcoming heat-index forecast. Read the values listed below."
      >
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb63f" stopOpacity=".24" />
            <stop offset="100%" stopColor="#ffb63f" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="30"
              y1={40 + i * 50}
              x2={width - 30}
              y2={40 + i * 50}
              stroke="#dfe2d9"
            />
            <text x="2" y={46 + i * 50} fill="#647184" fontSize="14">
              {Math.round(max - (i * (max - min)) / 3)}
            </text>
          </g>
        ))}
        <path
          d={`${path}L${points.at(-1)![0]},190L${points[0][0]},190Z`}
          fill={`url(#fill-${id})`}
        />
        <path
          d={path}
          fill="none"
          stroke="#f4a124"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <g key={hours[i].time}>
            <circle
              cx={x}
              cy={y}
              r="5.5"
              fill="#ffaa26"
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={x}
              y={y - 15}
              textAnchor="middle"
              fontSize={narrow ? 18 : 15}
              fill="#142d32"
            >
              {Math.round(values[i])}°
            </text>
            <text
              x={x}
              y="222"
              textAnchor="middle"
              fontSize={narrow ? 14 : 12}
              fill="#647184"
            >
              {timeLabel(hours[i].time).replace(":00", "")}
            </text>
          </g>
        ))}
      </svg>
      <details className="chart-values">
        <summary>Read chart values</summary>
        {hours.map((h) => (
          <div className="chart-value" key={h.time}>
            {onSelect ? (
              <button onClick={() => onSelect(h)}>
                {dateLabel(h.time, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                : {temp(h.heatIndex)}
              </button>
            ) : (
              <span>
                {dateLabel(h.time, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                : {temp(h.heatIndex)}
              </span>
            )}
          </div>
        ))}
      </details>
    </div>
  );
}
export default function Forecast() {
  const { weather, temp } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "hourly";
  const [selected, setSelected] = useState<Hour | null>(null);
  const [all, setAll] = useState(false);
  const hours = weather ? upcoming(weather) : [];
  const shown = hours.filter((_, i) => i % 2 === 0).slice(0, 5);
  return (
    <>
      <Back to="/" />
      <h1>Heat-index forecast</h1>
      <div className="mobile-only">
        <CityButton />
      </div>
      <p className="lead desktop-only">
        Hourly estimates to help you plan your day.
      </p>
      <Source />
      <ForecastGuard>
        <div className="forecast-layout">
          <section>
            <div
              className="tabs mobile-only"
              role="group"
              aria-label="Forecast view"
            >
              <button
                aria-pressed={tab === "hourly"}
                className={tab === "hourly" ? "selected" : ""}
                onClick={() => setParams({ tab: "hourly" })}
              >
                Hourly
              </button>
              <button
                aria-pressed={tab === "daily"}
                className={tab === "daily" ? "selected" : ""}
                onClick={() => setParams({ tab: "daily" })}
              >
                Daily
              </button>
            </div>
            <div
              className={
                tab === "daily" ? "hourly-pane desktop-only" : "hourly-pane"
              }
            >
              <h2>Upcoming hourly estimates</h2>
              <Chart hours={shown} onSelect={setSelected} />
              <div className="hour-list">
                {(all ? hours.slice(0, 24) : hours.slice(0, 2)).map((h) => (
                  <button
                    className="forecast-row"
                    key={h.time}
                    onClick={() => setSelected(h)}
                  >
                    <span>
                      {timeLabel(h.time)}
                      <small>{dateLabel(h.time)}</small>
                    </span>
                    <WeatherIcon
                      code={h.code}
                      size={35}
                      hour={Number(h.time.slice(11, 13))}
                    />
                    <strong>{temp(h.heatIndex)}</strong>
                    <ArrowRight size={20} />
                  </button>
                ))}
              </div>
              <Button variant="text" onClick={() => setAll((v) => !v)}>
                {all ? "Show fewer hours" : "View all upcoming hours"}
                <ArrowRight size={20} />
              </Button>
              <p className="muted">
                Forecast estimates, not live observations.
              </p>
            </div>
          </section>
          <section
            className={`daily-pane ${tab === "hourly" ? "desktop-only" : ""}`}
          >
            <h2>Daily peak heat index</h2>
            <p className="muted">Highest estimated heat index each day.</p>
            {weather &&
              dailyPeaks(weather).map((day) => (
                <button
                  className="forecast-row"
                  key={day.date}
                  onClick={() => setSelected(day.hour)}
                >
                  <span>{dateLabel(day.date)}</span>
                  <WeatherIcon code={day.hour.code} />
                  <strong>{temp(day.hour.heatIndex)}</strong>
                  <ArrowRight size={20} />
                </button>
              ))}
            <Art scene="sun" />
            <p className="muted">
              Peak calculated from complete days of hourly estimates.
            </p>
            <ActionLink variant="primary" to="/plan">
              Compare outdoor times
            </ActionLink>
          </section>
        </div>
      </ForecastGuard>
      {selected && (
        <Modal
          title={dateLabel(selected.time, {
            weekday: "long",
            hour: "numeric",
            minute: "2-digit",
          })}
          onClose={() => setSelected(null)}
        >
          <div className="hour-detail">
            <Art scene="sun" />
            <div className="reading">{temp(selected.heatIndex)}</div>
            <p>Estimated heat index</p>
            <div className="risk-label warm">
              <TriangleAlert />
              <strong>{risk(selected.heatIndex).label}</strong>
            </div>
            <div className="metrics">
              <div>
                <Thermometer />
                Air temperature<strong>{temp(selected.temperature)}</strong>
              </div>
              <div>
                <Droplets />
                Humidity<strong>{selected.humidity}%</strong>
              </div>
              <div>
                <Sun />
                UV index<strong>{selected.uv}</strong>
              </div>
              <div>
                <Wind />
                Wind<strong>{selected.wind} km/h</strong>
              </div>
            </div>
            <Source />
            <ActionLink variant="primary" to="/plan">
              Compare outdoor times
            </ActionLink>
          </div>
        </Modal>
      )}
    </>
  );
}
