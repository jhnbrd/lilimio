import { Paged, Pager } from "../components/pagination";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Search,
  Droplets,
  Thermometer,
  ShieldCheck,
  Sun,
  Download,
  ChevronRight,
  BookOpen,
  Pause,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { useApp } from "../state";
import { guides } from "../lib/data";
import { readStored, writeStored } from "../lib/storage";
import { Art, ActionLink, Back, Button, Row } from "../ui";

const labels: Record<string, string> = {
  illness: "Recognize warning signs",
  hydration: "Stay cool and hydrated",
  outdoors: "Outdoor precautions",
  vulnerable: "Care for others",
  home: "Keep your home cooler",
  facts: "Heat: myths and facts",
};
const icons = [Thermometer, Droplets, Sun, ShieldCheck];
type Guide = (typeof guides)[number];
function downloaded() {
  return readStored<string[]>(
    "lilimio-downloaded-guides-v2",
    [],
    (v) =>
      Array.isArray(v) &&
      v.every(
        (id) => typeof id === "string" && guides.some((g) => g.id === id),
      ),
  );
}
export default function Learn() {
  const { id } = useParams();
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState("outdoors");
  const guide = guides.find((g) => g.id === (id || selection));
  const matches = guides.filter((g) =>
    (labels[g.id] + " " + g.title + " " + g.category)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (id && !guide)
    return (
      <>
        <Back to="/learn" />
        <h1>Guide not found</h1>
        <ActionLink to="/learn">Browse guides</ActionLink>
      </>
    );
  return (
    <div className={`learn-layout ${id ? "reading-view" : ""}`}>
      <section className="guide-index">
        <h1>Stay heat-aware</h1>
        <p className="lead desktop-only">
          Practical guides for more comfortable days in the heat.
        </p>
        <Art scene="guide" className="mobile-only guide-cover" />
        <label htmlFor="guide-search" className="field-label">
          Find a guide
        </label>
        <div className="search-field">
          <Search />
          <input
            id="guide-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides"
          />
        </div>
        <div className="guide-links">
          <Paged key={query} label="Guides">
            {matches.map((g, i) => {
              const Icon = icons[i % icons.length];
              return (
                <div key={g.id}>
                  <button
                    className={`row desktop-only ${selection === g.id ? "selected" : ""}`}
                    onClick={() => setSelection(g.id)}
                  >
                    <Icon className="row-icon" />
                    <span className="row-copy">
                      <span>{labels[g.id]}</span>
                      <small className="guide-summary">{g.subtitle}</small>
                    </span>
                    <ChevronRight size={22} />
                  </button>
                  <Link className="row mobile-only" to={`/learn/${g.id}`}>
                    <Icon className="row-icon" />
                    <span className="row-copy">
                      <span>{labels[g.id]}</span>
                      <small className="guide-summary">{g.subtitle}</small>
                    </span>
                    <ChevronRight size={22} />
                  </Link>
                </div>
              );
            })}
          </Paged>
          {!matches.length && <p>No guides match. Try “water” or “outdoor”.</p>}
        </div>
        <Row icon={<Download />} to="/downloads">
          Offline downloads
        </Row>
      </section>
      <section className="guide-reading">
        {guide && <Article guide={guide} />}
      </section>
    </div>
  );
}
export function Article({ guide }: { guide: Guide }) {
  const { notify } = useApp();
  const [section, setSection] = useState(0);
  useEffect(() => setSection(0), [guide.id]);
  const [ids, setIds] = useState(downloaded);
  const saved = ids.includes(guide.id);
  function download() {
    const next = [...new Set([...ids, guide.id])];
    if (!writeStored("lilimio-downloaded-guides-v2", next)) {
      notify("Guide could not be saved. Browser storage is unavailable.");
      return;
    }
    setIds(next);
    const text = `${guide.title}\n\nlilimio. · Heat-awareness guide\n\n${guide.intro}\n\n${guide.tips.map((t) => "• " + t).join("\n\n")}\n\nSource: ${guide.source}\nEmergency assistance: call your local emergency number (911 in the Philippines and US).`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `lilimio-${guide.id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Guide saved on this device and downloaded as text.");
  }
  return (
    <>
      <div className="mobile-only">
        <Back to="/learn" />
      </div>
      <h1>{guide.id === "outdoors" ? "Stay cool outdoors" : guide.title}</h1>

      <Art
        scene="guide"
        className="guide-cover"
        label="Illustration of a hat and water bottle in the shade"
      />
      <div className="guide-tips">
        {[guide.intro, ...guide.tips].slice(section, section + 1).map((tip) => {
          const i = Math.max(0, section - 1);
          const Icon =
            guide.id === "outdoors"
              ? [CalendarDays, Droplets, Pause, ShieldCheck][i % 4]
              : icons[i % icons.length];
          const titles =
            guide.id === "outdoors"
              ? [
                  "Plan around the heat",
                  "Keep water nearby",
                  "Take cooling breaks",
                  "Know your limits",
                ]
              : [];
          return (
            <div className="reason-row" key={tip}>
              <span className="circle-icon">
                <Icon size={26} />
              </span>
              <div>
                {section > 0 && titles[i] && <h3>{titles[i]}</h3>}
                <p>{tip}</p>
              </div>
            </div>
          );
        })}
      </div>
      <Pager
        page={section}
        count={guide.tips.length + 1}
        onChange={setSection}
        label="Section"
      />
      <div className="article-footer">
        <p className="source">
          Source: WHO ·{" "}
          <a href={guide.source} target="_blank" rel="noreferrer">
            View original ↗
          </a>
        </p>
        <Button onClick={download}>
          <Download size={21} />
          {saved ? "Download again" : "Download guide"}
        </Button>
        <ActionLink to="/downloads">View downloads</ActionLink>
      </div>
    </>
  );
}
export function Downloads() {
  const [ids, setIds] = useState(downloaded);
  const { notify } = useApp();
  function remove(id: string) {
    const next = ids.filter((x) => x !== id);
    if (writeStored("lilimio-downloaded-guides-v2", next)) {
      setIds(next);
      notify(
        "Guide removed from your saved list. Downloaded text files are unchanged.",
      );
    }
  }
  return (
    <>
      <Back to="/learn" />
      <h1>Downloaded guides</h1>
      <p className="lead">Saved for offline reading on this device.</p>
      {ids.length ? (
        <Paged label="Downloads">
          {ids.map((id) => {
            const g = guides.find((g) => g.id === id)!;
            return (
              <div className="download-row" key={id}>
                <Row icon={<BookOpen />} to={`/learn/${id}`}>
                  {g.title}
                </Row>
                <button
                  className="icon-button danger-text"
                  aria-label={`Remove ${g.title}`}
                  onClick={() => remove(id)}
                >
                  <Trash2 size={21} />
                </button>
              </div>
            );
          })}
        </Paged>
      ) : (
        <div className="empty-state">
          <Download size={35} />
          <h2>No saved guides yet</h2>
          <p>Open a safety guide and choose Download guide.</p>
          <ActionLink variant="primary" to="/learn">
            Browse guides
          </ActionLink>
        </div>
      )}
    </>
  );
}
