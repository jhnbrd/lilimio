import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Info } from "lucide-react";
import { useApp } from "../state";
import { usePwa } from "../pwa";
import { Button, Modal, ActionLink } from "../ui";
import {
  installReminderEligible,
  nextNotice,
  type NoticeKind,
} from "../lib/notices";
/** One header entry for optional notices; transient feedback gets a measured slot. */
export function AppNotices() {
  const { pathname } = useLocation();
  const { toast } = useApp();
  const pwa = usePwa();
  const card = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState(false);
  const [details, setDetails] = useState<NoticeKind>(null);
  useEffect(() => {
    const check = () =>
      setModal(
        [...document.querySelectorAll("dialog[open]")].some(
          (dialog) => !dialog.closest(".notice-details"),
        ),
      );
    const observer = new MutationObserver(check);
    check();
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
    storage:
      pwa.storagePending &&
      pathname !== "/welcome" &&
      !pathname.startsWith("/legal"),
    offline: pwa.ready,
    install: installReminderEligible({
      installed: pwa.installed,
      hidden: pwa.reminderHidden,
      sessionClosed: pwa.sessionClosed,
      pathname,
    }),
  });
  useLayoutEffect(() => {
    if (!kind) return;
    document.documentElement.dataset.notice = kind;
    if (kind !== "toast" || !card.current)
      return () => {
        delete document.documentElement.dataset.notice;
      };
    const measure = () =>
      document.documentElement.style.setProperty(
        "--notice-space",
        `${card.current!.getBoundingClientRect().height + 12}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(card.current);
    measure();
    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.notice;
      document.documentElement.style.removeProperty("--notice-space");
    };
  }, [kind, toast]);
  const labels = {
    storage: "Storage notice",
    install: "Install app",
    update: "Update ready",
    offline: "Offline ready",
    toast: "Feedback",
  };
  return (
    <>
      {kind &&
        (kind === "toast" ? (
          <div className="notice-host">
            <div ref={card} className="notice-bar" role="status">
              {toast}
            </div>
          </div>
        ) : (
          <button
            className="header-notice"
            onClick={() => setDetails(kind)}
            aria-haspopup="dialog"
          >
            <Info size={18} />
            <span>{labels[kind]}</span>
          </button>
        ))}
      {details && (
        <div className="notice-details">
          <Modal
            title={
              details === "storage"
                ? "Local storage, no tracking"
                : labels[details]
            }
            onClose={() => setDetails(null)}
          >
            {details === "storage" ? (
              <>
                <p>
                  lilimio uses essential browser storage for preferences, saved
                  plans and places, and offline guides. It sets no cookies and
                  has no advertising or analytics trackers.
                </p>
                <p>
                  Weather, place search, optional maps and photos connect to
                  external services when you use them. These services receive
                  your requests.
                </p>
                <ActionLink to="/legal/privacy">Privacy & controls</ActionLink>
                <Button
                  onClick={() => {
                    pwa.acknowledgeStorage();
                    setDetails(null);
                  }}
                >
                  Got it
                </Button>
              </>
            ) : details === "install" ? (
              <>
                <p>
                  Add lilimio to your home screen for quick access. Installation
                  is optional.
                </p>
                <ActionLink variant="primary" to="/settings/install">
                  View install options
                </ActionLink>
                <Button
                  variant="text"
                  onClick={() => {
                    pwa.hideReminder();
                    setDetails(null);
                  }}
                >
                  Not now
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    pwa.hideReminder(true);
                    setDetails(null);
                  }}
                >
                  Don’t show again
                </Button>
              </>
            ) : (
              <>
                <p>
                  {details === "update"
                    ? "A new version is ready. Update when you are ready to reload the app."
                    : "The app and safety guides are saved for offline use. Live forecasts, maps and photos still need internet."}
                </p>
                {details === "update" && (
                  <Button onClick={pwa.update}>Update now</Button>
                )}
                <Button
                  variant="text"
                  onClick={() => {
                    pwa.dismissUpdate();
                    setDetails(null);
                  }}
                >
                  Dismiss
                </Button>
              </>
            )}
          </Modal>
        </div>
      )}
    </>
  );
}
