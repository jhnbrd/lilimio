import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  TriangleAlert,
  MapPin,
  Footprints,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../state";
import { risk, isStale } from "../lib/heat";
import { upcoming, dateLabel } from "../lib/weather";
import {
  Art,
  ActionLink,
  ForecastGuard,
  Source,
  WeatherIcon,
  Button,
} from "../ui";
import { Chart } from "./Forecast";

export default function Today() {
  const { city, weather, temp, refresh, loading } = useApp();
  const [details, setDetails] = useState(false);
  const r = weather ? risk(weather.current.heatIndex) : null;
  return (
    <ForecastGuard>
      <div className="today-layout">
        <section className="today-main">
          <p className="eyebrow desktop-only">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "Asia/Manila",
            })}{" "}
            · {city?.name}
          </p>
          <h1>
            <span className="mobile-only">Today’s heat</span>
            <span className="desktop-only">Today’s heat outlook</span>
          </h1>
          <div className="heat-scene">
            <Art scene="heat" className="desktop-only"/><Art scene="mobileHeat" className="mobile-only"/>
            <div className="reading">
              {weather ? temp(weather.current.heatIndex) : "—"}
            </div>
            <p>Estimated heat index</p>
          </div>
          {r && (
            <div className={`risk-label ${r.tone}`}>
              <TriangleAlert size={34} />
              <div>
                <strong>{r.label}</strong>
                <p className="desktop-only">{r.guidance}</p><p className="mobile-only">{r.tone==="green"?"Keep water nearby. Recheck before heading out.":weather&&weather.current.heatIndex>=52?"Avoid exertion. Move to a cool place.":weather&&weather.current.heatIndex>=42?"Limit outdoor activity. Take cooling breaks.":"Plan shade and cooling breaks."}</p>
              </div>
            </div>
          )}
          <Source compact refreshable/>
          <div className="today-actions">
            <ActionLink variant="primary" to="/plan">
              Plan outdoor time
            </ActionLink>
            <ActionLink to="/explore">
              <MapPin size={23} />
              Find relief
            </ActionLink>
            <ActionLink className="mobile-only" to="/forecast">
              View full forecast
            </ActionLink>
          </div>
        </section>
        <section className="today-side">
          <div className="section-top">
            <h2>Upcoming heat index</h2>
            <ActionLink to="/forecast">View full forecast</ActionLink>
          </div>
          {weather && (
            <Chart
              hours={upcoming(weather)
                .filter((_, i) => i % 2 === 0)
                .slice(0, 5)}
            />
          )}
          <div className="next-step">
            <h2>Your next step</h2>
            <Link className="next-row" to="/plan">
              <span className="circle-icon">
                <Footprints size={30} />
              </span>
              <span>
                <strong>Compare times for an outdoor activity</strong>
                <small>See cooler times and plan around the heat.</small>
              </span>
              <ArrowRight size={24} />
            </Link>
          </div>
          <details
            className="weather-details"
            open={details}
            onToggle={(e) => setDetails(e.currentTarget.open)}
          >
            <summary>
              <Thermometer />
              Weather details
            </summary>
            {weather && (
              <>
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
                <Source full />
                <p className="muted">
                  Heat index describes shade and light wind. Direct sunlight,
                  clothing and activity affect your exposure.
                </p>
                <Button variant="text" onClick={refresh} disabled={loading}>
                  <RefreshCw size={18} />
                  {loading ? "Refreshing…" : "Refresh forecast"}
                </Button>
              </>
            )}
          </details>
        </section>
      </div>
    </ForecastGuard>
  );
}
