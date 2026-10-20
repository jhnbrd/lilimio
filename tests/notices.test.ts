import test from "node:test";
import assert from "node:assert/strict";
import {
  acknowledgement,
  validAcknowledgement,
  standaloneMode,
  installReminderEligible,
  nextNotice,
  NOTICE_VERSION,
} from "../src/lib/notices";

test("only current, dated acknowledgements suppress the storage notice", () => {
  assert.equal(validAcknowledgement(acknowledgement()), true);
  for (const value of [
    null,
    true,
    {},
    { version: "old", at: new Date().toISOString() },
    { version: NOTICE_VERSION, at: "invalid" },
    { version: NOTICE_VERSION, at: 12 },
  ])
    assert.equal(validAcknowledgement(value), false);
});
test("home-screen launch is detected for standard PWA and iOS standalone", () => {
  assert.equal(standaloneMode(true), true);
  assert.equal(standaloneMode(false, true), true);
  assert.equal(standaloneMode(false, false), false);
  assert.equal(standaloneMode(false), false);
});
test("install reminder respects installation, session close, permanent opt-out and focused routes", () => {
  const browser = {
    installed: false,
    hidden: false,
    sessionClosed: false,
    pathname: "/explore",
  };
  assert.equal(installReminderEligible(browser), true);
  assert.equal(installReminderEligible({ ...browser, installed: true }), false);
  assert.equal(installReminderEligible({ ...browser, hidden: true }), false);
  assert.equal(
    installReminderEligible({ ...browser, sessionClosed: true }),
    false,
  );
  for (const pathname of ["/welcome", "/legal/privacy", "/settings/install"])
    assert.equal(installReminderEligible({ ...browser, pathname }), false);
  // A new session can show it again, unless the independent persistent opt-out remains.
  assert.equal(
    installReminderEligible({ ...browser, hidden: true, sessionClosed: false }),
    false,
  );
});
test("only one notice is selected, with dialogs and active feedback taking priority", () => {
  const all = {
    modal: false,
    toast: true,
    update: true,
    storage: true,
    offline: true,
    install: true,
  };
  assert.equal(nextNotice({ ...all, modal: true }), null);
  assert.equal(nextNotice(all), "toast");
  assert.equal(nextNotice({ ...all, toast: false }), "update");
  assert.equal(nextNotice({ ...all, toast: false, update: false }), "storage");
  assert.equal(
    nextNotice({ ...all, toast: false, update: false, storage: false }),
    "offline",
  );
  assert.equal(
    nextNotice({
      ...all,
      toast: false,
      update: false,
      storage: false,
      offline: false,
    }),
    "install",
  );
  assert.equal(
    nextNotice({
      modal: false,
      toast: false,
      update: false,
      storage: false,
      offline: false,
      install: false,
    }),
    null,
  );
});
