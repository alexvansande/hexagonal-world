# Design decisions and working agreements

Reviewed September 14, 2026. This is a selective record of decisions and their
reasoning, not a chronology or a backlog. It synthesizes this puzzle discussion,
retrievable messages from earlier project tasks, and the current code and tests.
Some older task turns returned no message text; this is not a complete chat audit.

**How to read this:** explicit user corrections establish intent. Code and tests
establish what is implemented. Assistant proposals and old completion reports
alone establish neither. Current user instructions can revise these decisions.
README sections have accumulated over time and can contain earlier behavior;
verify implementation details before treating a historical description as current.

## 1. Reuse the application's Gosper hierarchy

**Decision.** “Divide a hex into seven” means the existing center-plus-six
construction in `dist/subgrid.mjs`. Each generation scales by `1/√7` and alternates
`±atan(√3/5)` (about 19.1°). Two generations produce 49 children aligned with their
large parent; next-generation centers give 343 dots per large region.

**Reason.** The rotations, centers and relationship between levels are part of
the visual design. The reference image, `hex grid.png`, was supplied in the
September 9 discussion and again during the puzzle correction. This is not an
invitation to invent any visually plausible seven-part partition.

**Rejected alternative.** The first puzzle implementation used independently
clipped Voronoi cells. It preserved the large straight outline by producing
partial/irregular small pieces. That was the wrong construction, even though it
had the requested piece count and its own coverage tests passed.

**Preserve.** Puzzle cells come directly from `subgridLevels[1]` or `[2]` through
`cellPolygon`; every starting cell is a whole regular hexagon. The silhouette may
extend beyond the former straight parent boundary. Fractal group boundaries are
actual unions of child cells, not convex hulls or approximate larger hexagons.
The app uses its established alternating-turn substitution; do not claim it is
necessarily the canonical Gosper curve.

Evidence: “Run the server so I can see the app”; “Add puzzle overlay option”.
Checks: `puzzle-tests.mjs`, `fractal-tests.mjs`.

## 2. Topological neighbors are not just pairs of piece IDs

**Decision.** Keep full oriented edge pairings. Two regions may meet along more
than one distinct side. The map's unusual adjacency is intentional.

**Reason.** Reducing adjacency to one connection per pair would lose valid joins
and can attach the wrong geography or connector. The project explores hexagonal
maps under these boundary identifications; replacing them with conventional
pentagon-containing tilings changes the premise.

**Preserve.** Use the existing spherical matching and rotated neighbor placements
in `dist/geometry.mjs`. Boundary labels, cuts, puzzle pairing and transferred
artwork must agree with those identities. Infinite repetition is a separate
heuristic: it has known incompatible joins. Hiding red outlines does not make
those joins continuous.

Evidence: current puzzle request; “Review About page copy”; README geometry and
infinite-display sections. Checks: `tests.mjs`, `tiling-tests.mjs`.

## 3. A puzzle changes the cut and must carry the map with it

**Decision.** Offer 28 pieces (4 × 7) and 196 pieces (4 × 7 × 7), with independently
customizable line width and color, saved in links and used in exports.

**Reason.** This is a puzzle made from the map. An outer tab filled with background,
stretched pixels, or the wrong neighboring region is not a correct piece.

**Preserve.** Clip original source triangles to the true concave puzzle outline;
retain their spherical interpolation weights and source-region coordinates.
Outward extensions use the correctly rotated neighboring source. Fitting, relief
and export bounds must account for the new silhouette. The live rendering path
is currently used for puzzles rather than an incompatible pre-rendered surface.

**Implementation limit, not a permanent design principle.** The current puzzle
works on four-region Flower/Fuller arrangements and switches off on unsupported
arrangements. Do not describe this as a requirement of Gosper subdivision.
Expanding layout support is a separate change that must preserve the piece count
and complete map coverage.

Evidence: “Add puzzle overlay option”. Implementation: `dist/puzzle-grid.mjs`,
`dist/app.mjs`. Checks: `puzzle-tests.mjs`.

## 4. Every puzzle join has its own connector

**Decision.** Only the intended paired edge matches exactly. The user explicitly
replaced the initial interchangeable-tab design with unique connectors.

**Reason.** A connector should help identify the correct placement, not merely
look like a jigsaw. Random-looking differences alone do not guarantee uniqueness.

**Preserve.** Build a deterministic catalogue of canonical paired-edge identities.
Assign distinct depths without hash collisions and vary width, position and slant.
Generate an asymmetric curve once in the canonical direction, reversing it for
its partner. Reuse shapes across reloads, pan/zoom and exports. Check unrelated
joins for duplicate profiles, including reversed/flipped orientations, as well
as checking intended partners for exact agreement.

**Limit.** Exact geometric uniqueness does not guarantee that a loosely cut or
flexible physical piece cannot be forced into a near-match. Manufacturing
clearance and minimum practical shape separation have not been validated.

Evidence: explicit request in “Add puzzle overlay option”. Checks:
`puzzle-tests.mjs` verifies unique normalized depths, matching curves, whole-cell
hierarchy, concave coverage, source artwork and URL persistence for both counts
and all four polyhedral methods.

## 5. Separate format, style and a saved view

**Decision.** Keep thumbnail cards for both map format and map style. Each must
apply immediately and independently. Compact shared URLs replace the former
standalone header preset library, not these cards.

**Reason.** Earlier work removed the cards when asked to remove “presets”, then
restored full saved snapshots that mixed format, appearance and viewport state.
The user corrected both interpretations. They want to combine a map construction
with a look, and exchange exact custom maps by pasting URLs.

**Preserve.** Format owns the construction/orientation; style owns appearance.
Use the current ownership lists in `dist/share-routes.mjs` and `dist/map-options.mjs`
for shared settings such as overlays. Decode a supplied link before editing a
preset; copy the relevant approved settings, not incidental zoom, pan or panels.
Format selection fits the available viewport. A directly opened saved map retains
its custom state, with the deliberate phone fitting exception.

**Compatibility.** Append positional URL keys; do not reorder them. Retain legacy
readers and meaningful zero/false values. Rebuild generated route HTML after
entrypoint changes: editing only the root page previously left a refreshed
shared route loading an older renderer.

Evidence: “Run the server so I can see the app”; “Diagnose map rendering bugs”;
“Review About page copy”. Checks: `style-tests.mjs`, `sharing-tests.mjs`.

## 6. Detail and performance must preserve the same visible design

**Decision (updated September 15).** Opening any default format/style uses offline
image layers, including its rivers, material and lighting. Default views must not
compile the live ecology program, rasterize global rivers, load elevation, or run
terrain/shadow passes. Customized geography and appearance retain live rendering.
Image compositing and inexpensive vector overlays are still allowed.
The September 16 resolution comparison found no worthwhile visual benefit from
extra lighting resolution in the user's review (a small Satellite difference was
acceptable). The user authorized generating separate experimental default images
with lighting incorporated at map resolution, then measuring and reviewing them.
On September 16 the user approved adopting the finite-map replacement while
keeping Infinite Honeycomb separate, and requested Cloudflare image hosting.
The finite renderer now draws the accepted PNGs directly, with no old renderer
underneath. Fixed preset lighting/background use fused images; customized
opacity/background use live rendering. Independent controls remain available.
Current local assets are retained until the remote release is uploaded and verified.
Compare actual pixels per map unit; base and lighting
level numbers cover different extents. Report when the toggle makes no change.
The test uses explicit Automatic / Highest detail / Map resolution choices.
Choose a common reference within the memory budget before capping density;
independent level reductions previously made the original look softer on large
displays. Do not tell the user to zoom beyond the application's maximum.
The full-period merged infinite representation remains experimental.
The separate generated experiment measures 2.78 GB for the seven finite formats
versus 4.97 GB of replaceable lighting (2.19 GB net saving, keeping unlit bases).
Flattening the whole repeating Infinite Honeycomb period instead duplicates map
colors: 5.34 GB versus 1.60 GB of old lighting. This is evidence against adopting
that representation for Infinite Honeycomb, not approval to remove any assets.
See `MERGED-MAPS-EXPERIMENT.md` for the original experiment and
`CLOUDFLARE-ASSETS.md` for adoption and migration status.
Mobile should reach a comparable close-up scale to desktop, not merely share the
same numeric zoom multiplier on a smaller initial map.

**Reason.** The September 15 performance request explicitly extends pre-rendering
to everything practical and requires preserving the maps' appearance. It supersedes
the earlier exclusion of shadows and relief from offline preparation. Use coarse
previews first, lazy visible detail, bounded caches, and recoverable image loads;
do not silently fall back to heavy rendering after a failed download. Changing
colors, geography or deleting small details is not an acceptable speedup.

**Preserve.** Download visible detail, retain coarse fallbacks, bound caches and
release export-only resources. Do not use baked surfaces after projection or
outline changes unless their compatibility is verified. Distinguish source
resolution, screen resolution and generated detail: upscaling does not add data.

**Grid-fading conflict resolved.** “Don't fade the larger grid” was an intermediate
experiment. Later requests permit it to fade after finer detail appears, and limit
simultaneously visible hierarchy levels. But hiding coarse levels must not remove
edges needed to close visible fine outlines. Fine copies must tile throughout the
viewport, including distant panning, rather than appear only at the center.

Evidence: “Diagnose map rendering bugs”; current surface modules and README.
Checks: `fractal-tests.mjs`, `surface-tests.mjs`, `mobile-tests.mjs`,
`projected-lighting-tests.mjs`.

## 7. River appearance evolved; do not restore the earlier binary rule

**Decision.** Current rivers use HydroRIVERS detail in the existing 1–12 slider,
a color picker, and proportional opacity for widths below one river-raster pixel.
Wider centerlines remain opaque. Current per-style defaults live in code.

**Reason.** The earlier request for a single solid river color removed distracting
blur. A later explicit experiment introduced subpixel opacity; the user liked it
and supplied revised style links. That later decision supersedes the blanket
“either river or no river” rendering rule.

**Preserve.** The levels select cumulative data detail, not a promise of classical
tributary order. Loading more source data and integrating it into the display are
different tasks. Preserve settings when only data acquisition is requested. Raster
coverage opacity is not yet a screen-space width solution at every zoom.

**Do not infer geography from appearance.** Desert drainage can be real, uncertain,
or visually disconnected by filtering. Do not erase isolated channels or invent
connections merely because they look odd. The user accepted leaving the appearance
unchanged after the discussion; dashed intermittent rivers remained a suggestion.

Evidence: “Diagnose map rendering bugs” followed by “Review About page copy”.
Checks: `river-tests.mjs`; implementation and provenance in `dist/river-layers.mjs`,
`dist/maps/sources.json` and the README HydroRIVERS section.

## 8. Preserve the author's voice and explain geometry honestly

**Decision.** The About page has a playful human-authored introduction and a
separate, initially collapsed technical explanation in Fira Code and muted gray.
Review-before-edit requests for this copy are real boundaries; they are not a
standing requirement to ask permission for every code change.

**Reason.** The user deliberately retained subjective wording and the unusual
neighbor explanation after reviewing suggested corrections. Silently replacing
that voice with a textbook introduction would undo an accepted choice.

**Preserve.** Flag factual issues clearly and distinguish proposed corrections
from applied edits. Keep technical area-preservation claims specific to the actual
projection/settings. In particular, the README's old blanket statement that no
polyhedral method preserves area is superseded for the implemented tetrahedral
equal-area path; it is not evidence that all other modes are equal-area.
Keep original-work attribution and third-party licensing distinctions intact.

Evidence: “Review About page copy”; `dist/tetra-projection.mjs`,
`tetra-equal-area-tests.mjs`, `LICENSE`.

## 9. The About animation explains an actual construction

**Decision.** Use real projection/unfolding stages with continuous animation to
the nearest selected stage. Rhombic dodecahedron is the default; only its flow
has Rearrange. Preserve the chosen stage when comparing compatible constructions.

**Reason.** The movement itself explains the map. The user's sketch specifies
which pieces stay anchored, not merely the final silhouette. Moving the globe or
camera to fake a correct endpoint undermines that explanation.

**Preserve.** The accepted planar orientation has a 120° adjustment. Africa and
the main Asian section stay anchored during the rhombic rearrangement; the other
pieces move to the actual Felv arrangement. Tetrakis and rhombic use comparable
orientation/framing at Adjust. About has a real route and Back returns to the map.

Evidence: “Add About page globe widget”. Checks: `about-tests.mjs`,
`about-projection-tests.mjs`, `about-route-tests.mjs`.

## 10. Repository workflow and publishing are different decisions

**September 16 image-hosting approval.** Serve image assets from Cloudflare R2;
keep the application on GitHub Pages. The domain is registered at GoDaddy.
Registration can remain there; DNS changes must preserve the existing zone.
The user activated R2 and changed the GoDaddy nameservers; the Cloudflare zone
is active. Public images use the dedicated `hexagonal-earth-assets` bucket and
`assets.hexagonal.earth`, with scoped local upload credentials, CORS, and immutable
release prefixes. GitHub Pages continues to serve the application.
The asset release inventory is explicit and versioned. Verify it remotely and
test cross-origin exports before changing production or removing tracked copies.
Removing current image files from Git does not remove their historical commits;
history rewriting is a separate, unapproved operation.

**Decision.** Keep the dependency-free static WebGL architecture unless a change
requires otherwise. `dist/` contains authored application code as well as assets;
it is not a disposable build directory. Generated share pages are rebuilt by
`scripts/build-share-pages.mjs` and excluded from source tracking.

**Reason.** A framework migration or a new hosting destination is not implied by
an overlay, copy edit or repository documentation task.

**Hosting conflict.** README labels `.openai/hosting.json` as legacy. The checked-in
`.github/workflows/pages.yml` tests and publishes through GitHub Pages after a
push to `main`. Earlier project tasks explicitly used that route. During the
puzzle task, the assistant instead followed Sites tooling and attempted an upload;
automatic approval review rejected it and no Sites publication completed.
Do not treat that attempt as an accepted migration or an ongoing authorization.
Resolve conflicts with active tooling instructions explicitly rather than silently
choosing another destination. Old HTTPS failures in chats are historical reports,
not a statement of today's availability.

**Working agreement.** Preserve unrelated changes; make requested corrections
concrete rather than only agreeing with them; verify the user's actual failure
case and report local versus published status accurately. Do not re-request an
approval already granted within its applicable scope, and do not turn an old
approval into permission for a different payload or destination. Documentation
maintenance does not itself require publishing the website.

Evidence: README Publishing; Pages workflow; “Diagnose map rendering bugs”;
“Add puzzle overlay option”.

## 11. Disabled features hide their settings

**Decision.** Keep the enabling checkbox visible, but hide its dependent settings
and explanatory notes while unchecked. Preserve the values for re-enabling.
Shared hex-grid settings appear when either regular or fractal grid is enabled.
Tissot's explanatory note follows its Off selection in the same way.

**Reason.** The user wants a simpler panel showing only relevant controls, not
inactive colors and sliders. This applies after direct toggles, preset changes
and restoring shared links. Hiding is presentation, not deleting or resetting
settings; hidden inputs must also leave the keyboard tab order.

Evidence: September 14 request in “Add puzzle overlay option”.

## 12. Adopt the supplied Lifezones palette and retain shadows

**Decision.** Use the user's September 15 palette for the default ten land zones
and six seas, with the original Sculpted lighting enabled. Keep rivers and the remaining style
settings. The exact colors live in `dist/map-layers.mjs`.

**Reason.** The user selected these values in the temporary palette editor and
explicitly asked to work with them as defaults. This supersedes the unapproved
blue-violet-to-plum warm-ocean experiment for the six-sea map: its warm row now
uses vivid blue, deeper blue, and navy. Boreal scrub is muted and warm rainforest
is brighter. Other ocean class counts keep their existing reference palettes.

**Preserve.** Live maps, baked default surfaces, screen legends and print legends
must use the same colors. Rebuild and version ecology tiles on palette changes.
The user explicitly corrected the imported `shadows: false` flag: it was not
a request to remove the default shadows. Restore the original Sculpted setting
and bake its shadows into the default image layers, preserving lightweight startup.
This supersedes the earlier interpretation of the palette editor's off flag.

Evidence: September 15 supplied 16-color palette; subsequent explicit correction
to ignore the false shadow flag and restore shadows.
Checks: `palette-experiment-tests.mjs`, `style-tests.mjs`, `surface-tests.mjs`.

## 13. Discovery starts with clickable dots only

**Decision (September 21).** Add fifteen data-driven discovery markers only to the
default Spaceship Earth + Lifezones view. Each has a stable ID, title, geographic
anchor and reserved overlay metadata. Thin, staggered, fading ripples are a UI
affordance with a fixed screen size; they do not represent geographic areas.

**Location revision.** The user moved the Eurasian anchor from Kazakhstan to
the green boreal belt in Russia’s Urals and added French Polynesia, Australia,
Bering Strait, North America, the Amazon mouth, India and China. Retain the
Eurasian ID when moving its anchor. French Polynesia is reserved for a later
Polynesian story; its subsequent implementation is recorded below.

**Coordinate picking.** The user requested a small cursor readout to resolve
ambiguous location requests. Show latitude then longitude in decimal degrees
from the existing map projection, including on marker hover. The user then
replaced the cursor-following placement with a fixed readout to the left of the
Pan canvas / Reposition globe toolbar, hidden after three seconds without mouse
movement. Keep it out of exports and hide it off the map. The user selected
the Dzungarian Gate at approximately 45.4°N, 82.4°E as the Silk Road anchor
after reviewing its role as a northern trade passage between mountains. This
supersedes both the tentative 47°N, 83°E point and the earlier Pamir/Alay
approximation, retaining the same marker ID. The historical basis is the
northern route through the Gate described in Encyclopaedia Iranica,
“Chinese Turkestan ii. In Pre-Islamic Times”; Getty’s geographic record
1108383 places the pass near 45.4167°N, 82.4167°E.

**Silk Road story (September 21).** The user subsequently requested the first
story: clicking Silk Road focuses the main overland network, draws dotted routes,
and replaces the compact picker with a matching title/text/close card. Closing
or Escape restores the previous camera and controls. This supersedes the dots-only
restriction for Silk Road. Later user requests below extend stories to other
dots, including routes and area overlays; the original dots-only scope no longer
applies to those explicitly requested tours.

The route data is an editorial schematic combining corridors from different
periods, not a surveyed track or a claim that one passage was always busiest.
Include both Tarim oasis branches, the northern Dzungarian/Zhetysu branch,
Fergana, Pamir/Bactria, northern India, Persia and the Mediterranean connection.
Keep source links with the data. Project routes with the existing geographic
transform and split at net cuts; dots, story and paths remain screen-only.
The default image renderer, format/style settings and saved URL schema stay intact.

**Trade flows (September 21).** The user requested colored moving dots for
commodities instead of one static Silk Road stroke. Preserve the overland
corridors and distinguish silk, gold/silver, glass/copper/tin, horses and
spices/cotton. Group precious metals regardless of coins, bullion or objects,
as explicitly requested; do not add a separate money category. Representative
Mediterranean and Red Sea links connect Rome and India, with a Nile/desert
transfer rather than a modern Suez shortcut. Small screen-space lanes separate
overlapping flows, not geographic roads. Keep the legend in Markdown and reuse
Pause/reduced-motion behavior. Sources distinguish attested commodity exchanges
from editorial itineraries and mixed periods. This supersedes the static Silk
Road behavior; other tours retain their existing rendering.

**Sparse trade experiment (September 21).** The user requested irregular moving
dots with clusters and empty intervals to reduce visual clutter, using relative
volume only if evidence permits it. Trade periods now use independent, sparse
random patterns; this supersedes their regularly spaced animated stroke. Keep
migration and other tour lines unchanged. No comparable route/commodity volume
series was established from the current sources, so frequency remains explicitly
illustrative. Individual cargo weights and transport-cost estimates are not
network volume weights. Future weighting requires period-specific, comparable
sources and units. Preserve lazy loading, colors, Pause/reduced motion, and
continuity across map cuts. Stable random seeds and CSS animation avoid map
redraws or per-frame particle allocation. The user subsequently requested twice
the frequency so routes remain visible: halve dot-to-dot intervals while keeping
dot size, travel speed and irregular clustering. This supersedes the initial
sparser density; frequency is still illustrative, not measured trade volume.

**Regional trade networks (September 21).** The user approved the colored flows
and requested internal Chinese, European and Indian networks, explicitly adding
Byzantium. Extend the same five categories through selected regional corridors:
Chinese capitals, canals and river connections; Indian inland markets and coastal
ports; Roman roads, river corridors and shipping. Constantinople joins Anatolia,
the Aegean and the Via Egnatia/Adriatic connection to Italy. This supersedes the
single-terminal treatment of China, India and Europe. Show the geographic reach
of trade without implying one date, one polity or exact imperial boundaries.
Preserve the existing color key, animation, parallel lanes and Lifezones map.

**Pacific story and writing workflow (September 21).** Clicking French Polynesia
moves the North America and South America hexagons to the Pacific-facing joins
of the existing Asia/Pacific piece. Keep the Asia/Pacific and Africa pieces fixed;
use oriented edge matching, not the approximate infinite tiling. The existing
baked terrain travels with each whole hexagon during the transition. In the final
Pacific positions, use fresh terrain lighting for the two Americas pieces at the
same screen-space light azimuth (315°) as the fixed pieces. Rotating the original
baked shadows was superseded by the user’s lighting correction. Reuse the unlit
base colors and rivers; bake the new terrain lighting at 2048 pixels per map
unit and load it as tiled images, without live relief work in default views.
Closing restores the original
arrangement and camera. The temporary arrangement does not change presets. Its root tour URL now
reconstructs it; do not persist a misleading camera-only URL.

Draw the same dotted stroke around the broad Polynesian Triangle, including
Hawaiʻi, Aotearoa New Zealand and Rapa Nui. Include the Hawaiian island chain at
the northern corner; cross the date line along short Pacific arcs. This is a
cultural extent, not a unified empire or surveyed border. Basis: Te Ara,
“Polynesian languages” and “Pacific migrations”. The user's infinite-honeycomb
screenshot is the reference for surrounding Tahiti with ocean.

Tours now animate over 1.25 seconds and fit with 18% more breathing room than
the initial Silk Road focus. All story titles, prose, notes and source links live
in `dist/tour-stories.md`; blank sections for the other locations are writing
space, not invented stories. Reloading reads the Markdown directly.

**Preserve.** Reuse the map projection, maintain pan/zoom and keyboard access,
honor reduced motion, keep markers out of exported map artwork, and expose a
single selection event for future content. The representative coordinates are
implementation choices, not precise historical claims or reviewed boundaries.

**Selected story focus (September 21).** While a tour is selected, hide all other
discovery dots, including their hit targets and keyboard stops. Keep the selected
dot visible when in view; restore the other dots when the tour closes. This
supersedes leaving all markers visible over an active story and its overlays.

Evidence: September 21 feature request. Checks: `tour-marker-tests.mjs` and
`dist/tests/tour-markers.html`, `tour-route-tests.mjs`, and
`dist/tests/tour-story.html` (also `?mobile=1`).

**Dated trade networks and deferred data (September 21).** The user requested a
small period slider, including the Bronze Age copper/tin trading world before
the collapse, and explicitly required that its information load only on opening
the tour. Four snapshots now replace the combined-period trade overview:
c. 1300 BCE, 150 CE, 900 CE and 1300 CE. “Early Middle Ages” and “High Middle
Ages” avoid an ambiguous “low” label. Dates centre broader windows; they do not
claim annual completeness. Each period changes routes, goods and Markdown text.
The northern medieval networks include river/portage links and Golden Horde
steppe exchanges. Preserve commodity colors where categories persist, Pause,
keyboard access and the saved map camera. URL query `period` preserves the
selection without changing the positional map-state schema.

Separate British tin provenance evidence from an uncertain itinerary. Show the
latter more faintly. Explain trade disruption within a multi-causal Bronze Age
crisis, not a proven tin-shortage cause. The user approved adding a proposed
eastern tin corridor from Central Asia/Afghanistan through Iran and Mesopotamia
to the Mediterranean. This supersedes the western-only tin network. Keep both
source branches and every eastern leg explicitly uncertain; regional ancient
mining evidence does not prove Mediterranean exports or relative volumes.
The Bronze Age view covers Mediterranean
and western Asian connections, without inventing a contemporary Silk Road to
China. The research and remaining geographic uncertainty are in the source notes.

Route datasets, migration data, area geometry and story Markdown now load only
on selection (or direct opening of a story URL). Keep renderers independent of
data exports; static re-exports can accidentally undo this. Do not prefetch these
payloads on map startup, hover or idle. Browser resource checks verify zero
historical payload requests before selection and that opening trade does not
load migration/area data. Closing while loading must discard the late result.

**Human migration story (September 21).** The user requested an outward-flowing
migration network inspired by their Wikipedia map. Origin of mankind now opens
a global overview using the existing Silk Road dotted stroke, animated toward
each branch endpoint. Preserve the current net and baked lighting. Keep motion
independent of map redraws, offer Pause/Resume, honor reduced motion, and restore
the original camera on close. The other stories retain their static routes.
The user explicitly reaffirmed that migration belongs on the Lifezones basemap;
opening the story must preserve Lifezones. Diagnostic previews that exercise
other styles must return to Lifezones with the migration visible afterward.

The story text now places these Homo sapiens routes within repeated earlier
dispersals of human relatives from Africa, including Homo erectus. The user
requested this context without adding species layers. Distinguish overlapping
broad corridors from identical routes or a single shared birthplace; the drawn
network remains explicitly Homo sapiens only.

Use current research with explicit uncertainty rather than copying the old
haplogroup tree or its dates. The first overview contains early departures,
Eurasian/Sahul expansion, and later migrations through Beringia and the Americas.
The route coordinates are an editorial schematic; modern shorelines remain.
The user revised the Siberian branch through 58°N, 84°E; 57°N, 104°E;
and 63°N, 123°E to avoid the visual impression of crossing the roughest
terrain. These supersede the earlier intermediate waypoints and remain
illustrative choices, not new historical evidence.
The East African anchor is not a claim of one precise birthplace. Sources,
including 2025 Sahul and 2026 South American research, and unresolved chronology
conflicts are documented in `dist/human-migrations-sources.md`. Descriptions and
the color key stay in the editable `dist/tour-stories.md`.

**Territory and North Atlantic stories (September 21).** The user requested
maximum extents for Egypt, Mesopotamia, India and China, an Amazon drainage basin,
and Norse routes through the North Atlantic. They explicitly selected the
Neo-Assyrian Empire for Mesopotamia. Current editorial choices for the other
imperial tours are Thutmose III, Ashoka’s Mauryan Empire and Qianlong’s Qing;
these period choices and approximate frontier envelopes remain open to refinement.
Do not equate indirect rule, tributary status and uniformly administered territory.

Preserve Lifezones beneath these overlays and the existing story/close/camera
interaction. Show lightly shaded areas with geographic borders clipped through
the real projection; never bridge map cuts or outline artificial patch edges.
The Amazon is the HydroBASINS drainage catchment, not the rainforest or Legal
Amazon, and excludes the separate Tocantins catchment. Norse lines are schematic
sea corridors around southern Iceland and Greenland, combining voyages over time.
Western Norway near Bergen is only a geographic anchor: early settlement voyages
predate the city. All descriptions stay in `dist/tour-stories.md`; provenance and
historical limitations are in `dist/territory-tours-sources.md`.

**Five entry points with dated chapters (September 21).** The user chose to keep
only five discovery dots: Human migrations, Silk Road, Norse voyages, Polynesia and
a new Americas exchange story. The imperial-extent, Amazon-basin and placeholder
dots are retired as entry points and their landing pages removed; the area
renderer, geometry and tests remain. Every story now has the Silk Road chapter
slider with its own heading, four or five dated snapshots, per-chapter Markdown
and the sparse random traffic dots. Two-way traffic is a reversed partner route on
the same signed lane, so both directions stay visible; it marks a range, a contact
zone or documented return sailing, never a claim about every individual.

Human migrations distinguish early hominins, Neanderthals and Denisovans (with
the first Homo sapiens departures), the Homo sapiens expansion and later
movements. Neanderthals and Denisovans are drawn as ranges and admixture as
two-way contact zones; the text says their contribution comes from interbreeding
and that they are not a direct species-level ancestor of everyone. Norse chapters
accumulate active sea lanes from the Northern Isles to the later Bergen trade,
with Vinland, Gaelic, Markland and Thule legs explicitly uncertain. Polynesian
chapters draw settlement one way and interisland voyaging both ways with denser
canoe dots; the South American contact links are hypotheses with uncertain
direction, drawn sparse and faint. The Americas story keeps hypotheses (macaws and
cacao to Chaco, maritime metallurgy, guanín, Amazon–Andes links) fainter than
sourced materials and omits contested turquoise. Evidence lives in the four
sources files. Preserve lazy loading, Pause/Resume, reduced motion, route
clipping at cuts, clean root URLs with `?period=`, camera restore and marker
hiding while a story is open.

**Follow-up corrections (September 21).** Early hominin lines run outward only,
so that chapter reads as expansion rather than exchange. Chapter changes must not
replay the Pacific piece animation; only the story opening moves the net.
Polynesia gained a Pleistocene Near Oceania chapter and the Austronesian, Marianas
and Caroline crossings. The Norse story became a wider Viking expansion in four
chapters with the Iceland–Greenland–Vinland story as its final chapter; the dot
keeps its `/iceland-to-vinland/` URL and is titled “Viking expansion”. The
Americas story gained Amazonian river pottery and greenstone links, drawn
uncertain; no Marajó-to-Inca line is drawn because no evidence was found for it.
Performance budgets (routes, samples, SVG paths, timing, module sizes) are
enforced in `tour-performance-tests.mjs`.

**Passability prototype (September 21).** The user proposed that dots should
find natural courses through terrain instead of straight legs. Decision: relax
routes offline, never at runtime. Hard stops (endpoints and named places) stay
exact; the authored polyline becomes a soft corridor; a least-cost search over a
passability raster (relief, life zones, rivers, coasts) produces three strands per
route with different smooth noise so individual dots appear to jiggle through
valleys and along coasts. The dots remain a CSS dash animation on fixed SVG
paths; no per-frame JavaScript or particle system. After review the user asked
for it on every story: all chapters now use relaxed strands, with per-tour sea
handling (coastal preference, or open sea for Polynesia), a land-bridge override
for Beringia, and named places plus shared junctions as hard stops. The user's
suggestions for sea routes (a current map, historical data, or many hard stops)
are recorded as future options; islands and ports already act as hard stops.
Dots fade at route ends instead of popping. Relaxed strands are visualization,
not evidence of paths, and the raster remains modern geography.

**Unified history timeline (September 21).** The user asked for a “Show history”
checkbox between the style strip and More options that swaps the positioning
toolbox for one scrubber showing every story at once. Agreed stops, cut down
from a ten-stop proposal: at most three for human migrations (Early hominins,
Out of Africa with the Neanderthal/Denisovan context folded in, Ice Age to
farming), then Bronze Age, Antiquity, Middle Ages (c. 950: Baghdad, Vikings,
Chaco, East Polynesia, Vinland), High Middle Ages (c. 1300: Mongols, far
Pacific, Greenland’s last trade), Globalization (c. 1450–1520, the user’s name,
preferred over “Age of Discovery” or “Great Navigations”) and a separate
Plantations & empires stop (c. 1750) for the Atlantic slave trade and
colonization rather than merging them into Globalization. The timeline ends
there; later mass migrations are out of scope. Only one stop is drawn at a time,
so adding stops does not add screen density or startup cost. Each chapter maps
to exactly one stop (tested); reading points are the existing story dots for
now, opening at the stop’s chapter. Stop dates are editorial; Silk Road
snapshots are treated as ±150-year windows when assigned.

**Overnight rules (September 21).** Stories and the timeline are available on
the Spaceship Earth and Felv arrangements in any view except political and
distortion analysis; custom maps have none. On Spaceship Earth, whenever a
timeline stop concerns the Pacific (any Polynesian chapter) the pieces switch
to the Pacific-facing arrangement and return afterwards. **Superseded on
September 22** by the endless band: the user observed that translation-only moves
form a loop, and computation confirmed that the four pieces at fixed rotations
repeat exactly along one period with no new artwork. Decision: no new plates,
ever; translate what can be translated and accept out-of-order pieces where the
pattern cannot close. A first build tiled the whole plane with copies; the user
rejected that on sight ("don't create a forever overlap, just move the
hexagons": the Infinite Honeycomb already repeats). Decision: Spaceship Earth
always shows exactly four pieces, and as the user pans each piece slides by
whole periods to stay contiguous around the viewport centre, visibly, tweened in
place with hysteresis and, at the user's request, faster with a little elastic
overshoot. Up-and-down panning uses a second band: with the two American pieces
rotated as in the Polynesian view the pieces translate vertically, so the pan
direction switches between the diagonal and vertical bands and the rotation is
the only non-translation move (relit artwork for Lifezones). The user noticed
pieces springing back toward the origin on a switch; the new arrangement is now
anchored on Asia/Pacific's current slot so slid periods are never discarded. Exports use the
base positions; the Pacific and Africa piece moves are
retired from the app (kept as tested geometry). Only the South Atlantic join is
unavailable this way, so Atlantic slave-trade lanes still cross a cut. Content passes added two
stories to fill the thin stops: African networks (trans-Saharan, Nile, Swahili
and Atlantic trades, with enslaved people as a named wave) and Ocean crossings
(Ming and monsoon trade, Iberian routes, galleons and companies), plus wider
Bronze Age and Antiquity lanes on the Silk Road. Per the user, these draw
overall trends, never individual journeys: Mansa Musa and Zheng He are evidence
for corridors, not lines of their own. Performance budgets were re-run at the end.

**One slider in history (September 22).** The user disliked the story card's
period slider appearing inside history mode ("a slider inside a slider"). In
history mode the scrubber alone drives the moving dots; all stories stay visible
at a glance, and a dot or chip only frames that story's chapter and shows its
text. The card's own slider remains for stories opened outside history mode.

**Backdrop grid and pan bound (September 22).** The user asked for a very
subtle large hexagonal grid in the empty space around Spaceship Earth, with its
own options at the end of Overlays, and for the map never to be draggable fully
out of view, returning elastically so a sliver stays visible. Both are default
behaviour; the grid keys are appended to the positional map-state lists.

**History folder (September 22).** Reviewing the general flow map, the user
asked for the scrubber to show approximate dates, for spots to move with the
period (Vikings on Norway in 1000 CE, on Vinland in 1400), and for texts and
routes to become very accessible data: a folder with one Markdown per period
(all texts, spot and zoom localisation) and JSON routes, consistent colours across
ages. Decisions, confirmed by the user: JSON for routes with a detail `zoom` field
so some routes appear only when zoomed in; relaxed strands as a generated sidecar
stamped with a hash of the routes ("I trust you"); all texts derived from the
period Markdown, since the separate story pages were testing artifacts, so a
story URL now simply opens the timeline focused on that story. The old story
modules, chapter registry, inner story slider, pause button, area overlays in
the app and the `?period=` chapter URLs were removed; area geometry stays as
tested code. Wave colours moved from the stylesheet to `waves.json`.

**Dance anchored on the centre (September 22).** The user saw a small drag down,
made only to see an arrangement better, re-form the group and move the pieces in
front of them away. Decision: a band switch needs a deliberate pan (40% of the
other band's period on screen, never under 120 px), and the piece nearest
the viewport centre is the anchor that keeps its place while the others re-form
around it.

Evidence: September 21 feature request and confirmation. Checks:
`history-tests.mjs`, `tour-marker-tests.mjs`, `tour-page-tests.mjs`,
`/tests/tour-history.html`, `/tests/tour-pages.html`.

**Shareable tours (September 21).** The user requested a root URL and an OG image
for every implemented tour. Use stable location IDs as root paths, with static
HTML metadata so social crawlers need not execute the app. Each link opens the
Lifezones story and its routes/areas directly, including Polynesia’s special net
and lighting. The nine current stories get distinct 1200×630 images rendered
from actual map artwork. Placeholder dots do not acquire empty story pages.

Clicking a dot adds a history entry. Back/Forward changes the selected tour;
closing restores the original map camera. A direct-entry tour closes to the
Lifezones map, and reloading an in-app tour retains its return camera. Keep tour
URLs clean during pan/zoom. This supersedes the earlier restriction against
persisting tour selection, without changing the compact map-state schema.

Images retain the existing R2 hosting architecture and need a separate, immutable
additive release. The upload is currently awaiting explicit approval following
an automatic approval-review rejection; all images and pages exist locally.
Production preparation must fail clearly until the public image inventory has
been uploaded and verified, rather than publish broken OG links. This change
does not authorize publishing the website.

## Maintaining this record

When a decision changes, update its section with the new reason and identify what
it supersedes. Keep detailed parameter values in code and technical mechanics in
README. Add a regression check when a mistaken interpretation could recur.
Distinguish accepted design, current implementation limits, and untested ideas.
Do not copy personal chat material, credentials, full saved URLs, or transcripts.

Source tasks consulted (titles as returned by the task archive):

- “Run the server so I can see the app” — `01a0881c-2669-7421-afac-7f15a2476e26`
- “Diagnose map rendering bugs” — `01a0894e-afd2-73c2-8777-5ce532401459`
- “Add About page globe widget” — `01a0977e-b170-7273-a35d-972e9910421f`
- “Review About page copy” — `01a09af2-37af-7950-8388-30fa8fdb27eb`
- “Add puzzle overlay option” — this task, `01a09f34-0900-7953-b6f7-2faa9d576f9c`

“Install GoatCounter” was inspected, but the retrieved recent turns lacked message
text; analytics intent was not reconstructed from those empty records. This review
excluded unrelated conversations. Revisit the original task when a narrower or
uncertain decision needs more context.
