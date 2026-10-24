# lilimio design system

The approved visual direction is in [the mockup brief](../new-mockups/DESIGN_BRIEF.md). The application uses warm ivory, forest green, Plus Jakarta Sans, quiet illustration, and amber only for heat and caution. Mockup temperatures and sample locations are never runtime data.

## Layout and disclosure

`styles.css` holds structural primitives, `app-frame.css` owns the viewport frame, `design-system.css` holds tokens and component treatments, and `viewport-layout.css` distributes available height across primary content areas. Default pages use one viewport, with fixed navigation. Lists use Previous/Next; short windows display fewer complete rows. Reading is split into passages while retaining source links. Enlarged text and keyboards retain an accessible scrolling escape instead of losing controls.

- Today: model heat index, air temperature, risk, retrieval status, planning/forecast actions, and a compact station entry.
- Forecast: hourly/daily views, three-hour windows, and hour details.
- Plan: three selections, one comparison at a time, with ranking explanations in a paged dialog.
- Find relief: location, explicit search, filter dialog, map/list view, paged results and place details.
- Guides: paged library and section reader; complete text downloads remain available.
- Saved: Plans / Places / Reading; saved-plan details and rechecking open separately.
- Settings: Preferences / App / Data, with separate installation, privacy and source pages.
- Notices: one compact header entry opens optional notices. Transient feedback uses one measured slot that reserves space instead of covering actions. Installation and storage details remain available in Settings.

Body text uses 16/24, supporting text 14/20, and small provenance labels 12/18. Controls target 48px, with 44px for compact secondary controls. Essential states use words and icons as well as color. Native dialogs retain focus trapping, Escape, close controls and focus restoration.

## Motion

See [animation ownership](ANIMATION_SYSTEM.md). Routes and pagination fade briefly; dialogs enter and leave with a small movement; controls have hover and press feedback. Both device reduced motion and Settings → Motion suppress motion. Data requests and saves are not delayed by decoration; dialog dismissal completes its short exit before restoring focus.

## Place photos

The optional **Find a place photo** action calls the existing private sidecar. It retrieves only the exact OSM record’s Commons file or Wikidata P18 image, then requests Commons thumbnail and reuse metadata. It never substitutes an image based on a nearby coordinate or similar name. Every displayed photo includes author, source and license links. No linked photo and provider failure are distinct states.

`GET /api/places/photo?record=https%3A%2F%2Fwww.openstreetmap.org%2Fway%2F123` accepts only OSM node/way/relation identities. Upstream hosts are fixed. Responses are validated, lookups coalesce, at most two are in flight, and the in-memory cache holds at most 250 records. Successful photos cache for 24 hours, absent links for one hour, and failures for 30 seconds. API and provider availability do not guarantee photo coverage. No API key or paid account is required.

The read-only OSM lookup uses Overpass, not the OSM editing API. Overpass, Wikidata and Commons are external community services and can throttle or time out. There is no provider hopping or stock-photo fallback. For larger traffic, use a managed provider or your own data/cache service.

## Review

Check 320×568, 360×640, 390×844, 768×1024, 1024×768 and 1440×900. Include no city, unavailable/stale/offline data, notice visibility, long location names, Fahrenheit, guide/source passage navigation, keyboard focus and reduced motion. The viewport contract concerns ordinary text settings; enlarged text must remain accessible even when it requires overflow. Browser emulation does not establish physical-device frame rates.

## Using available height

Page shells fill the available viewport and keep navigation and footers at the bottom. Controls, rows and cards keep natural, consistent heights. Group related options with ordinary gaps; leave unused space after the last option, before the footer. Never distribute spare height between individual selectable items. Pagination and form submission actions can anchor to the bottom of their enclosing panel.

Review both content and scroll bounds: check natural row heights, consistent gaps, bottom-anchored footers and accessible overflow for enlarged text. Weather artwork stays behind the reading with the sun to its upper right.

Lists paginate from measured row heights and the space left after headers, actions and footers. Resizing recalculates capacity; show every option when they fit. Reading passages and deliberately single-item modal/map views may retain explicit page sizes. Today may enlarge the primary weather reading and illustration on tall screens; selectable controls retain normal spacing.

Location selection supports worldwide street, barangay, district and city search through Photon, optional one-time GPS and a lazy-loaded draggable/clickable map pin. Coordinates drive forecasts and station proximity; they do not imply a measurement at that point. Display the area-estimate disclaimer in location selection and forecast provenance. Relief search can explicitly reuse the forecast location; existing saved directory areas remain independent. Map and geocoding failures retain search, city and device-location alternatives.
