# lilimio. — viewport-first overhaul

Status: implementation reference. Created 24 October 2026; application implementation and verification notes are in [docs/DESIGN_SYSTEM.md](../docs/DESIGN_SYSTEM.md).

## Direction

Keep the lilimio. identity: warm ivory, forest green, Plus Jakarta Sans, restrained sun-amber accents, thin consistent icons, and small landscape illustrations. Replace stacked information cards with a calm hierarchy: one primary task, one main action, and a short path to details.

Reference: `/home/jhnbrd/Downloads/UI-UX.md` v1.2.0. The document is design reference material; quoted video tactics and statistics are not product requirements or evidence of expected results. Applied guidance: P07 complete states; P09 hierarchy; P10 relational spacing; P11/P29 role-based typography; P21/P22 mobile priorities; P24 focused sheets; P28 reduced motion; P33 explicit implementation contracts.

## Viewport contract

Primary screens occupy one viewport at default text settings. Header, content, primary action, and bottom navigation fit together. Nothing continues below a fold; do not hide unfinished content with overflow clipping. Long lists are paged; long reading is split into sections; large forms become short steps. Detail dialogs use bounded sections and Previous/Next where necessary.

Target review sizes: 320×568, 360×640, 390×844, 768×1024, 1024×768, 1440×900. Large phone previews alone do not prove fit at the smaller sizes. A raster mockup cannot verify responsiveness, keyboard interaction, or accessibility.

For narrow/short layouts, remove decorative art first, reduce visible rows next, and move secondary information to a named detail view. Keep body text and hit areas readable. At 200% text or with the keyboard open, repaginate/reflow into smaller steps or a full-screen dialog; do not disable zoom, clip text, or silently remove actions. Where platform constraints demand it, an accessible overflow escape is preferable to losing content. Default screens remain designed without scrolling.

## Tokens (design proposals, not measured compliance)

- Canvas #F7F6EF; surface #FFFDF7; forest #244D39; ink #18372C; muted #59695F; divider #DDE3D8.
- Caution surface #FFF0CF, caution ink #785000. Error surface #FCE8E1, error ink #953D28. Add text/icon semantics; do not communicate risk by color alone.
- Plus Jakarta Sans. Body 16/24, secondary 14/20, section titles 20/28, page title 28/34. Heat reading 64–80 with a clear unit; not a general heading size.
- Related spacing 4/8; control/group spacing 12/16; sections 24/32. Mobile gutters 20–24, with 16 available on 320px. Desktop content gutters 32–48.
- Buttons 48px target height; primary forest fill, secondary outline, tertiary labeled text. Consistent 20–24px line icons. 16–20px surface corners and minimal elevation.
- Mobile global navigation: Today / Plan / More. More opens a bounded destination grid. Desktop sidebar exposes Today, Forecast, Plan, Find relief, Guides, Updates, Settings.

## Content rules

All image weather values, locations, dates, result counts, and saved items are illustrative. Each board must say “Concept · sample data” outside the app frames. Never implement image numbers as production truth.

Keep model and station provenance explicit. Today shows model heat index, air temperature, risk text, location, retrieval age, and a compact PAGASA station entry. The full station report lives behind that entry. A station reading is not an official advisory and does not replace the planner forecast.

Critical risk, stale, and offline indicators remain on the main screen; longer explanations move behind a labeled action. Existing unavailable integrations stay unavailable. No fake push delivery, account requirement, facility verification, confidence score, or “safe time” label.

## Main screen budgets

| Screen | Visible content | Secondary route/dialog | Short viewport adaptation |
| --- | --- | --- | --- |
| Today | Location; heat index; air temperature; brief risk; source age; Plan action; station summary | Forecast; weather/source details; station report | Remove scenic art, show station as one row |
| Forecast | Hourly/Daily control; 4 hourly values or 3 day rows; brief source status | Hour details; previous/next forecast window | 3 hourly values, no chart labels beyond essentials |
| Plan | Activity, duration, preferred period; Compare action | Selection dialogs | Compact labeled rows; keyboard not required |
| Comparison | Selected window, heat/UV/rain summary; one alternative; Save | Why these times; edit inputs | Show one option at a time with option tabs |
| Saved | Plans/Places/Reading tabs; up to 3 items; pager | Item detail, recheck, removal confirmation | 2 items or 1 large item; never truncate essential identity |
| Directory | Location/filter; Map/List control; bounded map or 2 results; pager | City search; place detail; category picker | Map plus one preview; list shows 1–2 items |
| Place | Name, distance, access/hours unknown, Directions and Save | Facilities; source; correction draft | One facts section per page |
| Guides | Search, topic filter, 3 guide rows, pager | Reading | 2 rows with pager |
| Reader | Title; one short section; section pager; Back | Sources/download action | Fewer paragraphs per section |
| Updates | Forecast-derived summary and Official sources tabs | Update detail, external agency links | One update per page; no automatic-alert implication |
| More | Six destination tiles; saved and settings entry | Named destination | Compact 2-column grid |
| Settings | Location, units, motion, privacy, install; version footer | Individual setting; sources; data management | 4 setting rows per category page |
| Install | Short benefit, install action, platform steps link, neutral Later | Platform steps | Single illustration-free step |
| Onboarding | One message and choice per step; explicit Skip/Back | Location search and optional device permission | Short art-free step |
| Legal/privacy | Document title, one section, pagination | Document index/source links | Shorter section pages; preserve full text |

## Dialog and state contracts

- Station report: Reading / Comparison / Sources tabs; each has explicit time and units. Stale warning stays beside a reading. Close button and Escape return focus to the trigger.
- City search: labeled field above keyboard; at most 3 matches and a pager; manual selection and optional device permission remain separate.
- Picker: at most 4 options with selected state; cancel preserves inputs.
- Notice: one slot for storage, install, update, offline, or toast; no card stacking. A compact notice replaces reserved optional content space, never covers main actions or navigation.
- Offline/error: concise inline status with Retry or Change location. Keep source age attached to cached values. No fake values for missing live data.
- Forms and keyboard: dialogs can become full-screen steps with pinned action; visible Back/Cancel and maintained input values.

## Acceptance before implementation

Review the generated boards for direction first. Then validate a real layout at every target viewport, worst-case labels, units, long place names, stale/error states, large text, focus order, and keyboard-open states. Image text/type fidelity is illustrative, not a substitute for production layout or contrast measurement. No full accessibility or responsiveness claim is made by these mockups.
