import { useState } from "react";
import { Thermometer, Droplets, Wind, Sun, TriangleAlert } from "lucide-react";
import { useApp } from "../state";
import { risk } from "../lib/heat";
import { upcoming } from "../lib/weather";
import { Art, ActionLink, ForecastGuard, Source, Modal } from "../ui";
import { StationObservation } from "../components/station-observation";
import { Chart } from "../components/forecast-chart";
export default function Today() {
  const { weather, temp, units } = useApp();
  const [detailTab, setDetailTab] = useState("Guidance");
  const [details, setDetails] = useState(false);
  const r = weather ? risk(weather.current.heatIndex) : null;
  return (
    <div className="today-screen">
      <ForecastGuard compact>
        <div className="today-layout">
          <section className="today-main">
            <p className="eyebrow">A little awareness. A cooler day.</p>
            <h1>Today’s heat</h1>
            <div className={`heat-scene units-${units}`}>
              <Art scene="heat" className="heat-backdrop" />
              <div className="reading">
                {weather ? temp(weather.current.heatIndex) : "—"}
              </div>
              <p>Estimated heat index</p>
              <p className="current-air-temperature">
                <Thermometer size={20} /> Air temperature{" "}
                <strong>{weather && temp(weather.current.temperature)}</strong>
              </p>
            </div>
            {r && (
              <button
                className={`risk-label ${r.tone}`}
                onClick={() => setDetails(true)}
                aria-label={`${r.label}. Read heat guidance`}
              >
                <TriangleAlert size={24} />
                <span>
                  <strong>{r.label}</strong>
                  <small>
                    {weather!.current.heatIndex >= 42
                      ? "Limit exertion. Take cooling breaks."
                      : "Keep water nearby. Plan cooling breaks."}
                  </small>
                </span>
              </button>
            )}
            <Source compact />
            <div className="today-actions">
              <ActionLink variant="primary" to="/plan">
                Plan outdoor time
              </ActionLink>
              <ActionLink variant="outline" to="/forecast">
                Forecast
              </ActionLink>
            </div>
          </section>
          <section className="today-side">
            <h2>The hours ahead</h2>
            {weather && (
              <Chart
                hours={upcoming(weather)
                  .filter((_, i) => i % 2 === 0)
                  .slice(0, 4)}
              />
            )}
            <ActionLink to="/forecast">Explore the forecast</ActionLink>
            <div className="quiet-panel">
              <h2>Find your next cool stop</h2>
              <p>Browse nearby parks, indoor places and drinking water.</p>
              <ActionLink to="/explore">Find relief nearby</ActionLink>
            </div>
          </section>
        </div>
      </ForecastGuard>
      <StationObservation />
      {details && (
        <Modal title="Your heat outlook" onClose={() => setDetails(false)}>
          <div className="tabs" role="group" aria-label="Heat details">
            {["Guidance", "Weather", "Sources"].map((value) => (
              <button
                key={value}
                aria-pressed={detailTab === value}
                onClick={() => setDetailTab(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {detailTab === "Guidance" && (
            <>
              <p>{r?.guidance}</p>
              <p>
                Heat index describes shade and light wind. Sun, clothing and
                activity change your exposure.
              </p>
            </>
          )}
          {detailTab === "Weather" && weather && (
            <div className="detail-grid">
              <span>
                <Thermometer />
                Air temperature
                <strong>{temp(weather.current.temperature)}</strong>
              </span>
              <span>
                <Droplets />
                Humidity<strong>{weather.current.humidity}%</strong>
              </span>
              <span>
                <Wind />
                Wind<strong>{weather.current.wind} km/h</strong>
              </span>
              <span>
                <Sun />
                UV index<strong>{weather.current.uv}</strong>
              </span>
            </div>
          )}
          {detailTab === "Sources" && (
            <>
              <Source full refreshable />
              <ActionLink to="/settings/data">Sources & accuracy</ActionLink>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
