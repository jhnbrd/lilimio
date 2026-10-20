import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useApp } from "./state";
import { readStored, writeStored } from "./lib/storage";
import {
  acknowledgement,
  validAcknowledgement,
  STORAGE_NOTICE_KEY,
  INSTALL_HIDDEN_KEY,
  INSTALL_SESSION_KEY,
  standaloneMode,
} from "./lib/notices";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const Context = createContext<{
  install: () => Promise<void>;
  installed: boolean;
  canInstall: boolean;
  reminderHidden: boolean;
  sessionClosed: boolean;
  hideReminder: (permanent?: boolean) => void;
  resetReminder: () => void;
  storagePending: boolean;
  acknowledgeStorage: () => void;
  reopenStorage: () => void;
  refresh: boolean;
  ready: boolean;
  dismissUpdate: () => void;
  update: () => void;
} | null>(null);
export const usePwa = () => {
  const value = useContext(Context);
  if (!value) throw new Error("PWA provider is missing");
  return value;
};
function runningStandalone() {
  return standaloneMode(
    window.matchMedia("(display-mode: standalone)").matches,
    (navigator as Navigator & { standalone?: boolean }).standalone,
  );
}
function sessionIsClosed() {
  try {
    return sessionStorage.getItem(INSTALL_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}
export function PwaProvider({ children }: { children: ReactNode }) {
  const { notify } = useApp();
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const installedHere = useRef(false);
  const [installed, setInstalled] = useState(runningStandalone);
  const [reminderHidden, setReminderHidden] = useState(() =>
    readStored(INSTALL_HIDDEN_KEY, false, (v) => typeof v === "boolean"),
  );
  const [sessionClosed, setSessionClosed] = useState(sessionIsClosed);
  const [storagePending, setStoragePending] = useState(
    () => !readStored(STORAGE_NOTICE_KEY, null, validAcknowledgement),
  );
  const {
    needRefresh: [refresh, setRefresh],
    offlineReady: [ready, setReady],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const before = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const after = () => {
      installedHere.current = true;
      setInstalled(true);
      setEvent(null);
      notify("lilimio. is ready on your home screen.");
    };
    const mode = window.matchMedia("(display-mode: standalone)");
    const check = () =>
      setInstalled(installedHere.current || runningStandalone());
    const sync = (e: StorageEvent) => {
      if (e.key === INSTALL_HIDDEN_KEY || e.key === null)
        setReminderHidden(
          readStored(INSTALL_HIDDEN_KEY, false, (v) => typeof v === "boolean"),
        );
      if (e.key === STORAGE_NOTICE_KEY || e.key === null)
        setStoragePending(
          !readStored(STORAGE_NOTICE_KEY, null, validAcknowledgement),
        );
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", after);
    window.addEventListener("focus", check);
    window.addEventListener("storage", sync);
    mode.addEventListener("change", check);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", after);
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", sync);
      mode.removeEventListener("change", check);
    };
  }, [notify]);
  function hideReminder(permanent = false) {
    setSessionClosed(true);
    try {
      sessionStorage.setItem(INSTALL_SESSION_KEY, "true");
    } catch {
      /* Still closed for this page visit. */
    }
    if (permanent) {
      setReminderHidden(true);
      if (!writeStored(INSTALL_HIDDEN_KEY, true))
        notify(
          "Reminder hidden for this visit. Your browser could not save the preference.",
        );
    }
  }
  function resetReminder() {
    setReminderHidden(false);
    setSessionClosed(false);
    try {
      sessionStorage.removeItem(INSTALL_SESSION_KEY);
    } catch {
      /* In-memory state still resets. */
    }
    notify(
      writeStored(INSTALL_HIDDEN_KEY, false)
        ? "Home-screen reminders enabled for browser visits."
        : "Reminder enabled for this visit. Browser storage is unavailable.",
    );
  }
  function acknowledgeStorage() {
    setStoragePending(false);
    if (!writeStored(STORAGE_NOTICE_KEY, acknowledgement()))
      notify(
        "Notice closed for this visit. Your browser could not save the choice.",
      );
  }
  async function install() {
    if (installed) {
      notify("lilimio. is already running as an installed app.");
      return;
    }
    if (!event) {
      notify(
        "Use your browser menu: Install app or Add to Home Screen. On iPhone, use Safari → Share → Add to Home Screen.",
      );
      return;
    }
    const currentEvent = event;
    setEvent(null);
    try {
      await currentEvent.prompt();
      const choice = await currentEvent.userChoice;
      if (choice.outcome === "accepted") {
        hideReminder();
        notify(
          "Installation accepted. Your browser will finish adding the app.",
        );
      } else hideReminder();
    } catch {
      notify("Use your browser menu to add lilimio. to your Home Screen.");
    }
  }
  return (
    <Context.Provider
      value={{
        install,
        installed,
        canInstall: !!event,
        reminderHidden,
        sessionClosed,
        hideReminder,
        resetReminder,
        storagePending,
        acknowledgeStorage,
        reopenStorage: () => setStoragePending(true),
        refresh,
        ready,
        dismissUpdate: () => {
          setRefresh(false);
          setReady(false);
        },
        update: () => void updateServiceWorker(true),
      }}
    >
      {children}
    </Context.Provider>
  );
}
