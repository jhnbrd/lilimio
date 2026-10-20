# Public notices and installation reminders

Implemented 20 October 2026. The app remains free to access without accounts. Original code rights are reserved at the owner's explicit request; free public access does not apply an open-source license to the project. LICENSE.md defines that scope without overriding third-party rights.

## Documents and acknowledgement

TERMS.md, PRIVACY.md, LICENSE.md and THIRD_PARTY_NOTICES.md are the single sources for `/legal/terms`, `/legal/privacy`, `/legal/license` and `/legal/sources`. They are bundled into the offline application, not loaded from a remote document server. Links appear in onboarding and Settings. The complete bundled Plus Jakarta Sans OFL is shown on the sources page.

Onboarding's final review requires an unchecked-by-default terms/privacy checkbox before completion. “Explore first” skips city selection and opens that review. Guides remain publicly accessible via the separate guide link and deep links. Existing users are not silently recorded as having agreed. The local `lilimio-terms-acknowledgement` stores a version and date only after the completion action. This is a local convenience record, not an authenticated contract/audit system. Terms acceptance does not grant device permissions, tracking consent, or notification access.

The storage notice explains **existing essential local/session storage and offline caches**. There are no first-party cookies or analytics/advertising integrations to enable or reject in this version. “Accept essential storage” acknowledges the notice; it does not gate existing functional storage behind a claim of optional-cookie consent. The dated acknowledgement is versioned, can be reopened in Settings, and returns if missing or obsolete. Blocked storage falls back to visit-only state with feedback. Do not add optional trackers without implementing real opt-in controls and updating the notice first.

## Install reminder

One shared notice slot prioritizes open dialogs, toasts, software updates, the storage notice, offline-ready feedback, and then installation. This prevents competing overlays. Scroll padding reserves space behind the card; narrow/short views can scroll its content. Motion uses the existing reduced-motion-aware NoticeMotion component.

The reminder persists across route navigation and later browser visits. Close snoozes it for the current tab session using sessionStorage (survives reload). “Don't show again” uses a separate localStorage flag. Settings → Install can reset either preference; the Install action remains accessible even when reminders are off. The reminder is hidden in onboarding, legal reading and the install page. Standard standalone display mode, iOS navigator.standalone, display-mode changes, page focus and appinstalled suppress it in an installed app. Browser limitations prevent a universal test for every installed copy from an ordinary browser tab; no permanent guessed installation flag is stored.

The browser's deferred installation event is consumed once and only on a click. Browsers without that event open the existing manual-install instructions. The prompt uses the existing generated icon. It does not request notification or location permission. Closing the native install dialog also snoozes the reminder for the session.

Clear local data now includes lilimio session preferences. It explicitly leaves offline service-worker caches and downloaded files alone; browser site-data controls remove those. No records are fabricated when an external data service fails.

## Publication review

Verification: 34 tests, typecheck and production build passed. Browser checks covered storage acknowledgement/reload; session Close/reload; persistent opt-out in a fresh tab; reset; source links; terms-dialog state preservation; unchecked, disabled agreement completion and its final styling; and checked 390px/1280px layouts. No browser errors/warnings were recorded. No agreement was accepted and no native installation was performed during QA. Standard/iOS installed-mode detection and notice selection are unit-tested; physical-device behavior remains to be verified.

These are project notices describing the implemented version, not a legal-compliance certification or a replacement for jurisdiction-specific review. Before a public production release, the owner must confirm the operator identity, publish a working privacy/support contact and procedure, review the actual host's logging/privacy behavior, verify provider-tier eligibility and capacity, and review notices against the final deployment. No support email, registered entity, governing-law clause, unlimited free API promise, or liability waiver was invented. Future advertising, subscriptions, analytics, accounts, server-side submissions or synchronization require a fresh review.
