import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Thermometer,
  Navigation,
  Bookmark,
  Bell,
  Download,
  FileText,
  Shield,
  ArrowRight,
  Zap,
  Sun,
  Info,
  Trash2,
} from "lucide-react";
import { useApp } from "../state";
import { usePwa } from "../pwa";
import { Art, Back, Button, Row, Modal, ActionLink } from "../ui";
import { readStored, writeStored } from "../lib/storage";
import { LegalLinks } from "../components/legal";
export default function Settings() {
  const { panel } = useParams();
  const {
    city,
    setChooser,
    units,
    setUnits,
    motionPreference,
    setMotionPreference,
    notify,
  } = useApp();
  const {
    install,
    installed,
    reminderHidden,
    sessionClosed,
    resetReminder,
    hideReminder,
    reopenStorage,
  } = usePwa();
  const [picker, setPicker] = useState<"units" | "motion" | null>(null);
  const [clear, setClear] = useState(false);
  const [notification, setNotification] = useState(() =>
    readStored(
      "lilimio-notification-draft",
      { heat: false, daily: false },
      (v) => !!v && typeof v === "object" && "heat" in v && "daily" in v,
    ),
  );
  const main = (
    <>
      <h2>Preferences</h2>
      <p className="muted">Set your defaults for a more helpful experience.</p>
      <Row
        icon={<MapPin />}
        detail={city?.name || "Choose a city"}
        onClick={() => setChooser(true)}
      >
        Location
      </Row>
      <Row
        icon={<Thermometer />}
        detail={units === "C" ? "Celsius (°C)" : "Fahrenheit (°F)"}
        onClick={() => setPicker("units")}
      >
        Units
      </Row>
      <Row
        icon={<Navigation />}
        detail={
          motionPreference === "system" ? "Follow device" : "Reduced motion"
        }
        onClick={() => setPicker("motion")}
      >
        Motion
      </Row>
      <h2 className="section-space desktop-only">On this device</h2>
      <p className="muted desktop-only">
        Manage what you’ve saved for offline use.
      </p>
      <Row
        icon={<FileText />}
        detail={
          <span className="desktop-only">
            View and manage your outdoor plans.
          </span>
        }
        to="/saved"
      >
        Saved items
      </Row>
      <div className="desktop-only">
        <Row
          icon={<Download />}
          detail="Guides available offline."
          to="/downloads"
        >
          Downloaded guides
        </Row>
      </div>
      <Row icon={<Bell />} to="/settings/notifications">
        Notifications
      </Row>
      <Row icon={<Download />} to="/settings/install">
        Install lilimio
      </Row>
      <ActionLink to="/settings/privacy">Privacy & data</ActionLink>
      <Row icon={<Shield />} to="/legal/terms">
        Terms, sources & licenses
      </Row>
      <p className="muted public-use-note">
        Free for public use. No account required.
      </p>
    </>
  );
  const content =
    panel === "install" ? (
      <>
        <h1>Keep lilimio close</h1>
        <div className="install-art">
          <Art scene="ready" />
          <img
            src="/images/brand/lilimio/png/app-icon-256.png"
            alt="lilimio. app icon"
          />
        </div>
        <h2>Add lilimio to your home screen.</h2>
        <p className="lead">
          Quick access to today’s heat, your plans and helpful guides.
        </p>
        <Row
          icon={<Zap />}
          detail="Open lilimio with one tap."
          trailing={<></>}
        >
          Quick access
        </Row>
        <Row
          icon={<Download />}
          detail="Read guides and saved content without internet."
          trailing={<></>}
        >
          Offline essentials
        </Row>
        <Button onClick={() => void install()}>
          {installed ? "Already installed" : "Install lilimio"}
          <Download size={21} />
        </Button>
        <details className="install-steps">
          <summary>View install steps</summary>
          <p>
            <strong>Android / desktop:</strong> Open the browser menu, then
            choose Install app.
          </p>
          <p>
            <strong>iPhone / iPad:</strong> Open in Safari, tap Share, then Add
            to Home Screen.
          </p>
          <p>Live forecasts and map tiles need an internet connection.</p>
        </details>
        {!installed && (
          <section className="reminder-preferences">
            <h2>Home-screen reminder</h2>
            <p>
              {reminderHidden
                ? "Reminders are turned off in this browser."
                : sessionClosed
                  ? "Closed for this tab session. It can return on your next visit."
                  : "Shown during browser visits. Hidden when opened from your home screen."}
            </p>
            <Button
              variant="outline"
              onClick={
                reminderHidden || sessionClosed
                  ? resetReminder
                  : () => hideReminder(true)
              }
            >
              {reminderHidden || sessionClosed
                ? "Show install reminders again"
                : "Don’t show install reminders"}
            </Button>
          </section>
        )}
        <ActionLink to="/settings">Not now</ActionLink>
      </>
    ) : panel === "notifications" ? (
      <>
        <h1>Notifications</h1>
        <div className="notification-art">
          <Art scene="sun" />
          <Bell size={66} />
        </div>
        <h2>Automatic delivery is not connected yet.</h2>
        <p>
          These preferences are saved on this device. They do not enable alerts
          or scheduled notifications.
        </p>
        <label className="switch-row">
          <Sun size={28} />
          <span>
            Heat outlook<small>Preference for future heat updates.</small>
          </span>
          <input
            type="checkbox"
            checked={notification.heat}
            onChange={(e) =>
              setNotification({ ...notification, heat: e.target.checked })
            }
          />
        </label>
        <label className="switch-row">
          <FileText size={28} />
          <span>
            Daily summary<small>Preference for a future daily update.</small>
          </span>
          <input
            type="checkbox"
            checked={notification.daily}
            onChange={(e) =>
              setNotification({ ...notification, daily: e.target.checked })
            }
          />
        </label>
        <Button
          onClick={() =>
            notify(
              writeStored("lilimio-notification-draft", notification)
                ? "Preferences saved. Automatic notifications remain unavailable."
                : "Preferences could not be saved.",
            )
          }
        >
          Save preferences
        </Button>
        <p className="muted">You can use lilimio without notifications.</p>
      </>
    ) : panel === "privacy" ? (
      <>
        <h1>Privacy & data</h1>
        <p className="lead">Your plans stay on your device.</p>
        <div className="prose">
          <h2>What is stored</h2>
          <p>
            Your chosen city, temperature units, motion preference, saved plans,
            place bookmarks, guide downloads, notice choices, install-reminder
            preferences and correction drafts use this browser’s storage.
          </p>
          <h2>External services</h2>
          <p>
            Weather coordinates go directly to Open-Meteo. Directory city
            searches use Open-Meteo / GeoNames; nearby-place searches send the
            selected city's coordinates to{" "}
            <a
              href="https://photon.komoot.io/"
              target="_blank"
              rel="noreferrer"
            >
              Photon by komoot
            </a>{" "}
            for OpenStreetMap results. Maps load tiles from OpenFreeMap with
            OpenStreetMap data. Directions open Google Maps only when you choose
            them.
          </p>
          <h2>No account required</h2>
          <p>
            This version has no sign-in or analytics integration. Clearing
            browser data removes your local saves. Correction drafts are not
            submitted to a server.
          </p>
          <p>
            The app sets no cookies and has no optional tracking to enable.
            Local storage and offline caching support the features you use.
            Third-party services may retain their own connection logs.
          </p>
          <Button variant="outline" onClick={reopenStorage}>
            Review storage notice
          </Button>
          <LegalLinks />
          <Button variant="outline" onClick={() => setClear(true)}>
            <Trash2 size={20} />
            Clear lilimio local data
          </Button>
          <p className="muted">
            This clears local saved items and tab reminder preferences. To also
            remove offline caches and service workers, use your browser’s
            site-data controls. Downloaded files are unchanged.
          </p>
        </div>
      </>
    ) : (
      main
    );
  return (
    <>
      <div className="mobile-only">
        <Back to="/more" />
      </div>
      {!panel && (
        <>
          <h1>Settings</h1>
          <p className="lead desktop-only">
            Customize your experience and manage what’s saved on this device.
          </p>
        </>
      )}
      <div className={`settings-layout ${panel ? "subpage" : ""}`}>
        <nav
          className="settings-nav desktop-only"
          aria-label="Settings sections"
        >
          {[
            ["/settings", "Preferences"],
            ["/saved", "Saved items"],
            ["/downloads", "Downloads"],
            ["/settings/install", "Install"],
            ["/settings/notifications", "Notifications"],
            ["/settings/privacy", "Privacy"],
            ["/legal/terms", "Terms & licenses"],
          ].map(([to, label]) => (
            <Link
              key={to}
              className={
                to === `/settings${panel ? "/" + panel : ""}` ? "selected" : ""
              }
              to={to}
            >
              {label}
            </Link>
          ))}
        </nav>
        <section className="settings-content">{content}</section>
        <div className="settings-art desktop-only">
          <Art scene="ready" />
        </div>
      </div>
      {picker && (
        <Modal
          title={picker === "units" ? "Temperature units" : "Motion preference"}
          onClose={() => setPicker(null)}
        >
          {(picker === "units"
            ? [
                ["C", "Celsius (°C)"],
                ["F", "Fahrenheit (°F)"],
              ]
            : [
                ["system", "Follow device"],
                ["reduced", "Reduced motion"],
              ]
          ).map(([value, label]) => (
            <button
              className="picker-row"
              key={value}
              onClick={() => {
                picker === "units"
                  ? setUnits(value as "C" | "F")
                  : setMotionPreference(value as "system" | "reduced");
                setPicker(null);
              }}
            >
              {label}
              <span>
                {(picker === "units" ? units : motionPreference) === value
                  ? "●"
                  : ""}
              </span>
            </button>
          ))}
        </Modal>
      )}
      {clear && (
        <Modal title="Clear local data?" onClose={() => setClear(false)}>
          <p>
            This removes lilimio’s saved plans, locations, preferences,
            bookmarks and drafts in this browser. Downloaded text files are
            unchanged.
          </p>
          <Button
            className="danger-button"
            onClick={() => {
              try {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("lilimio-"))
                  .forEach((k) => localStorage.removeItem(k));
                try {
                  Object.keys(sessionStorage)
                    .filter((k) => k.startsWith("lilimio-"))
                    .forEach((k) => sessionStorage.removeItem(k));
                } catch {
                  /* Local data was cleared even if session storage is blocked. */
                }
                window.location.assign("/welcome");
              } catch {
                notify("Browser storage could not be cleared.");
              }
            }}
          >
            Clear local data
          </Button>
          <Button variant="text" onClick={() => setClear(false)}>
            Keep my data
          </Button>
        </Modal>
      )}
    </>
  );
}
