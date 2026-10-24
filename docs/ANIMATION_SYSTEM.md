# Animation system

- **Motion for React** (`motion/react`): route entrance transitions. Shared `MotionConfig` and `useReducedMotion` honor device preferences. Route changes remain immediate and keyboard focus is preserved.
- **Anime.js**: scoped stagger of welcome-copy children. `createScope().revert()` restores styles on unmount and preference changes.
- **GSAP**: a short coordinated landscape reveal timeline, isolated from the text and Motion wrappers. `gsap.context().revert()` cleans up on unmount. Use this layer for future genuinely complex scene choreography; no decorative looping or scroll hijacking.
- **CSS**: 160ms hover/press feedback, 180ms paginated-content fade and dialog entrance, 140ms dialog dismissal, and compact notice fade. Focus indication stays immediate. Reduced-motion device and app preferences suppress CSS motion.

Anime.js and GSAP are dynamically imported only for the welcome scene when motion is allowed. Content is visible by default if those chunks cannot load. All animations are finite, limited to opacity/transforms, and cleaned up during React StrictMode remounts. Do not assign two engines to the same element/property. Follow this ownership model when adding onboarding, modal, forecast or planning transitions.

Durations: 150ms interaction feedback, 160ms notice, 200ms route entrance, 380ms staggered copy with 45ms offsets, 650ms landscape. Dialog close restores focus after its short exit; data and save actions run immediately. Never delay an action waiting for decoration. No persistent layout-hiding CSS.

References: [Anime.js React](https://animejs.com/documentation/getting-started/using-with-react), [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context()/), [Motion accessibility](https://motion.dev/docs/react-use-reduced-motion).

Validation: npm run build passed TypeScript and Vite compilation; Workbox generated 20 precache entries. Browser verified welcome rendering and client navigation. Physical-device performance and reduced-motion device testing remain to be checked.
