import { useState } from "react";
import { Info, Sun, ArrowRight, ExternalLink } from "lucide-react";
import { Art, ActionLink, Source } from "../ui";
import { useApp } from "../state";
export default function Updates() {
  const [tab, setTab] = useState("Forecast");
  const { city, weather } = useApp();
  return (
    <div className="updates-layout">
      <section>
        <h1>Local updates</h1>
        <p className="lead desktop-only">
          Stay informed about heat conditions{city ? ` in ${city.name}` : ""}.
        </p>
        <Art scene="ready" className="mobile-only update-art" />
        <div className="tabs" role="group" aria-label="Update source">
          {["Forecast", "Official"].map((t) => (
            <button
              key={t}
              aria-pressed={t === tab}
              className={t === tab ? "selected" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Forecast" && (
          <article className="update-item">
            <Sun size={56} className="sun-icon" />
            <div>
              <h2>Your local heat outlook</h2>
              <p>Forecast estimate</p>
              <Source />
              <ActionLink to="/forecast">View forecast</ActionLink>
            </div>
          </article>
        )}
        <article className="update-item">
          <Info size={32} />
          <div>
            <p>Official advisories are not connected in this version.</p>
            <p className="muted">
              Check current bulletins directly with official sources.
            </p>
            <a
              className="button text"
              href="https://www.pagasa.dost.gov.ph/"
              target="_blank"
              rel="noreferrer"
            >
              View PAGASA <ExternalLink size={19} />
            </a>
            <a
              className="button text"
              href="https://doh.gov.ph/"
              target="_blank"
              rel="noreferrer"
            >
              View Department of Health <ExternalLink size={19} />
            </a>
          </div>
        </article>
      </section>
      <aside className="updates-aside desktop-only">
        <Art scene="ready" />
        <h2>Check the source</h2>
        <p className="lead">
          Forecast outlooks and official advisories are labeled separately.
        </p>
      </aside>
    </div>
  );
}
