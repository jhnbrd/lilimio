import { lazy, Suspense, useEffect, useRef } from "react";
import {
  Link,
  NavLink,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigationType,
} from "react-router-dom";
import { MotionConfig } from "motion/react";
import {
  House,
  BarChart3,
  CalendarDays,
  MapPin,
  BookOpen,
  Bell,
  Settings as SettingsIcon,
  MoreHorizontal,
  Monitor,
  WifiOff,
  Bookmark,
} from "lucide-react";
import { AppProvider, useApp } from "./state";
import { PwaProvider } from "./pwa";
import { Art, Wordmark, CityButton, CityPicker, Modal, ActionLink } from "./ui";
import { readStored } from "./lib/storage";
import { RouteMotion } from "./motion";
import Today from "./pages/Today";
import Onboarding from "./pages/Onboarding";
import Legal from "./pages/Legal";
import { AppNotices } from "./components/app-notices";
const Forecast = lazy(() => import("./pages/Forecast"));
const Planner = lazy(() => import("./pages/Planner"));
const Saved = lazy(() =>
  import("./pages/Planner").then((m) => ({ default: m.Saved })),
);
const Explore = lazy(() => import("./pages/Explore"));
const Learn = lazy(() => import("./pages/Learn"));
const Downloads = lazy(() =>
  import("./pages/Learn").then((m) => ({ default: m.Downloads })),
);
const Settings = lazy(() => import("./pages/Settings"));
const Updates = lazy(() => import("./pages/Updates"));
const More = lazy(() => import("./pages/More"));
const navigation = [
  { to: "/", name: "Today", icon: House },
  { to: "/forecast", name: "Forecast", icon: BarChart3 },
  { to: "/plan", name: "Plan", icon: CalendarDays },
  { to: "/explore", name: "Explore", icon: MapPin },
  { to: "/learn", name: "Learn", icon: BookOpen },
  { to: "/updates", name: "Updates", icon: Bell },
];
function Shell() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const {
    city,
    setCity,
    chooser,
    setChooser,
    online,
    motionPreference,
    onboarded,
  } = useApp();
  const onboarding = location.pathname === "/welcome";
  useEffect(() => {
    document.title = `${onboarding ? "Welcome" : navigation.find((n) => n.to === location.pathname)?.name || "Your day"} · lilimio.`;
    const main = document.getElementById("main");
    main?.focus({ preventScroll: true });
    main?.scrollTo({
      top:
        navigationType === "POP"
          ? positions.current.get(location.pathname) || 0
          : 0,
      behavior: "instant",
    });
  }, [location.pathname, onboarding, navigationType]);
  if (location.pathname === "/" && !onboarded)
    return <Navigate to="/welcome" replace />;
  const more = !["/", "/today", "/forecast", "/plan", "/saved"].includes(
    location.pathname,
  );
  return (
    <MotionConfig
      reducedMotion={motionPreference === "reduced" ? "always" : "user"}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {onboarding ? (
        <Onboarding />
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="sidebar-logo" to="/" aria-label="lilimio. home">
              <Wordmark />
            </Link>
            <nav aria-label="Main navigation">
              {navigation.map(({ to, name, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === "/"}>
                  <Icon size={26} />
                  <span>{name}</span>
                </NavLink>
              ))}
              <NavLink className="settings-nav-link" to="/settings">
                <SettingsIcon size={26} />
                Settings
              </NavLink>
            </nav>
          </aside>
          <div
            className={`app-body screen-${location.pathname.split("/")[1] || "today"} ${location.pathname.split("/").length > 2 ? "detail-screen" : ""}`}
          >
            <header className="app-header">
              <Link className="mobile-brand" to="/" aria-label="lilimio. home">
                <Wordmark />
              </Link>
              <CityButton />
              <Link className="device-status" to="/saved">
                <Monitor size={19} />
                Saved on this device
              </Link>
            </header>
            {!online && (
              <div className="offline-status" role="status">
                <WifiOff size={21} />
                <span>
                  You’re offline. Forecasts may be outdated; maps need internet.
                </span>
              </div>
            )}
            <main
              id="main"
              onScroll={(event) =>
                positions.current.set(
                  location.pathname,
                  event.currentTarget.scrollTop,
                )
              }
              tabIndex={-1}
              className={`main-content route-${location.pathname.split("/")[1] || "today"}`}
            >
              <RouteMotion routeKey={location.pathname}>
                <Suspense
                  fallback={
                    <div className="route-loading" role="status">
                      Opening your next view…
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Today />} />
                    <Route
                      path="/today"
                      element={<Navigate to="/" replace />}
                    />
                    <Route path="/forecast" element={<Forecast />} />
                    <Route path="/plan" element={<Planner />} />
                    <Route path="/saved" element={<Saved />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/explore/:id" element={<Explore />} />
                    <Route path="/learn" element={<Learn />} />
                    <Route path="/learn/:id" element={<Learn />} />
                    <Route path="/downloads" element={<Downloads />} />
                    <Route path="/updates" element={<Updates />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/:panel" element={<Settings />} />
                    <Route path="/more" element={<More />} />
                    <Route path="/legal" element={<Legal />} />
                    <Route path="/legal/:document" element={<Legal />} />
                    <Route
                      path="*"
                      element={
                        <div className="recovery">
                          <h1>A little off the path</h1>
                          <p>This page could not be found.</p>
                          <ActionLink variant="primary" to="/">
                            Back to Today
                          </ActionLink>
                        </div>
                      }
                    />
                  </Routes>
                </Suspense>
              </RouteMotion>
            </main>
            <Art
              scene={location.pathname === "/more" ? "foliage" : "bottom"}
              className="app-scenery"
            />
            {location.pathname === "/plan" && (
              <Art scene="planner" className="plan-scenery" />
            )}
            {(location.pathname.startsWith("/settings") ||
              location.pathname === "/forecast") && (
              <Art scene="corner" className="corner-scenery" />
            )}
          </div>
          <nav className="bottom-nav" aria-label="Mobile navigation">
            <NavLink
              to="/"
              end
              className={
                ["/", "/forecast"].includes(location.pathname) ? "active" : ""
              }
            >
              <House size={25} />
              <span>Today</span>
            </NavLink>
            <NavLink
              to="/plan"
              className={
                ["/plan", "/saved"].includes(location.pathname) ? "active" : ""
              }
            >
              <CalendarDays size={25} />
              <span>Plan</span>
            </NavLink>
            <NavLink to="/more" className={more ? "active" : ""}>
              <MoreHorizontal size={27} />
              <span>More</span>
            </NavLink>
          </nav>
        </div>
      )}
      {chooser && (
        <Modal title="Your local outlook" onClose={() => setChooser(false)}>
          <CityPicker
            chosen={city}
            onChoose={(c) => {
              setCity(c);
              setChooser(false);
            }}
          />
        </Modal>
      )}
      <AppNotices />
    </MotionConfig>
  );
}
export function App() {
  return (
    <AppProvider>
      <PwaProvider>
        <Shell />
      </PwaProvider>
    </AppProvider>
  );
}
