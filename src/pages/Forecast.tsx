import { useState } from "react";
import { Pager, Paged } from "../components/pagination";
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
import { ActionLink, ForecastGuard, Source, WeatherIcon, Modal } from "../ui";

export default function Forecast() {
  const { weather, temp } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "hourly";
  const [detailTab, setDetailTab] = useState("Heat");
  const [selected, setSelected] = useState<Hour | null>(null);
  const [page, setPage] = useState(0);
  const hours = weather ? upcoming(weather).slice(0, 24) : [];
  const shown = hours.slice(page * 3, page * 3 + 3);
  return (
    <>
      <h1>Heat forecast</h1>

      <p className="lead desktop-only">
        Hourly estimates to help you plan your day.
      </p>
      <Source />
      <ForecastGuard compact>
        <div className="forecast-layout">
          <section>
            <div className="tabs" role="group" aria-label="Forecast view">
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
                tab === "daily" ? "hourly-pane hidden-pane" : "hourly-pane"
              }
            >
              <h2>Upcoming hourly estimates</h2>
              <div key={shown[0]?.time} className="forecast-chart-wrap">
                <Chart hours={shown} onSelect={setSelected} />
              </div>
              <div className="hour-list">
                {shown.map((h) => (
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
              <Pager
                page={page}
                count={Math.ceil(hours.length / 3)}
                onChange={setPage}
                label="Hours"
              />
              <p className="muted">
                Forecast estimates, not live observations.
              </p>
            </div>
          </section>
          <section
            className={`daily-pane ${tab === "hourly" ? "hidden-pane" : ""}`}
          >
            <h2>Daily peak heat index</h2>
            <p className="muted">Estimated daily maximum.</p>
            <Paged label="Days">
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
            </Paged>

            <p className="muted">Daily peaks use complete days.</p>
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
            <div className="tabs" role="group" aria-label="Forecast details">
              {["Heat", "Weather", "Sources"].map((value) => (
                <button
                  key={value}
                  aria-pressed={detailTab === value}
                  onClick={() => setDetailTab(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            {detailTab === "Heat" && (
              <>
                <div className="reading">{temp(selected.heatIndex)}</div>
                <p>Estimated heat index</p>
                <div className="risk-label warm">
                  <TriangleAlert />
                  <strong>{risk(selected.heatIndex).label}</strong>
                </div>
              </>
            )}
            {detailTab === "Weather" && (
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
            )}
            {detailTab === "Sources" && <Source full />}
            <ActionLink variant="primary" to="/plan">
              Compare outdoor times
            </ActionLink>
          </div>
        </Modal>
      )}
    </>
  );
}
