# Font provenance

## Exact font configured for the app

**Plus Jakarta Sans**, with locally bundled Regular 400, Medium 500, SemiBold 600 and Bold 700.

Evidence inspected on 19 October 2026:

- `app/layout.tsx`: Next.js localFont loads `jakarta-regular.woff2`, `jakarta-medium.woff2`, `jakarta-semibold.woff2`, `jakarta-bold.woff2` at those weights.
- `app/globals.css`: declares Plus Jakarta Sans as its sans family.
- `docs/TYPOGRAPHY.md`: records the correction to a single Plus Jakarta Sans family and separates the custom wordmark from body type.
- `app/fonts/LICENSE`: credits The Plus Jakarta Sans Project Authors and the SIL Open Font License 1.1. A copy is included here.

This confirms the app's configured font. It is not a fresh computed-style audit of every live screen.

## Mockup and marketing lettering

The generation prompts requested a Plus Jakarta Sans-like interface/supporting type style. Image generation creates pixels, not a verifiable installed font run, so the exact font used to draw every generated glyph cannot be proven.

The rounded **lilimio.** logo lettering is custom artwork reconstructed from the approved images. There is no supplied font file for its exact glyphs and no reliable exact font name. It must not be falsely labeled as Plus Jakarta Sans, Poppins, or another named typeface. The existing project wordmark component also uses reference-image artwork rather than ordinary text glyphs.

Use `masters/wordmark-master.png` or an exported transparent wordmark PNG when exact visual identity is the aim. Use actual bundled Plus Jakarta Sans for reproducible application labels and supporting brand copy. A true outlined vector identity would require a separate deliberate vector reconstruction; none is claimed by this PNG pack.
