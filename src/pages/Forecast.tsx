import { useState } from "react";
import { Chart } from "../components/forecast-chart";
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
