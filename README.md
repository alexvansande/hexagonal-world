# Hexagonal World

A dependency-free WebGL app using the supplied 4320 × 2160 equirectangular continent texture.

Run `npm start`, then open http://localhost:4173. Run `npm test` for geometry and regression validation.

## License

The project code is licensed under the [MIT License](LICENSE).
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

## Settings organization

All collapsible sections are siblings: Projection method, Layout & grids, Globe orientation, Map source & colors, Rivers, Relief & lighting, and Distortion & Tissot. Panel states are saved by stable IDs; older positional panel states are migrated on load. Flower World presets use a 60° grid rotation.

## Curated styles and hexagonal Lifezones

The style panel contains Lifezones, Satellite, Elevation, Political, Topographic, Gray neutral, Ivory, and Distortion Analysis, with thumbnails rendered from their actual settings. Styles restore their complete lighting, material, river, and overlay settings without changing the projection, format, orientation, interaction mode, or viewport. Format buttons likewise preserve the selected styling. Elevation resets sea level to 105; Political uses a dark blue background with no graticules or dot grid; Lifezones uses a light gray hex subgrid at 0.2× thickness, white dots, and a #ebebeb background. The Infinite honeycomb icon contains 37 hexagons, compared with Flower World's seven.

Lifezones' 1,440 × 720 encoded image contains land classifications from a 0.5° source and ocean temperature zones from a 1° source. Upscaling cannot add classification detail. The display samples those classes at hexagonal cell centers, using the sixth generation of the same Gosper grid as the subgrid (radius 1/343 of a parent hexagon). This is the first even generation whose nominal spherical cell diameter fits the land source resolution. The cells stay aligned with the map during pan, zoom, and grid rotation, and use the current projection to sample geography. Relief and rivers retain their original sampling detail. This changes the visible pixel shape, not the information in the source data.

To refresh thumbnails, run `python3 scripts/save-style-thumbnails.py` alongside the app and open `/tests/style-thumbnails.html?save=1`. It renders all eight styles with a common map view and saves 480 × 272 PNGs locally. Stop the thumbnail writer afterward.

Runtime assets are included under `dist/`. The original downloaded inputs under `data/` are retained locally and ignored by Git; the offline preparation scripts use them to regenerate the derived assets. Source attribution and processing details are recorded in `dist/maps/sources.json` and `dist/maps/height/manifest.json`.

The **Background color** picker in **Map source & colors** sets the full map workspace and the ground beneath relief shadows. It persists in shared URLs and PNG exports, and remains independent of format selections. Styles can explicitly include a background color; Political uses #2b4b5f. Gray neutral uses #a2bac1, a white dot grid, and zero border weight.

New maps start with **Lifezones + Spaceship Earth**. Formats are ordered Spaceship Earth, Felv, Flower World, Gosper Fractal, 4Hexes, Infinite Honeycomb, Rus One, Rus Two; styles are ordered Lifezones, Satellite, Elevation, Political, Topographic, Gray neutral, Ivory, Distortion Analysis. Saved URLs retain their chosen settings.

## Compact controls and masthead

The initial interface has a floating bottom-left controller: two horizontal thumbnail strips and Customize. Customize expands the existing controls without duplicating form state; the collapse button returns to the compact controller. The selected controller mode is stored in shared links. Thumbnail buttons retain accessible names and native hover titles when their visible labels are hidden.

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
