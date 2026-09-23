# Hexagonal World

## Local merged-lighting experiment (September 16)

The user authorized generating and comparing replacement images, not deleting the
old library or publishing a replacement. `maps/merged-experiment/` contains sparse
PNG pyramids with default lighting and default background already included. It
is separate from `maps/default-layers/`; the normal app still uses the old assets.
Open a local map with `?merged-preview=1` to switch the new images on/off at the
same view. Vector overlays, including Ivory's graticule, stay separate. Changing
the background or independent lighting opacities leaves the experimental path.
This comparison intentionally retains the old renderer underneath, so it is a
visual/storage test, not a benchmark of the eventual optimized rendering path.

`scripts/build-merged-maps.mjs` uses the existing projection geometry and base
PNGs; `scripts/merge-map-images.py` incorporates the existing affine gain/highlight
layers at the base map's pixel density. Source files are never changed. Existing
unlit bases remain available; Political and Distortion Analysis need no new lit
images. Lifezones outside Spaceship Earth currently has only overview lighting,
so those experimental images retain that source detail. No new detail is invented.
Infinite maps retain the geometric repeat period, which differs slightly from
the rounded lighting raster extent. Chunked generation avoids giant full-map
canvases, and empty background tiles are omitted.

Run `scripts/measure-merged-maps.py` after generation for actual bytes and a
per-format breakdown. Potential savings subtract the new files from the old
lighting library while retaining unlit bases. Removal still requires adopting
the replacement and resolving how custom opacity changes use live lighting.
Do not deploy this experimental asset directory alongside the current library.

A dependency-free WebGL app using the supplied 4320 × 2160 equirectangular continent texture.

Run `npm start`, then open http://localhost:4173. Run `npm test` for geometry and regression validation.

Before making changes, read [AGENTS.md](AGENTS.md) and
[DESIGN-DECISIONS.md](DESIGN-DECISIONS.md) for accepted design reasoning,
superseded experiments, and working agreements. [AUDIT.md](AUDIT.md) records
diagnosed failures; this README contains implementation details, including some
historical descriptions that the decision record clarifies.

## License

Original work by Alex Van de Sande is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), except where underlying source terms require otherwise. Adapted Wikipedia Default and Tissot imagery retains CC BY-SA 3.0 and CC BY-SA 4.0 respectively. Third-party assets retain their own terms; see [LICENSE](LICENSE) and the source metadata.
Copyright © 2026 Alex Van de Sande. Third-party map data, imagery, and font
assets retain their respective terms; map sources are recorded in
[`dist/maps/sources.json`](dist/maps/sources.json).

## Publishing

GitHub Pages publishes the app automatically after a push to `main`, once the
regression tests pass. The workflow in `.github/workflows/pages.yml` uploads
`dist/`, excluding the local browser test pages. No build or external runtime
service is required. In the repository's **Settings → Pages**, the publishing
source must be **GitHub Actions**. Custom domains are configured there as well.

The `.openai/hosting.json` file is legacy local hosting metadata; GitHub Pages
does not use it or include it in the published website.

See [AUDIT.md](AUDIT.md) for the September 2026 diagnosis, repairs, performance measurements, and remaining debt. Browser interaction checks are available at `/tests/app-controls.html`; relief GPU checks are at `/tests/relief-render.html`.

## Implemented

The Spaceship Earth and Felv arrangements, in every pre-rendered style except
political borders and the distortion analysis, include seven story dots from
`dist/tour-markers.mjs`: Origin of mankind, Silk Road, Viking expansion (at the
`/iceland-to-vinland/` URL), French Polynesia, Americas exchange, African networks
and Ocean crossings. Each record has a stable `id`, `title`, `latitude`,
`longitude` and an `overlay` ID. On re-cut arrangements such as Felv, where one
hexagon appears as several placed pieces, a point projects onto the piece whose
polygon contains it. The DOM layer emits a bubbling `tourselect` event; off the
timeline a dot switches history on at that story's first period, on the timeline
it focuses that story.

History data lives in **`dist/history/`**, one period at a time, and is the only
source of story content:

- `index.mjs` lists the nine periods in order (`id`, old `stop` name, scrubber
  `tick`, `label`, `date`, `year`, and the `stories` present: its spots, in
  order of importance). A spot is usually one of the seven entry stories, but a
  period may add highlight spots of its own (`homo-erectus`, `neanderthals`,
  `denisovans`, `island-hominins`, `first-towns`); their dots exist only on the
  timeline, and a spot without routes needs a `view` box.
- `<period>.md` holds the texts: an H1 `Label · date`, an intro paragraph, then one
  `## story-id` section per spot with `### Title`, `spot: lat, lon` (where the
  dot sits at that moment: the Vikings on Norway in 1000 CE, on Greenland in
  1400), `view: fit` (frame the story's routes) or `view: lat,lon → lat,lon`
  (an explicit box), map labels for the focused story as `site: Name · lat, lon`
  (a black circle with a white outline and an all-caps bold name, for cities and
  sites) or `area: Name · lat, lon` (an italic Baskerville name in title caps for
  ranges, seas and regions), used sparingly, then paragraphs, legend lines
  `- wave: **Label** · text`, a `>` caveat and a source link to the evidence
  notes (`dist/*-sources.md`).
- `<period>.routes.json` is the authored route list: `id`, `story`, `wave`,
  `title`, `coordinates` (lat/lon stops), optional `lane`, `uncertain`,
  `geodesic`, `frequency`, `twoWay` (the loader adds the reversed partner on the
  same lane) and `zoom`, the detail level: a route with `zoom: 1.6` is drawn only
  once the camera is at 160% or closer, so regional networks appear as you zoom in.
  Evidence dates and sources ride along as `period`, `sources`, `uncertainty`.
- `<period>.strands.json` is generated (see relaxation below): the relaxed strands
  per route plus a hash of the routes file, so a stale sidecar fails `history-tests.mjs`.
- `waves.json` maps every wave to one label and colour, used by routes and legends
  in every period, injected as CSS variables when history loads.
- `relax.json` holds the relaxation settings and named hard stops per story.

`dist/history-loader.mjs` fetches a period on demand (never at startup), parses the
Markdown with `parsePeriod` from `dist/tour-content.mjs`, assembles the routes
with sparse traffic timing per strand, and caches the result.
`dist/tour-story.mjs` renders the card from the spot text it is given.

History addresses: every age and every pane has its own URL, `/history/<period>/`
and `/history/<period>/<spot>/` (old stop names still resolve), with the map's
style and layout in the hash as `&s=<style>/<layout-slug>` beside the compact
state, so the path stays about history. Story URLs such as `/silk-road/` open
the timeline at that story's first period and then take the pane address. Each
address has a static landing page with its own 1200×630 preview
(`dist/social/history-<period>[-<spot>].jpg`, rendered by
`/tests/history-social.html?save=1` through `scripts/render-history-social.mjs`
with the local save server running) and a sitemap entry.

History timeline: a “History” button sits in the collapsed sidebar between
the style strip and More options (it reads “Close history” while on). Switching it on replaces the pan/reposition
toolbox with one scrubber over the nine periods (Early hominins, Out of Africa,
Ice Age to farming, Bronze Age, Antiquity, Middle Ages, High Middle Ages,
Globalization, Plantations & empires), ticked with approximate dates (2M ya,
50k ya, 10k ya, 3k ya, 200 CE, 1000 CE, 1400 CE, 1600 CE, 1800 CE) while the
panel heading names the age. Every story of the period is drawn at once; the
scrubber is the only slider. Choosing a date activates the period's headline
spot, the first `##` section of its Markdown (so order the sections by
importance), unless the focused story continues there. Clicking a spot frames
that story (its `view`) and shows its text in the card, whose bottom arrows
(and the left/right keys) cycle through the period's spots, with no pause button, chips or inner slider; scrubbing
while focused re-reads the story at the new period or closes the card when the
story has no spot there; closing restores the camera. The period persists as
`?history=<period>` on the map URL (old stop names still resolve). Story URLs
such as `/silk-road/` open the timeline at that story's first period with its
card open. Leaving an eligible map switches history off.

The vertex rule looks where the eye rests: the middle of the free part of the
screen (beside the sidebar on wide screens, between the heading and the sidebar
on phones), carried in map space most of the way (0.8 of a cell) toward the
junction of the three continental plates, one cell west of the net's middle.
A fitted map therefore settles on that junction whatever the screen size, the
bias turns with the map, and the current vertex is kept until another is half
a cell nearer, so a nudge never re-forms the net. The rule waits for the first
fit, so no piece moves before the camera exists and the title stays visible on
the first view. When the eye sits in an empty cell the stickiness is dropped so
that cell is filled first, and the leftover fourth piece takes the free join
nearest the eye rather than lingering off screen. In history on phones the
sidebar shows only the scrubber. Clickable things around the map share one look, the More options style:
no border, a grey a step darker than the panel, the same ink, pressed a step
darker; round marks (‹, ×) use the same grey.

On phones (`compactDevice`): a tall screen starts Spaceship Earth a quarter turn
round (120°) so the net stands upright; the scrubber moves inside the sidebar in
place of the More options button, with a round ‹ mark to the left of “History”
to leave; choosing a period swaps the sidebar for floating cards, one per spot,
each with a round × to close, with no arrows: the next card peeks in from the right and a thumb drag
snaps natively (`scroll-snap-type: x mandatory`, momentum and rubber-banding
come from the browser), and landing on a card focuses that spot. Cards take at
most a third of the height and scroll inside. Back returns to the scrubber, and
again to the map. Two fingers turn the map as well as zoom it, about the pinch
midpoint; the lit sets keep the turn the gesture started from until the fingers
lift, when the turn snaps to the nearest 30° stop. Checks:
`/tests/history-mobile.html`.

Corridor relaxation: `scripts/relax-tour-routes.py <period>|all` builds a 0.2°
passability raster from the height overview (slope and elevation), Holdridge
life zones (deserts, tundra, ice), big HydroRIVERS lines (bonus) and coasts, then
runs a least-cost search between hard stops (route endpoints, the named places
in `relax.json` and coordinates shared by two routes) inside a soft corridor that
scales with each leg. Two strands per route by default, three for migrations,
Vikings and Polynesia, each with its own smooth noise, so parallel courses jiggle
through valleys and along coasts while the stops stay exact. Sea handling per
story: `coastal` prefers shorelines, `open` treats open water as free as coast and
islands as stops (Polynesia, Ocean crossings); the Beringia leg is a `landBridge`.
Dots are small comets: each is drawn as a short streak with round ends (a dash
of up to 6 px, shorter where the gap before it is tight), so its length shows
the way the corridor runs while the fragment stays two strokes, a halo and the
streak, because animated dashes are what the browser pays for. Dots fade in at a route's first
stop and out at its last through a per-route luminance mask. Nothing runs at runtime beyond the usual projection. Regenerate
with a local virtualenv holding numpy and Pillow. Checks: `history-tests.mjs`
(every period parses, spots for every story, routes valid, strands fresh and
covering every route, one colour per wave), `tour-performance-tests.mjs`
(per-period route, sample, path, timing and file-size budgets),
`tour-traffic-tests.mjs`, `tour-endless-tests.mjs` and `/tests/tour-history.html`
(also `?mobile=1`).

Back grid (Overlays → “Back grid”): a faint hexagonal lattice, one main hexagon
per cell, on the empty background of any finite map; on by default for Spaceship
Earth (2 px, white at 25% opacity) through the layout preset's controls, off
elsewhere; the native colour input has no alpha, so an opacity slider sits beside it. Cells
under a piece (including one mid-slide), cells inside a map outline and edges
shared with a piece are left out. Saved in links as `backdrop-grid`,
`backdrop-color`, `backdropWidth` and `backdropOpacity`, appended to the compact map-state key
lists so older links stay valid.

Reposition globe: the pan/reposition switch left the toolbar; “Reposition globe
by dragging” is a toggle under More options → Position (on phones it opens the
full-screen repositioning flow with its Done button).

On screens at least 1240 px wide the floating legend sits level with the title's
top instead of below it.

Rotation dial: to the right of Fit sits a small grey circle with an off-centre
dot. Dragging around it turns the whole map in 30° steps (twelve positions) about the viewport centre (Spaceship Earth keeps its unlit preset and its
dance at any turn)
(the arrow keys step it too); the dot shows the current turn. It drives the
same grid-rotation setting as the slider in the positioning panel, so the turn
is saved in links.

Pan bound: a drag can never leave the map fully off screen. When a drag ends
with less than a sliver visible, the camera springs back with a small overshoot
(instant under reduced motion).

Dancing pieces, experiment two (the user's rule): find the three-piece vertex
nearest the viewport centre and flip the hexagons to it. The anchor is the
placed piece nearest the centre and never moves; its corner nearest the centre
names the vertex, choosing only corners where the two edges name two different
pieces so three plates always meet there (kept while the previous corner is
nearly as close); the two edges name the two pieces that must sit across them, at the
rotations those spherical joins demand (`matching`; a translation plus a turn).
The remaining piece keeps its place when that is still a valid join of the
group, otherwise it takes the free join nearest to where it was. So the fewest
pieces move and every piece always touches the group along a valid edge
(exposed as `data-dance-valid`). Focusing a story gathers its pieces around the
one holding most of it by the same joins and frames the points where the
pieces will settle. Spaceship Earth draws through the layered per-piece renderer (no merged
composite, no screen-space lighting layer). Every lit style has lit per-piece sets
baked by `scripts/build-lit-regions.mjs`: for each hexagon and each of the
twelve ways a piece can stand on screen (30° steps; Spaceship Earth's default turn is now 30°),
the unlit base fused with terrain lighting turned so the light always comes
from the same side of the browser (`lit/<orientation>/<region>/…` under
`maps/default-layers/v1/dymaxion/<style>`, `lit: 12` in the manifest entry).
Each piece draws the set for its target rotation and the current map turn, so
shadows stay consistent across the dance and under the dial, which is what lets
the original alignment be recognised again after a long walk. Show lighting
switches Spaceship Earth between its lit and unlit sets. Every lit style
(Lifezones, Satellite, Elevation, Topographic, Gray neutral, Ivory) has its
twelve sets; `scripts/build-lit-regions.mjs` takes `LIT_STYLE=<id>`. Pieces tween in place on the live net (380 ms, slight overshoot; instant
under reduced motion), so cached routes, dots, labels and the coordinate
readout follow. Exports use the base positions. The band lattice helpers and
`tourImagePieces` in `dist/tour-layout.mjs` stay as tested geometry but are no
longer used by the app. Checks: `tour-endless-tests.mjs`,
`tour-polynesia-tests.mjs` and the drag checks in `/tests/tour-history.html`
(the quick run by default; `?full=1` scrubs every period and drags in every
direction). The browser pages are not part of `npm test`.

Megafauna: the extinctions that followed people are told where the stories
already reach (Sahul at 50k ya, the Americas and Eurasia at 10k ya, moa at 1400
CE, the dodo at 1600 CE, Steller's sea cow and the fur hunters' route at 1800
CE) and as spots of their own where none did: the last mammoths of Wrangel
Island at 3k ya and Madagascar's giants at 1000 CE, each with arrival routes.
Notes in `dist/megafauna-sources.md`.

Story content notes: the Silk Road spans Bronze Age tin and lapis lanes to
Mongol-era and maritime networks; Origin of mankind keeps directed, connected
dispersal branches with early hominins running outward only, Neanderthals as a
sister lineage that interbred, and 2025 Sahul and 2026 South American studies
noted without settling their chronologies; the Viking story runs from raids to
the Iceland–Greenland–Vinland voyages; Polynesia from Lapita to an uncertain
South American contact; the Americas include Amazonian river pottery and
greenstone links drawn uncertain; African networks name enslaved people as their
own red wave. Per the user, stories draw overall trends, never individual
journeys. Evidence notes: `human-migrations-sources.md`,
`territory-tours-sources.md`, `polynesia-sources.md`, `silk-road-sources.md`,
`americas-exchange-sources.md`, `african-networks-sources.md` and
`ocean-crossings-sources.md`. Area geometry (`dist/tour-areas.mjs`, the clipping
renderer and `scripts/build-tour-areas.py`) is kept and tested
(`tour-area-tests.mjs`) but no longer drawn.

The Pacific-facing arrangement (`pacificTourNet`) rotates the North and South
America hexagons to exact Pacific joins; the vertical dancing band uses it, with
`maps/tours/pacific-v1` supplying relit terrain for the two moved pieces on
Lifezones (other styles rotate the original artwork). Light stays at the same
screen-space azimuth as the fixed pieces.

All seven stories have root-level landing pages, registered in
`dist/tour-pages.mjs`: `/origin-of-mankind/`, `/silk-road/`, `/iceland-to-vinland/`,
`/french-polynesia/`, `/americas-exchange/`, `/african-networks/` and
`/ocean-crossings/`. Direct entry loads Spaceship Earth + Lifezones with the
timeline on at that story's first period and its card open; the URL then becomes
the map URL with `?history=`.

`build-share-pages.mjs` creates static canonical, Open Graph and Twitter tags plus
sitemap entries. Descriptions come from the period Markdown; cards are distinct
1200×630 JPEGs in `dist/social/tour-*.jpg`. To regenerate them, run
`python3 scripts/save-social-previews.py`, then open
`http://127.0.0.1:4173/tests/tour-social.html?save=1`. This local-only artwork view
frames the actual tour overlays and captures the same image renderer, including
Pacific lighting, without UI controls. Checks: `tour-page-tests.mjs` and
`/tests/tour-pages.html` (also `?mobile=1`).

The additive image inventory is prepared with `node scripts/prepare-tour-assets.mjs`.
It includes the five previews and the Pacific lighting tiles, without duplicating
the global atlas. With explicit approval on September 21, `scripts/upload-r2-assets.py
_asset-release/tours` uploaded and verified release `maps-98ad6c42082f23d0`, and
`node scripts/activate-tour-assets.mjs` recorded its public checksum in
`tour-asset-release.json`. Production staging and CI require this verified record
and stop with an explanatory error while it is absent; re-rendered previews need a
new inventory, upload and activation. The existing global asset release remains
unchanged; production config uses narrow prefix overrides for the tour images.
Local preview continues to use local files.

Edit **`dist/history/<period>.md`** for story titles, texts, spot positions,
views, legends and source links, and `<period>.routes.json` for routes; keep the
`## story-id` headings intact. Files are fetched directly, so refresh the page
after editing; only new or moved routes need `scripts/relax-tour-routes.py`. The
small safe parser supports paragraphs, bold, italics and HTTPS links, without
running raw HTML. Checks: `tour-polynesia-tests.mjs`.
To regenerate the Pacific assets, prepare unlit bases with `merge-map-images.py`
into `/tmp/hex-pacific-bake`, run `scripts/serve-pacific-bake.py`, open
`/tests/bake-pacific.html`, and click Bake. After completion, run
`scripts/finish-pacific-bake.py` with Pillow/NumPy available. The bake uses the
full final net for terrain lighting, outputs only regions 0 and 2, and preserves
the original assets. The helper listens only on loopback and writes only its
named scratch files.

Hovering the map shows latitude and longitude to four decimal places to the
left of the positioning toolbar, using the same projection as the map. The
readout disappears after three seconds without mouse movement. Negative values mean south
and west. The readout hides off the map and is excluded from exports.

Markers reuse the map's projection and follow pan/zoom. Their animated radii
stay in screen pixels and convey clickability, never geographic extent. They
hide all other dots while a story is selected, restoring them on close. They
support keyboard activation and reduced motion, preserve drag/pinch gestures,
and stay out of canvas/print exports. Other format/style presets and custom
geography do not show this tour. Checks: `tour-marker-tests.mjs` and
`/tests/tour-markers.html` (including a selection counter for manual gestures).

- Tetrahedral faces expanded into regular hexagons through their alternating vertices and edge midpoints.
- Four octahedral faces plus the three centroid-divided neighboring face pieces per hexagon.
- Twelve rhombic dodecahedron faces partitioned into four groups of three rhombi.
- Tetrakis hexahedron with configurable pyramid tip distance (cube half-edge = 1).
- One full-world hexagon and two paired hemisphere hexagons using Lambert azimuthal equal area plus an area-preserving disk-to-hexagon map.
- 81 valid connected layouts for each polyhedral construction, built by matching oriented spherical edges and rejecting overlaps or incompatible contacts.
- Global longitude, latitude and roll; central projection or normalized vertex interpolation; triangle barycentric shape bias.
- Canvas pan, cursor-centered zoom, globe rotation, touch pinch zoom, fitting, graticules, construction lines, edge labels, palettes and PNG export.

The supplied name “rhombic icosahedron” is interpreted as **rhombic dodecahedron** because the requested solid has 12 rhombic faces.

## Cached lighting layers

Default format/style combinations now load offline PNG layers. The on-demand
renderer below is used for customized maps; it is not part of default startup.
See **Pre-rendered default surfaces** for generation and verification.

Sculpted, Dramatic and Gentle use the original `ReliefRenderer` settings and
shaders. The renderer prepares two projected image layers containing diffuse
shading/cast shadows and highlights, including the panel's exterior shadow.
Normal frames composite these images with independent Dark and Light opacity
controls. They do not run the terrain-lighting or horizon passes. Color fade
stays independent and also updates the legend.

Layers are prepared **on demand**, not shipped as offline images: selecting an
uncached preset, changing geometry/globe orientation, or applying Custom lighting
prepares a new pair. Desktop Custom edits wait for **Apply lighting**. Mobile
replaces Custom with None. Pan and zoom reuse the pair, including in the infinite
honeycomb, whose lighting repeats with the tiling's rectangular period.

The cache keeps at most three pairs. Phone layers have a maximum dimension of
1,000 pixels (2,200 on desktop); intermediate render targets are released after
preparation. Only a resized elevation overview is loaded, never the six large
height tiles. Print/PNG exports reuse the same lighting layers, so the map
texture can be sharper than its lighting at very large export sizes.

Browser checks: `/tests/relief-render.html` compares the original renderer with
composited layers; `/tests/projected-lighting-checks.html` checks the phone UI,
and `?desktop` runs its desktop equivalent, including Custom, every format/style,
opacity/zoom reuse, and repeating honeycomb lighting.

## Geometry and limitations

For the polyhedral methods, all four regions collectively cover the sphere exactly once. Hexagons remain flat. Exposed boundaries are cuts, and matching lowercase labels identify their paired edges. Every physically joined edge matches. The display now extends the selected net into an infinite repeating honeycomb. All tiles are fully opaque, and only mismatched edges are red. This does not claim a seamless infinite honeycomb. Degree-two spherical junctions prevent all degree-three planar honeycomb vertices from preserving the boundary identifications.

Default central projection uses actual planar polyhedral coordinates. The normalized vertex option and shape bias are custom continuous interpolation controls, not published conformal/equal-area implementations. These polyhedral methods make no area-preservation claim. Tetrakis at tip distance 2 converges to the rhombic dodecahedron geometry. No pentagonal geometry is present.

The tests check spherical area, all paired borders at 101 samples, and all contacts in every generated layout. Relief rendering has a separate browser GPU regression page at `/tests/relief-render.html`.

## Rus One and Rus Two (Lambert hexagons)

`dist/circular-projections.mjs` contains matching CPU and GPU inverse maps. For a
unit hexagon, let `a = √3/2`, `s = π/3`, `k = π/(2√3)`, and `β` be the normal
angle of the edge facing a point with polar coordinates `(r, θ)`. Convert to a
unit disk using `u = r cos(θ−β)/a` and `φ = β + k tan(θ−β)`. The angular warp
makes the area ratio constant: `dA_hex/dA_disk = 3√3/(2π)`.

Lambert's inverse gives `z = 1−2u²` for the full sphere or `z = 1−u²` for a
hemisphere. The southern tile reverses both latitude and longitude to match
all six equatorial edges with the northern tile. Directly cropping hemisphere
disks to inscribed hexagons would omit about 17.3% of the globe.

Both maps preserve area, not angles. The full-world map is singular at its
antipode: the entire perimeter represents one point (label P). It follows the
circular-map proposal and does not reproduce Rus's triangular-dihedron fold.
The two-hexagon map has the hexagonal-dihedron boundary pairing, using equal-area
rather than conformal mapping. Shape bias and vertex interpolation do not apply.
Only their corresponding finite arrangements are offered. Rus One starts with
the north pole at its center; Rus Two uses the selected fixed globe orientation.
The minimizer and clearance controls are disabled for both. The previously
computed search data remains available for offline experiments. Rotation, styles, terrain, overlays and exports remain
available. `circular-tests.mjs` checks coverage, Jacobians, every paired edge,
round trips, dragging and projected source circles.

## Primary literature

- Alex Van de Sande, *Gosper World: A Hexagonal Map Using Gosper Fractals*, Bridges 2024, pp. 507–510. https://archive.bridgesmathart.org/2024/bridges2024-507.pdf
- PROJ, *Lambert Azimuthal Equal Area*. https://proj.org/en/stable/operations/projections/laea.html
- Carlos A. Furuti, *World Map on a Rhombic Dodecahedron* (2014). Gnomonic map cited as reference [2] in Gosper World and used as its starting globe projection. https://geo20agostosbc.wordpress.com/wp-content/uploads/2018/03/pseudoglobo-rombicdodecaedro2.pdf
- Jacob Rus, *Flowsnake Earth*, Bridges 2017, pp. 237–244. https://archive.bridgesmathart.org/2017/bridges2017-237.pdf
- B. J. S. Cahill's original writings, collected by Gene Keyes: https://www.genekeyes.com/B.J.S._CAHILL_RESOURCE.html

The app uses the polyhedral constructions as a basis, and does not implement Cahill's conformal projection formula.

## Continent-cut search

Enable **Minimize land on borders** beneath the orientation sliders to apply precomputed globe rotations. The supplied silhouette is thresholded at grayscale 128 (dark = land), and finite arrangements score the outer boundary plus both sides of red seams. Matching internal joins are excluded. Infinite tiling scores every distinct spherical hexagon border once, including borders that meet without a visible seam. The clearance slider selects among ten rotations prepared for distances from 0° to 9°. Exploration, refinement and dense validation use the same objective. Each result is compared against the previous saved result with the new metric, and rejected if it regresses.

The offline preparation script explores 1,500 initial rotations per distance, refines candidates, and validates the result. These are heuristic results, not certified global minima. Selecting a result also restores the projection bias, interpolation, and tetrakis height used to compute it. Adjusting orientation or projection controls manually leaves the preset mode.

## Infinite display

A periodic axial hex grid preserves the selected four-region net as anchors, fills the remaining cells with matching neighbors where possible, then improves the number of compatible joins. It is a heuristic arrangement, not an optimality claim. Every edge is subsequently checked against its actual spherical boundary pairing. Both sides of every incompatible join are flagged; all tiles remain fully opaque.

Only viewport tiles and a surrounding margin are uploaded to the GPU. Panning regenerates visible copies of the same deterministic pattern without accumulating tiles or changing earlier assignments. Border weight zero hides both ordinary outlines and red mismatch markings; it does not change the underlying spherical joins or relief seam guards. Export includes the current repeated view and its conflict markings. The continent optimizer still measures the 12 unique spherical edge pairs, independently of repeated copies.

## Hex subgrid

The optional 49× density overlay uses two generations of the Gosper seven-hex substitution. Each generation scales by `1/sqrt(7)` and alternates the ±`atan(sqrt(3)/5)` turn, so the 49 smallest hexagons return to the parent orientation. The hierarchy is generated independently inside every visible large hexagon and stays fixed to map coordinates during pan/zoom; it is included in PNG exports.

The independent Dot grid option draws seven white dots at the centers of the next-generation children inside each of the 49 small hexagons, at 20% opacity. This gives 343 dots per large hexagon. Dots follow pan, zoom and grid rotation, can be displayed without subgrid lines, and are included in PNG exports.

## Gosper Fractal

The eighth format cuts the repeating map to a seven-region fractal made from
2,401 hexagons at the existing dot-grid depth. Each region contains 343 cells.
Groups of 7, 49 and 343 cells use their exact union boundaries; the final group
of seven regions has one continuous 486-segment outline. The substitution keeps
the existing alternating turns, rather than claiming the canonical Gosper curve.

The **Fractal grid** option draws the smallest cells at 5% opacity, then group
outlines at 10%, 20%, 40%, and the final outer boundary at 80%. Each elementary
edge uses its strongest level so overlapping strokes do not compound opacity.
The existing hex-grid color and thickness controls also style these outlines.
Selecting the format enables this grid and clears the regular subgrid and dots;
selecting a style restores that style's overlays. The Topographic style pairs this grid with terrain, white outlines and a pale blue-gray background (#cedbde).

The map uses clipped source triangles with their original interpolation weights,
so geography and terrain keep the existing projection. This is a new map cut,
not a new spherical projection: red discontinuities in the repeated map remain.
The true outline controls clipping, relief shadows, fitting and hit testing.
The grid works on other formats too and persists in map links and PNG exports.
`fractal-tests.mjs` checks cell unions, coverage, interpolation and topology for
all four polyhedral methods; browser checks cover controls, relief and reloads.

## Shareable map URLs

Controls, selected projection and layout, globe/grid rotations, search settings, grid overlays, palette, quality, interaction mode, expanded panels, and the pan/zoom view are encoded into a compact URL hash beginning with `#m=`. The URL updates as the map changes, so copying the address shares the complete map state. Malformed or unavailable map links fall back safely to defaults. Active searches are not resumed after a reload.

## Distortion colors

The optional combined distortion overlay estimates the local inverse-projection Jacobian with GPU derivatives. Area inflation is (4π / total planar area) divided by the spherical area Jacobian, giving an average-scale reference independent of zoom. Blue/white/amber marks ¼×/1×/4× relative map area (log scale, saturated beyond endpoints). Angular distortion is 2 asin((a−b)/(a+b)), using the principal stretches of the Jacobian; white/purple marks 0°/90° (saturated above 90°). The overlay blends purple over area colors and is qualitative. A checkbox enables the combined view and an opacity slider controls its strength.

These are per-fragment numerical estimates of smooth patch interiors, not seam distortion measurements or geographic region averages. They depend on interpolation and shape bias, and are independent of globe rotation. Overlay opacity and enabled state persist with other settings. Legacy area/angular/both links enable the combined view. WebGL derivative support is required; unsupported browsers retain the normal map. Reference: https://proj.org/en/stable/development/reference/datatypes.html#c.PJ_FACTORS

## Additional map layers

The map source menu includes the supplied continent mask, the supplied Blue Marble image, the supplied terrain image, generated Ivory and Elevation finishes, Natural Earth Admin 0 country boundaries, and an ecology mode. Ecology is rendered from a compact derived RGB asset: the red channel stores Leemans Holdridge classes, green stores five Natural Earth/SRTM Plus depth bands separated at 200, 1,000, 2,000 and 4,000 meters, and blue stores NOAA OISST 1991–2020 annual surface temperature in 0.25°C increments (without increasing the source’s spatial resolution). Land and ocean legends can each be grouped into 3, 6, 10, or 15 classes, arranged in triangular rows of 1 through 2, 3, 4, or 5. Land rows broaden from cold to warm climates, adding moisture distinctions. Ocean rows broaden from deep water to the shelf, adding surface-temperature distinctions; the deepest row merges all temperatures. These are custom aggregations, not measured deep-water temperatures. The v2 encoding lives in `ecology-data-v2.png`; the original asset remains for cached older clients. Antarctica's unclassified polar source pixels are assigned to the polar class. `maps/sources.json` records the source versions, class definitions, processing and limitations.

The Terrain source remains the supplied pre-shaded topographic image. Its embedded lighting is fixed, while Ivory and Elevation are generated from the supplied heightfield and use the same material path in flat and relief views. The app leaves the supplied silhouette as the land-cut optimization mask regardless of the selected display layer.

Tissot modes take their centers directly from the shared Gosper subhex hierarchy, map those centers to the sphere, construct equal-angular-radius geographic circles, and project the outlines back through the current projection. Spherical circles account for latitude exactly, including at the poles. The three densities use radii of 6°, 6°/√7, and 6°/7; centers outside the parent hex are clipped. These are sampled finite circles, approximating infinitesimal Tissot indicatrices. Outlines are clipped to each spherical patch before projection, so circles crossing map cuts split correctly. A background worker prepares the paths, and cached paths are reused during pan, zoom, grid rotation, and globe rotation. The latter rotates both source centers and source circles together because their anchors are defined by the map grid.

### Rivers

The dedicated **Rivers** section toggles a Natural Earth 1:10m centerline overlay, controls its width, and chooses how many scalerank levels are visible. The same overlay is passed into the relief heightfield: River depth lowers the selected channels into shallow valleys so light and shadow follow them. The old raster Rivers map source and the ecology-specific river checkbox are no longer used.

## Elevation relief and raised panels

**Relief & lighting → Sculpt the map** enables a top-down 2.5D heightfield renderer. The map source now also selects the surface material: Ivory and Elevation provide clean, generated finishes, while the image sources preserve their own colors. Pre-shaded sources still contain their original fixed lighting. Relief controls adjust geometry and lighting independently of the selected surface source.

The supplied `data/height.png` is a 21,600 × 10,800 indexed grayscale image with 8-bit scalar precision, including land and bathymetry. Its physical vertical units and exact sea-level datum are unspecified. The initial sea level is gray 105/255, estimated from coastal brightness and exposed as an adjustable control. These are relative artistic heights, not meters or a scientifically calibrated elevation display. No new geographic detail is synthesized.

`python3 scripts/prepare-heightmap.py` converts the original to a 5,400 × 2,700 overview and six full-resolution 7,200 × 5,400 single-channel tiles, each with a one-pixel gutter. Gutters sample the adjacent tile, wrap longitude, and clamp the poles. The original is retained. Assets live in `dist/maps/height/`, with processing metadata in `manifest.json`. The browser first renders the overview, then switches to the complete detailed set. Devices with smaller texture limits receive resized textures; a detailed-load failure keeps the overview available.

Color and elevation share `projection-shader.mjs`, so orientation, shape bias, interpolation, and all projection methods use identical geographic coordinates. A padded offscreen field stores projected heights and the actual map mask. A directional horizon scan finds the highest light-blocking terrain, doubling its search span on each GPU pass. This covers narrow casters without sparse ray-marching streaks. A lighting pass combines the result with slope lighting and local valley occlusion. The outline of a finite arrangement casts onto a background plane; this is not a CSS shadow on the rectangular canvas. Terrain and panel thickness are independent, and seafloor depth is offset so the deepest sample remains above the table. In Land cutout mode the adjustable sea level defines the mask; it is independent of the optimizer's silhouette mask. Map color fade reduces saturation and contrast in the selected image source before relief lighting, leaving terrain response intact.

Light azimuth is clockwise from the top of the displayed map; light stays fixed as the map rotates. Light elevation and model height determine shadow length. Contrast, highlights, ambient light, shadow strength/softness, valley shading, seafloor relief, river depth, and warm/neutral/cool lighting are adjustable. Sculpted, Dramatic, and Gentle change lighting settings without changing geography or the selected image source. Every map setting, including the current view and open sections, is encoded into a compact URL hash so a map can be pasted and shared directly.

The whole finite map is one panel, with no artificial drop shadows on matching internal hexagon edges. Mismatched joins are marked in the heightfield to suppress invalid cross-cut slope samples. A barrier flag propagates with the horizon scan to stop shadows through unrelated cuts. This is a finite-resolution seam guard, not a guarantee for every grazing ray across a subpixel seam. Infinite arrangements have no outer silhouette; their terrain and land-cutout shadows still work. The surrounding caster margin grows with shadow reach, capped at 650 CSS pixels to bound memory. Very long shadows beyond that distance are truncated.

The interactive horizon scan starts at two-pixel intervals and refines to single-pixel intervals after interaction stops; Exports request the refined pass. The download options are PNG 2x, PNG 10x, and PDF (print). PNGs render at their exact requested dimensions using overlapping tiles and incremental compression, without the former 12-megapixel output cap or a single oversized canvas. Export color textures retain full tile resolution; the terrain and shadow field retains an adaptive 12-megapixel budget per tile. This bounds memory for very long shadows while keeping the source map and annotation detail sharp. Cancellation restores the original view and saved URL. Interactive relief buffers remain bounded to three million pixels. The supplied height image has only 256 original levels, so extreme exaggeration/deep zoom may reveal terracing. Local ambient shading and shadow softness are artistic approximations, not path-traced global illumination. The camera remains directly overhead; vertical panel sides are not visible from this angle.

Graticules and distortion colors are composited after relief so they stay readable on each finish. Region labels, construction lines, and hex overlays remain cartographic annotations. Export includes the table, exterior shadows, surface, and annotations. Print PDF uses an A3 page with a 300-dpi map, the title and subtitle above, and “By Alex Van de Sande - hexagonal.earth” below in regular Baskerville. The selected background fills the entire page, and the map sits directly below the title band. Lifezones prints include a compact vector hexagon legend at top right, using the selected land and ocean class counts and their source palettes. Land rows show climate, ocean rows show seafloor depth; the horizontal axes show moisture and surface temperature respectively. Finite maps are fitted in full and centered horizontally; infinite maps use the current view. Lettering uses embedded vector glyph subsets of Baskerville Italic, Gotham Bold, and regular Baskerville. PDF Unicode maps keep all labels selectable and searchable. The prepared outlines include only the characters used by the print labels and legend, so export does not require locally installed fonts or ship complete font files. `swift scripts/prepare-pdf-lettering.swift` regenerates these outlines on a Mac with those fonts installed.

`npm test` covers relief parameter invariants, map-state compatibility, and the grayscale tile dimensions. Open `/tests/relief-render.html` with the server running to execute pixel-based GPU checks for external panel shadows, reversed light direction, terrain self-shadowing, zero-height behavior, pan consistency, shader errors, and PNG encoding.

Download offers Current view - PNG Medium/High and Whole Map - PDF Medium/High.
Medium uses 2× map resolution; High uses 10×. PNG captures the current map
viewport without a print title frame. PDF includes full finite-map bounds,
shadow padding, titles, and credits; infinite layouts use the visible area.
Filenames include the site, author, selected map format, and style.

## Settings organization

All collapsible sections are siblings: Projection method, Layout & grids, Globe orientation, Map source & colors, Rivers, Relief & lighting, and Distortion & Tissot. Panel states are saved by stable IDs; older positional panel states are migrated on load. Flower World presets use a 60° grid rotation.

## Curated styles and hexagonal Lifezones

The style panel contains Lifezones, Satellite, Elevation, Political, Topographic, Gray neutral, Ivory, and Distortion Analysis, with thumbnails rendered from their actual settings. Styles restore their complete lighting, material, river, and overlay settings without changing the projection, format, orientation, interaction mode, or viewport. Format buttons likewise preserve the selected styling. Elevation resets sea level to 105; Political uses a dark blue background with no graticules or dot grid; Lifezones uses a light gray hex subgrid at 0.2× thickness, white dots, and a #ebebeb background. The Infinite honeycomb icon contains 37 hexagons, compared with Flower World's seven.

Lifezones' 1,440 × 720 encoded image contains land classifications from a 0.5° source and ocean temperature zones from a 1° source. Upscaling cannot add classification detail. The display samples those classes at hexagonal cell centers, using the sixth generation of the same Gosper grid as the subgrid (radius 1/343 of a parent hexagon). This is the first even generation whose nominal spherical cell diameter fits the land source resolution. The cells stay aligned with the map during pan, zoom, and grid rotation, and use the current projection to sample geography. Relief and rivers retain their original sampling detail. This changes the visible pixel shape, not the information in the source data.

To refresh thumbnails, run `python3 scripts/save-style-thumbnails.py` alongside the app and open `/tests/style-thumbnails.html?save=1`. It renders all eight styles with a common map view and saves 480 × 272 PNGs locally. Stop the thumbnail writer afterward, then run `python3 scripts/build-style-thumbnails-webp.py`. The site serves the resulting 240px and 480px WebP images according to the card size and screen density, loading the larger version when the options panel needs it.

Runtime assets are included under `dist/`. The original downloaded inputs under `data/` are retained locally and ignored by Git; the offline preparation scripts use them to regenerate the derived assets. Source attribution and processing details are recorded in `dist/maps/sources.json` and `dist/maps/height/manifest.json`.

The **Background color** picker in **Map source & colors** sets the full map workspace and the ground beneath relief shadows. It persists in shared URLs and PNG exports, and remains independent of format selections. Styles can explicitly include a background color; Political uses #2b4b5f. Gray neutral uses #a2bac1, a white dot grid, and zero border weight.

New maps start with **Lifezones + Spaceship Earth**. Formats are ordered Spaceship Earth, Felv, Flower World, Gosper Fractal, 4Hexes, Infinite Honeycomb, Rus One, Rus Two; styles are ordered Lifezones, Satellite, Elevation, Political, Topographic, Gray neutral, Ivory, Distortion Analysis. Saved URLs retain their chosen settings.

## Compact controls and masthead

The initial interface has a floating bottom-left controller: two horizontal thumbnail strips and More options. More options expands the existing controls without duplicating form state; the large close button returns to the compact controller. On phones the options panel fills the screen. The selected controller mode is stored in shared links. Thumbnail buttons retain accessible names and native hover titles when their visible labels are hidden.

On phones, Reposition Globe sits above Download and opens the map with Pan,
Reposition, zoom, Fit, and Done controls. Done restores the options panel and
returns dragging to pan mode. Opening a settings section or entering reposition
mode first shows a memory warning. Continue applies to that action; Don't alert
me again persists on the device, separately from shared map links. Go back to
default styles restores the selected format/style presets and compact picker.

The masthead reads “Hexagonal World” in Baskerville Italic, with the uppercase subtitle set in Gotham Bold when installed (Avenir Next/Arial fallback). It aligns with the compact controller and moves right of the expanded column. Pan, zoom, and layout changes check the actual convex map pieces against the title rectangle; the title fades out on overlap and returns when the rectangle clears. Infinite maps always occupy it. When it is covered or cannot fit on screen, the expanded column shows the title above the introductory copy. Heading contrast follows the background color; reduced-motion preferences disable the fade.

Ivory uses a #8b9992 background with latitude/longitude lines. **Layout & grids** provides separate colors for hex borders, the hex subgrid, and latitude/longitude lines. Borders retain their weight slider; both grids have thickness multipliers (1× matches the original weight). Zero thickness hides the corresponding lines. Grid appearance is restored by presets, saved in map links, and included in PNG exports; mismatch markers remain red.

Spaceship Earth uses the revised globe orientation from the supplied map: longitude −169.74621893297788°, latitude 34.99467419672773°, roll −13.80296086449369°. Format selection fits the map to the current viewport; saved links retain their own orientation and view.

## Sharing, icons and phone layouts

The canonical URL is https://hexagonal.earth/. The homepage uses the 1200 × 630 Lifezones / Spaceship Earth image. All 64 style/format combinations have static Open Graph and Twitter metadata at `/<style>/<format>/`, pointing to pre-rendered 1200 × 630 JPEGs under `dist/social/`. Preset clicks update the path; the `#m=` fragment continues to preserve the exact customized map. A path opened without a fragment loads its presets. `node scripts/build-share-pages.mjs dist` builds local landing pages; the Pages workflow generates them in `_site` from the current app HTML. The `<base href="/">` keeps all shared app assets rooted correctly. Regenerate the images with `python3 scripts/save-social-previews.py` and `/tests/social-previews.html?save=1` on the local server. SVG and PNG favicons, an Apple touch icon, and 192/512-pixel manifest icons use a simplified four-hexagon mark. The home-screen manifest opens the app in standalone mode; it does not provide offline map data.

To regenerate artwork, start the app and `python3 scripts/save-site-assets.py`, then open `/tests/site-assets.html?save=1`. Stop the writer when rendering finishes. The local-only renderer uses the app's actual map layers and a system Baskerville font with a Georgia fallback. Test pages are excluded from publication.

`/tests/responsive.html?width=320&height=568` previews exact viewport sizes. Phone layouts respect safe-area insets, provide 44px toolbar targets, keep the collapse button reachable while scrolling, and hide the floating legend on short screens. Landscape fitting places the map beside the compact controller. Real-device touch, download and memory testing remains separate from these browser layout checks.

## Aggregate analytics

The About this dialog links to GoatCounter and its privacy information. `dist/analytics.mjs` holds only the public counting endpoint. An empty endpoint leaves analytics disabled. With an endpoint configured, the script loads only on hexagonal.earth/www.hexagonal.earth, outside iframes, and honors Global Privacy Control and Do Not Track. It sends one initial pageview with the clean combination path, the referrer origin, and allowlisted events for preset choices and successfully generated downloads. Hashes, query strings, map coordinates and pan/zoom interactions are never included. Loading or counting failures do not interrupt map interactions. Keep individual-pageview collection disabled in GoatCounter for aggregate-only storage.

## Local wave-exposure preview

Run `node scripts/build-wave-preview.mjs` and open `/tests/wave-preview.html` on the local server. This uses the regular app with a preview-only module override; production Lifezones, preset thumbnails and social images are unchanged. The generated HTML/app copy is ignored and all preview assets are excluded from Pages publication under `tests/`.

The ocean replaces depth with the fraction of sampled significant wave heights above 2 m. The checked-in preview uses 513 snapshots at 171-hour intervals across 2015–2024 from Copernicus Marine WAVERYS, its 0.8° spatially averaged product. It is a sampled estimate, not a complete hourly climatology. Exposure thresholds are 10%, 25%, 50%, 75%; coarser triangular presets merge the roughest bands. At least 90% sample availability is required; unknown/ice-covered water stays gray. Temperature remains the existing NOAA 1991–2020 normal. Merging temperature in rougher water is an editorial classification, not a physical law or a navigation safety rating.

`python scripts/build-wave-data.py` rebuilds `dist/tests/ecology-waves.png` and its source metadata (requires NumPy, Pillow and numcodecs; raw public Zarr chunks are cached in ignored `data/wave-preview/`). `node wave-preview-tests.mjs` checks the preview legend and missing-data rules. Source: https://doi.org/10.48670/moi-00022.

## Phone rendering

Phone layouts hide the navigation bar and use touch panning/pinching. A Legend button opens the labelled Lifezones triangles in a centered, dismissible dialog. Initial phone views are fitted below the masthead, including shared links; their globe orientation is retained. Landscape fitting leaves room beside the compact controller. Infinite maps use a small background behind the title because their canvas has no empty region.

Phones use precomputed neutral terrain shading, small source textures (at most 1,920 × 960), and composited panel shadows with None/Gentle/Sculpted/Dramatic choices. These are simplified illustrations, not the desktop physical relief simulation. Screen pixel ratio is capped at 1.5; river masks are one ninth the desktop pixel count, and decoded image caching is bounded to three entries. `python scripts/build-mobile-assets.py` rebuilds the lightweight assets from existing maps (Pillow and NumPy). Desktop elevation now loads only the overview for interaction; detailed tiles load on export and are released afterward, along with large render targets. Export cancellation aborts detail fetches.

Run `/tests/mobile-checks.html` for browser checks covering all eight styles/formats, legend controls, title fitting, shadow presets, landscape rotation and absence of heavy elevation/satellite requests. `?legend=1` leaves the modal open for visual inspection. Browser checks cannot reproduce every iPhone memory limit; physical-device testing is still useful.

### Pre-rendered default surfaces

All 64 default format/style combinations use `dist/maps/default-layers/`.
Flower World and Gosper share their pixel-identical regional base images.
Their lossless PNG pyramids include the accepted base colors, material, rivers,
and distortion appearance. Lighting gains and highlights are separate offline
snapshots of the original renderer. Graticules and existing vector overlays stay
sharp at any zoom. The default image program does not contain live ecology,
terrain, river-field or shadow calculations; no elevation or HydroRIVERS source
is downloaded for these views.

Each region gets a 256px overview before visible detail. Lighting also starts
with small previews. Pan/zoom request only visible detail tiles, with independent
120-texture limits for base and lighting detail (about 32 MiB each), and at most
four overview lighting textures. Queued and active obsolete requests are cancelled.
Failed downloads receive bounded automatic retries, a visible Retry button, and
an online-event retry. Failure never enables the heavy renderer. PNG/PDF exports
wait for the requested images and report failed detail instead of saving gaps.

The baked signature includes geography, material, river and lighting settings.
Custom changes invalidate it. Live programs specialize the projection/bridge
mode, and the ecology projection selects a sector before evaluating its spherical
projection once. Live rivers upload two native channels rather than retaining a
painted RGBA array and canvas; the shader preserves the old coverage/interpolation.
Source images are resized to device texture limits. Returning to a default releases
live source data, terrain textures/framebuffers, lighting snapshots and programs.
Display buffers also have a total pixel budget and respect device dimension limits.

The older lossless WebP base pyramids in `dist/maps/surfaces/` remain useful for
partly customized maps. They exclude rivers/material/lighting, so these uses still
need the specialized live program. Do not use either bake after incompatible
geography, palette or puzzle-outline changes.

Offline preparation (Playwright, Chrome, Pillow and NumPy required):

1. Start the static preview with `npm start`.
2. Run `node scripts/build-default-layers.mjs` for base and overview PNGs.
3. Run `node scripts/build-light-detail.mjs` for close-up lighting tiles.
4. Run `python3 scripts/optimize-default-layers.py` for lossless PNG compression,
   then `python3 scripts/share-default-bases.py` to share identical regions.
5. Run `node scripts/build-share-pages.mjs` after app HTML/cache-version changes.

Use `SURFACE_URL`, `PLAYWRIGHT_PATH`, `CHROME_PATH`, and `SURFACE_PYTHON` for local
installations. Generators resume completed work. `LAYER_FILTER` selects one
arrangement/style, `REBAKE_BASE=1` rebuilds its base, and `LIGHT_LEVEL` selects the
highest lighting detail level. Refresh the complete manifest after filtered builds;
never publish a partial manifest. Bake helpers are restricted to localhost and an
explicit `?bake-layers=1` URL.

`npm test` includes default signature/asset, packing, pixel-budget, projection,
river, surface-cache, export and saved-link checks. Browser verification:

- `scripts/check-default-layers.mjs`: every default, no live shaders/elevation/
  river downloads or terrain framebuffers, and failed-download recovery.
- `scripts/check-map-performance.mjs`: image zoom, live customization, resource
  release, rapid switches, a simulated 2048px GPU, phone sizing, PNG/PDF exports.
- Use `TEST_BROWSER=firefox` and `FIREFOX_PATH` for the isolated Firefox build.

The extended image collection must fit the configured host before publication.
The temporary lighting comparison is prepared for all six illuminated styles
in Spaceship Earth. Normal (automatic) retains the usual adaptive rendering;
Highest detail and Map resolution compare the highest available lighting with
offline copies at the base map's maximum pixel density. Both comparison choices
use the same reference after the memory limit is applied, so the capped version
cannot accidentally be sharper than its reference on a large display. The test
allows up to 384 lighting textures; normal rendering retains its 120-texture cap.
It reports loading and memory limits and disables itself for styles without
lighting, unprepared formats, or live views. It is excluded from shared state and does not merge or
delete any original layers. `scripts/build-lighting-comparison.py` prepares these
copies; `scripts/check-lighting-comparison.mjs` checks visible pixel changes,
exact restoration, unchanged links, and absence of terrain rendering.
GitHub Pages remains the application host. The subsequent approved image
migration uses Cloudflare R2; see the migration section below. See the health-check follow-up for measured size,
verification results, and any remaining publication constraint.

The Map source dropdown also includes three Wikipedia reference maps, independently
of the style presets: [Strebe's world map](https://commons.wikimedia.org/wiki/File:Equirectangular_projection_SW.jpg)
(CC BY-SA 3.0) and [Justin Kunimune's Tissot indicatrices](https://commons.wikimedia.org/wiki/File:Plate_Carr%C3%A9e_with_Tissot%27s_Indicatrices_of_Distortion.svg)
(CC BY-SA 4.0), plus [Blue Marble 2002](https://commons.wikimedia.org/wiki/File:Blue_Marble_2002.png)
(NASA, public domain). They are labeled Wikipedia: Default, Wikipedia: Tissot,
and Wikipedia: Blue Marble. Local copies load only when selected. The world map's outer frame
is removed for geographic alignment; the SVG is rasterized for the map texture.
The indicatrices are embedded source imagery. Source links, changes and licenses
appear below the source selector and in `dist/maps/sources.json`; exported PNG
copyright metadata and PDF subject metadata retain the attribution and the
corresponding ShareAlike license for the adapted imagery.

Shared links store only differences from the style and format named in the URL.
An unchanged preset has no state fragment. Custom settings and panel changes use
an indexed version-2 payload; a changed view retains its full camera coordinates.
Version-1 links remain readable and are shortened when opened. The key order in
`dist/map-state.mjs` is part of the link format: append keys rather than reorder them.
PNG current-view downloads trim the outer empty margins around finite maps,
including padding for relief shadows. The crop stays inside the current viewport;
PDF exports continue to include the whole map. Repeating maps keep the viewport.

## HydroRIVERS overlay

The existing 1–12 tributary slider now selects cumulative HydroRIVERS v1
mean-discharge thresholds: 10000, 5000, 2000, 1000, 500, 200, 100, 50, 30,
20, 10 and 5 m³/s. The input contains 8,477,883 source reaches; flows below
5 m³/s are omitted to prevent streams merging into solid patches at the
current raster resolution. These are
display detail levels, not Strahler or classical tributary-order values.

`scripts/build-hydrorivers.py` reads the locally extracted global shapefile
under `data/hydrorivers/extracted/` and creates 12 lossless distance masks
for desktop (4320×2160) and mobile (1440×720). It requires NumPy, Pillow and
SciPy. The original source remains local and excluded from deployment.
`dist/maps/hydrorivers/v2/manifest.json` records counts, sizes and checksums.

Only the selected level is downloaded. Width changes reuse its distance
field; color remains a shader setting. Obsolete downloads are cancelled,
and failed downloads can be retried. The raster matches the previous river
texture resolution: adjacent streams may merge, and zooming does not add
new source detail. Source provenance and required attribution are in
`dist/maps/sources.json` and `LICENSE`.

River opacity: prepared masks also encode nominal pixel width.
Widths below one pixel of the river raster use proportional alpha (0.5 px =
50% opacity); wider centerlines stay opaque. The map shader retains alpha
instead of thresholding it. This is coverage at river-texture resolution,
not a new screen-space or zoom-adaptive line renderer.

### Lifezones palette defaults

The September 15 approved palette uses ten land classes and six ocean classes,
with the original Sculpted lighting and rivers retained. The six-sea warm row uses vivid blue,
deeper blue and navy; the exact swatches are in `dist/map-layers.mjs`. Cached
ecology surfaces use `lifezones-defaults-1` to match the live and export legends.
Other ocean class counts retain their existing reference palettes.

### Temporary palette experiment

Add `?palette-lab=1` to a map route to open the opt-in editor for 10 land
classes and 6 ocean classes. It uses live rendering so edits appear on the map
and shared legends, including print legends. Rivers stay enabled; the Shadows
checkbox toggles relief lighting. Copy values exports named color lists and the
shadow setting as JSON; paste into the field and press Apply pasted values to
restore a palette. Invalid imports leave the current palette intact.

The trial palette is kept in session storage for that tab, not applied to normal
map visits or included in shared map links. Exit experiment restores the regular
map. Copy the values to retain them outside the browser session or send them for
adoption as defaults. No palette is made permanent by using this editor.

### Cloudflare image migration (September 16)

The accepted finite defaults now draw merged PNG tiles directly, progressively
and with a 120-texture cache. Infinite Honeycomb keeps separate images. Customized
finite lighting opacity or background uses live rendering. Original local assets
remain available for offline preparation and preview.

`dist/asset-url.mjs` routes image loaders through `dist/asset-config.mjs`; its
empty default preserves local preview. `scripts/prepare-r2-assets.mjs` creates a
hashed, explicit R2 upload inventory (5.47 GB), excluding unused experiments.
`scripts/build-external-site.mjs` stages an image-free website for a verified
remote release. The GitHub workflow verifies the pinned remote inventory and
downloads binary test inputs before publishing. Image files are excluded from
new source commits and from the Pages artifact; historical Git objects are retained. See [CLOUDFLARE-ASSETS.md](CLOUDFLARE-ASSETS.md)
for the sequence, costs, domain setup and validation.


Trade-flow experiment: `dist/tour-trade-traffic.mjs` generates stable irregular
cluster/gap patterns only when the trade dataset loads. CSS advances these sparse
packets without a JavaScript frame loop or map redraws. The route renderer splits
paths at net cuts and carries the dash phase by cumulative drawn distance, never
across the screen gap. Existing screen-space lanes, Pause and reduced motion
remain; migration and static outlines retain their previous appearance. No
historical volume weights are assigned: current frequency is explicitly visual.
Checks: `tour-traffic-tests.mjs` and `/tests/tour-history.html` (including phone layout and lazy loading).
