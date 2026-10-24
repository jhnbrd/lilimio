import {
  MapPin,
  BookOpen,
  Bell,
  Settings,
  BarChart3,
  Bookmark,
} from "lucide-react";
import { Link } from "react-router-dom";
export default function More() {
  return (
    <section className="more-page">
      <p className="eyebrow">A little more help</p>
      <h1>Make room for cooler days.</h1>
      <div className="destination-grid">
        {[
          [BarChart3, "/forecast", "Forecast", "The hours ahead."],
          [MapPin, "/explore", "Find relief", "Find your next cool stop."],
          [BookOpen, "/learn", "Guides", "Practical help for hot days."],
          [Bell, "/updates", "Updates", "Outlooks and official sources."],
          [Bookmark, "/saved", "Saved", "Keep your plans close."],
          [Settings, "/settings", "Settings", "Make lilimio work for you."],
        ].map(([Icon, to, label, detail]) => {
          const Glyph = Icon as typeof MapPin;
          return (
            <Link key={String(to)} to={String(to)}>
              <Glyph size={24} />
              <span className="destination-copy">
                <strong>{String(label)}</strong>
                <small>{String(detail)}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
