# lilimio. React PWA
This is a fresh Vite + React + TypeScript PWA, not Next.js.
Read README.md and docs/NEW_BEGINNING.md before implementation.
Use mockups/mobile and mockups/desktop as visual references. Preserve public assets.
Use spacious layouts, Plus Jakarta Sans, forest/ivory palette and accessible controls.
The .old directory is a recoverable local archive; never import runtime code from it.
No secrets in VITE_ variables: these are public browser values.
Run npm run typecheck and npm run build after changes.

Animation: follow docs/ANIMATION_SYSTEM.md. Use Motion for React UI transitions, Anime.js for scoped stagger sequences, GSAP for scene choreography, and CSS for simple interactions. Honor reduced motion, clean up effects, and never let engines compete for the same element/property.

The full app is now implemented under src/. Read docs/IMPLEMENTATION.md for current scope and verification; NEW_BEGINNING.md is historical. Run npm test, npm run typecheck, and npm run build. Preserve source/uncertainty labels and never substitute mock data for failed live requests.
