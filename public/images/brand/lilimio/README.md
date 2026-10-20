# lilimio. — Brand image assets

The sun-and-two-leaves icon is the identity selected from the Preferences & Install mockup. The wordmark follows the rounded lilimio. lettering in the approved V3 boards. The large PNG masters are faithful AI reconstructions from small raster references, not mathematically exact extraction of hidden detail or recovered vector originals. No raster is packaged as a fake SVG.

## Folders

- `masters/`: native high-resolution, transparent PNG icon and wordmark artwork. Preserve these files.
- `png/`: transparent app icon at 64, 128, 256, 512, and 1024px; wordmark at 320, 640, 1280, and 1600px wide, preserving aspect ratio.
- `favicon/`: 16, 32, 48, 64, and 96px PNGs plus a multi-resolution ICO containing 16/32/48px.
- `apple/`: opaque PNG home-screen icons at 120, 152, 167, and 180px, plus default `apple-touch-icon.png` at 180px.
- `pwa/`: 192/512px opaque standard icons and separate 192/512px maskable variants with more inset artwork.
- `marketing/`: credited project banner, portrait Facebook app-introduction post, and square minimalist coming-soon post.
- `docs/`: font provenance, export manifest, platform references, integration example, and font license.
- `source-prompts/`: exact generation prompts for the masters and marketing artwork.

## Typography

The application uses **Plus Jakarta Sans**, locally loaded in weights 400, 500, 600 and 700. The rounded lilimio. wordmark is custom visual lettering; no exact original font can be identified from its generated pixels. See [font provenance](docs/FONT_PROVENANCE.md). Use the supplied wordmark PNG to preserve this appearance instead of replacing it with ordinary text.

## Asset use

The current app icon, active manifest, route code, and metadata were not overwritten. These assets are prepared for the later UI/UX build. `docs/manifest-icons.example.json` shows the new standard/maskable icon URLs; merge deliberately when updating the application.

For an Apple home-screen icon, a future integration can use:

```html
<link rel="apple-touch-icon" sizes="180x180" href="/images/brand/lilimio/apple/apple-touch-icon-180.png">
<link rel="icon" type="image/png" sizes="32x32" href="/images/brand/lilimio/favicon/favicon-32.png">
<link rel="icon" href="/images/brand/lilimio/favicon/favicon.ico">
```

Do not use the regular rounded tile as a maskable asset: use the separately inset maskable version. Apple/PWA exports have opaque backgrounds; transparent artwork belongs to general logo use. Check actual masks and browser/device behavior when integrating.

## Native resolution and derivations

The icon master is 1254 x 1254px. The wordmark master is 2146 x 733px before trimming transparent margins for delivery sizes. Smaller exports were generated with deterministic high-quality resampling and appropriate background handling. Upsizing does not recover detail from the original mockup; the master is a reconstruction. See `docs/export-manifest.json` for all dimensions and purposes.

## Platform references consulted

- [Apple Safari Web Content Guide: webpage/home-screen icons](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) documents PNG web clips and 152/167/180px examples. This is archived platform guidance, not a claim that every current Apple device uses a unique size listed here.
- [MDN: web app manifest icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) documents icon members and purpose handling.

The icon files were inspected at large and small sizes and checked for valid image formats and expected dimensions. Runtime browser registration and installation were not changed or tested in this asset-preparation task.


## Project credits

A project by **DevJunction**.  
Main developer: **Jhianne Jose C. Berida**.

These credits accompany the project banner and final Facebook creatives. The app-icon master remains a clean symbol without tiny attribution text so it works at favicon sizes.

## Marketing files

- `marketing/project-banner.png`: 2145 × 733px.
- `marketing/facebook-app-introduction.png`: 1122 × 1402px.
- `marketing/facebook-coming-soon.png`: 1254 × 1254px.
