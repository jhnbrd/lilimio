export const NOTICE_VERSION = "2026-10-20";
export const STORAGE_NOTICE_KEY = "lilimio-storage-notice";
export const INSTALL_HIDDEN_KEY = "lilimio-install-hidden";
export const INSTALL_SESSION_KEY = "lilimio-install-session-closed";
export const TERMS_KEY = "lilimio-terms-acknowledgement";

export function validAcknowledgement(
  value: unknown,
): value is { version: string; at: string } {
  if (!value || typeof value !== "object") return false;
  const v = value as { version?: unknown; at?: unknown };
  return (
    v.version === NOTICE_VERSION &&
    typeof v.at === "string" &&
    Number.isFinite(Date.parse(v.at))
  );
}
export function acknowledgement() {
  return { version: NOTICE_VERSION, at: new Date().toISOString() };
}
export function standaloneMode(displayMode: boolean, iosStandalone?: boolean) {
  return displayMode || iosStandalone === true;
}
export type NoticeKind =
  | "toast"
  | "update"
  | "storage"
  | "offline"
  | "install"
  | null;
export function nextNotice(options: {
  modal: boolean;
  toast: boolean;
  update: boolean;
  storage: boolean;
  offline: boolean;
  install: boolean;
}): NoticeKind {
  if (options.modal) return null;
  if (options.toast) return "toast";
  if (options.update) return "update";
  if (options.storage) return "storage";
  if (options.offline) return "offline";
  return options.install ? "install" : null;
}
export function installReminderEligible(options: {
  installed: boolean;
  hidden: boolean;
  sessionClosed: boolean;
  pathname: string;
}) {
  return (
    !options.installed &&
    !options.hidden &&
    !options.sessionClosed &&
    options.pathname !== "/welcome" &&
    !options.pathname.startsWith("/legal") &&
    options.pathname !== "/settings/install"
  );
}
