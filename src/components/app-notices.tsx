import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Cookie, Download, X } from "lucide-react";
import { useApp } from "../state";
import { usePwa } from "../pwa";
import { Button } from "../ui";
import { NoticeMotion } from "../motion";
import { installReminderEligible, nextNotice } from "../lib/notices";

/** A single notice slot prevents install, storage, update and toast overlays competing. */
export function AppNotices() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toast } = useApp();
  const pwa = usePwa();
  const card = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState(false);
  useEffect(() => {
    const check = () => setModal(!!document.querySelector("dialog[open]"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    return () => observer.disconnect();
  }, []);
  const kind = nextNotice({
    modal,
    toast: !!toast,
    update: pwa.refresh,
    storage: pwa.storagePending && !pathname.startsWith("/legal"),
    offline: pwa.ready,
    install: installReminderEligible({
      installed: pwa.installed,
      hidden: pwa.reminderHidden,
      sessionClosed: pwa.sessionClosed,
      pathname,
    }),
  });
  useLayoutEffect(() => {
    if (!kind || !card.current) return;
    const node = card.current;
    const measure = () =>
      document.documentElement.style.setProperty(
        "--notice-space",
        `${node.getBoundingClientRect().height + 28}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--notice-space");
    };
  }, [kind, toast]);
  return (
    <div
      className={`notice-host ${pathname === "/welcome" ? "welcome-notices" : ""}`}
    >
      <NoticeMotion visible={!!kind}>
        <div ref={card}>
          {kind === "toast" ? (
            <div className="toast" role="status">
              {toast}
            </div>
          ) : kind === "storage" ? (
            <aside className="app-notice" aria-labelledby="storage-title">
              <div className="notice-heading">
                <Cookie size={23} aria-hidden="true" />
                <h2 id="storage-title">A little storage, no tracking.</h2>
              </div>
              <p>
                lilimio. uses essential local storage and offline caching. We
                don’t set cookies or use advertising or analytics trackers.
              </p>
              <div className="notice-actions">
                <Button onClick={pwa.acknowledgeStorage}>
                  Accept essential storage
                </Button>
                <Link to="/legal/privacy">Privacy & controls</Link>
              </div>
              <small>
                External weather and map services receive your requests. No
                optional tracking is enabled.
              </small>
            </aside>
          ) : kind === "install" ? (
            <aside
              className="app-notice install-reminder"
              aria-labelledby="install-title"
            >
              <button
                className="icon-button notice-close"
                aria-label="Close install reminder for this session"
                onClick={() => pwa.hideReminder()}
              >
                <X size={20} />
              </button>
              <div className="install-reminder-heading">
                <img
                  src="/images/brand/lilimio/png/app-icon-256.png"
                  alt=""
                  width="48"
                  height="48"
                />
                <div>
                  <h2 id="install-title">A little shade, one tap away.</h2>
                  <p>Add lilimio to your home screen.</p>
                </div>
              </div>
              <div className="notice-actions">
                <Button
                  onClick={() =>
                    pwa.canInstall
                      ? void pwa.install()
                      : navigate("/settings/install")
                  }
                >
                  <Download size={18} />
                  Add to home screen
                </Button>
                <Button variant="text" onClick={() => pwa.hideReminder(true)}>
                  Don’t show again
                </Button>
              </div>
            </aside>
          ) : kind === "update" || kind === "offline" ? (
            <aside className="app-notice" aria-live="polite">
              <h2>
                {kind === "update"
                  ? "A new version is ready."
                  : "Your offline essentials are ready."}
              </h2>
              <p>
                {kind === "update"
                  ? "Update when you’re ready to reload the app."
                  : "The app and safety guides are saved for offline use."}
              </p>
              <div className="notice-actions">
                {kind === "update" && (
                  <Button onClick={pwa.update}>Update now</Button>
                )}
                <Button variant="text" onClick={pwa.dismissUpdate}>
                  Dismiss
                </Button>
              </div>
            </aside>
          ) : null}
        </div>
      </NoticeMotion>
    </div>
  );
}
