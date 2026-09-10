# Hex Atlas

A dependency-free WebGL app using the supplied 4320 × 2160 equirectangular continent texture.

Run `npm start`, then open http://localhost:4173. Run `npm test` for geometry and regression validation.

See [AUDIT.md](AUDIT.md) for the September 2026 diagnosis, repairs, performance measurements, and remaining debt. Browser interaction checks are available at `/tests/app-controls.html`; relief GPU checks are at `/tests/relief-render.html`.

## Implemented

- Tetrahedral faces expanded into regular hexagons through their alternating vertices and edge midpoints.
- Four octahedral faces plus the three centroid-divided neighboring face pieces per hexagon.
- Twelve rhombic dodecahedron faces partitioned into four groups of three rhombi.
- Tetrakis hexahedron with configurable pyramid tip distance (cube half-edge = 1).
- 81 valid connected layouts for each construction, built by matching oriented spherical edges and rejecting overlaps or incompatible contacts.
- Global longitude, latitude and roll; central projection or normalized vertex interpolation; triangle barycentric shape bias.
- Canvas pan, cursor-centered zoom, globe rotation, touch pinch zoom, fitting, graticules, construction lines, edge labels, palettes and PNG export.

The supplied name “rhombic icosahedron” is interpreted as **rhombic dodecahedron** because the requested solid has 12 rhombic faces.

## Geometry and limitations

All four regions collectively cover the sphere exactly once. Hexagons remain flat. Exposed boundaries are cuts, and matching lowercase labels identify their paired edges. Every physically joined edge matches. The display now extends the selected net into an infinite repeating honeycomb. All tiles are fully opaque, and only mismatched edges are red. This does not claim a seamless infinite honeycomb. Degree-two spherical junctions prevent all degree-three planar honeycomb vertices from preserving the boundary identifications.

Default central projection uses actual planar polyhedral coordinates. The normalized vertex option and shape bias are custom continuous interpolation controls, not published conformal/equal-area implementations. No area-preservation claim is made. Tetrakis at tip distance 2 converges to the rhombic dodecahedron geometry. No pentagonal geometry is present.

The tests check spherical area, all paired borders at 101 samples, and all contacts in every generated layout. Relief rendering has a separate browser GPU regression page at `/tests/relief-render.html`.

## Primary literature

- Alex Van de Sande, *Gosper World: A Hexagonal Map Using Gosper Fractals*, Bridges 2024, pp. 507–510. https://archive.bridgesmathart.org/2024/bridges2024-507.pdf
- Jacob Rus, *Flowsnake Earth*, Bridges 2017, pp. 237–244. https://archive.bridgesmathart.org/2017/bridges2017-237.pdf
- B. J. S. Cahill's original writings, collected by Gene Keyes: https://www.genekeyes.com/B.J.S._CAHILL_RESOURCE.html

The app uses the polyhedral constructions as a basis, and does not implement Gosper fractal boundaries or Cahill's conformal projection formula.

## Continent-cut search

Enable **Minimize land on edges** beneath the orientation sliders to apply precomputed globe rotations. The supplied silhouette is thresholded at grayscale 128 (dark = land), and only the chosen finite arrangement's exposed outer boundary is scored. The clearance slider selects among ten rotations prepared for distances from 0° to 9°. Infinite tiling has no outer boundary, so this control is unavailable there.

The offline preparation script explores 1,500 initial rotations per distance, refines candidates, and validates the result. These are heuristic results, not certified global minima. Selecting a result also restores the projection bias, interpolation, and tetrakis height used to compute it. Adjusting orientation or projection controls manually leaves the preset mode.

## Infinite display

A periodic axial hex grid preserves the selected four-region net as anchors, fills the remaining cells with matching neighbors where possible, then improves the number of compatible joins. It is a heuristic arrangement, not an optimality claim. Every edge is subsequently checked against its actual spherical boundary pairing. Both sides of every incompatible join are flagged; all tiles remain fully opaque.

Only viewport tiles and a surrounding margin are uploaded to the GPU. Panning regenerates visible copies of the same deterministic pattern without accumulating tiles or changing earlier assignments. Border weight zero hides both ordinary outlines and red mismatch markings; it does not change the underlying spherical joins or relief seam guards. Export includes the current repeated view and its conflict markings. The continent optimizer still measures the 12 unique spherical edge pairs, independently of repeated copies.

## Hex subgrid

The optional 49× density overlay uses two generations of the Gosper seven-hex substitution. Each generation scales by `1/sqrt(7)` and alternates the ±`atan(sqrt(3)/5)` turn, so the 49 smallest hexagons return to the parent orientation. The hierarchy is generated independently inside every visible large hexagon and stays fixed to map coordinates during pan/zoom; it is included in PNG exports.

The independent Dot grid option draws seven white dots at the centers of the next-generation children inside each of the 49 small hexagons, at 20% opacity. This gives 343 dots per large hexagon. Dots follow pan, zoom and grid rotation, can be displayed without subgrid lines, and are included in PNG exports.

## Shareable map URLs

Controls, selected projection and layout, globe/grid rotations, search settings, grid overlays, palette, quality, interaction mode, expanded panels, and the pan/zoom view are encoded into a compact URL hash beginning with `#m=`. The URL updates as the map changes, so copying the address shares the complete map state. Malformed or unavailable map links fall back safely to defaults. Active searches are not resumed after a reload.

## Distortion colors

The optional combined distortion overlay estimates the local inverse-projection Jacobian with GPU derivatives. Area inflation is (4π / total planar area) divided by the spherical area Jacobian, giving an average-scale reference independent of zoom. Blue/white/amber marks ¼×/1×/4× relative map area (log scale, saturated beyond endpoints). Angular distortion is 2 asin((a−b)/(a+b)), using the principal stretches of the Jacobian; white/purple marks 0°/90° (saturated above 90°). The overlay blends purple over area colors and is qualitative. A checkbox enables the combined view and an opacity slider controls its strength.

These are per-fragment numerical estimates of smooth patch interiors, not seam distortion measurements or geographic region averages. They depend on interpolation and shape bias, and are independent of globe rotation. Overlay opacity and enabled state persist with other settings. Legacy area/angular/both links enable the combined view. WebGL derivative support is required; unsupported browsers retain the normal map. Reference: https://proj.org/en/stable/development/reference/datatypes.html#c.PJ_FACTORS

## Additional map layers

The map source menu includes the supplied continent mask, the supplied Blue Marble image, the supplied terrain image, generated Ivory and Elevation finishes, Natural Earth Admin 0 country boundaries, and an ecology mode. Ecology is rendered from a compact derived RGB asset: the red channel stores Leemans Holdridge classes, green stores four Natural Earth/SRTM Plus depth bins, and blue stores three NOAA OISST 1991–2020 temperature bins. Land and ocean legends can each be grouped into 3, 6, 10, or 15 classes. Antarctica's unclassified polar source pixels are assigned to the polar class. `maps/sources.json` records the source versions, class definitions, processing and limitations.

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

The interactive horizon scan starts at two-pixel intervals and refines to single-pixel intervals after interaction stops; PNG export requests the refined pass and renders at 2× by default. The export menu also offers 3× and 4×, with a roughly 12-megapixel cap and device texture limits. Interactive relief buffers remain bounded to three million pixels. The supplied height image has only 256 original levels, so extreme exaggeration/deep zoom may reveal terracing. Local ambient shading and shadow softness are artistic approximations, not path-traced global illumination. The camera remains directly overhead; vertical panel sides are not visible from this angle.

Graticules and distortion colors are composited after relief so they stay readable on each finish. Region labels, construction lines, and hex overlays remain cartographic annotations. Export includes the table, exterior shadows, surface, and annotations.

`npm test` covers relief parameter invariants, map-state compatibility, and the grayscale tile dimensions. Open `/tests/relief-render.html` with the server running to execute pixel-based GPU checks for external panel shadows, reversed light direction, terrain self-shadowing, zero-height behavior, pan consistency, shader errors, and PNG encoding.

## Settings organization

All collapsible sections are siblings: Projection method, Layout & grids, Globe orientation, Map source & colors, Rivers, Relief & lighting, and Distortion & Tissot. Panel states are saved by stable IDs; older positional panel states are migrated on load. Flower World presets use a 60° grid rotation.

## Curated styles and hexagonal Lifezones

The style panel contains Lifezones, Satellite, Elevation, Political, Gray neutral, and Ivory, with thumbnails rendered from their actual settings. Styles restore their complete lighting, material, river, and overlay settings without changing the projection, format, orientation, interaction mode, or viewport. Format buttons likewise preserve the selected styling. Elevation resets sea level to 105; Political uses a dark blue background with no graticules or dot grid; Lifezones uses the hex subgrid without dots. The Infinite honeycomb icon contains 37 hexagons, compared with Flower World's seven.

Lifezones' 1,440 × 720 encoded image contains land classifications from a 0.5° source and ocean temperature zones from a 1° source. Upscaling cannot add classification detail. The display samples those classes at hexagonal cell centers, using the sixth generation of the same Gosper grid as the subgrid (radius 1/343 of a parent hexagon). This is the first even generation whose nominal spherical cell diameter fits the land source resolution. The cells stay aligned with the map during pan, zoom, and grid rotation, and use the current projection to sample geography. Relief and rivers retain their original sampling detail. This changes the visible pixel shape, not the information in the source data.

To refresh thumbnails, run `python3 scripts/save-style-thumbnails.py` alongside the app and open `/tests/style-thumbnails.html?save=1`. It renders all six styles with a common map view and saves 480 × 272 PNGs locally. Stop the thumbnail writer afterward.

Runtime assets are included under `dist/`. The original downloaded inputs under `data/` are retained locally and ignored by Git; the offline preparation scripts use them to regenerate the derived assets. Source attribution and processing details are recorded in `dist/maps/sources.json` and `dist/maps/height/manifest.json`.

The **Background color** picker in **Map source & colors** sets the full map workspace and the ground beneath relief shadows. It persists in shared URLs and PNG exports, and remains independent of format selections. Styles can explicitly include a background color; Political uses #2b4b5f. Gray neutral uses #a2bac1, a white dot grid, and zero border weight.

New maps start with **Lifezones + Spaceship Earth**. Formats are ordered Spaceship Earth, Felv, Flower World, 4Hexes, Infinite Honeycomb; styles are ordered Lifezones, Satellite, Elevation, Political, Gray neutral, Ivory. Saved URLs retain their chosen settings.

## Compact controls and masthead

The initial interface has a floating bottom-left controller: two horizontal thumbnail strips and Customize. Customize expands the existing controls without duplicating form state; the collapse button returns to the compact controller. The selected controller mode is stored in shared links. Thumbnail buttons retain accessible names and native hover titles when their visible labels are hidden.

The masthead reads “Hexagonal World” in Baskerville Italic, with the uppercase subtitle set in Gotham Bold when installed (Avenir Next/Arial fallback). It aligns with the compact controller and moves right of the expanded column. Pan, zoom, and layout changes check the actual convex map pieces against the title rectangle; the title fades out on overlap and returns when the rectangle clears. Infinite maps always occupy it. When it is covered or cannot fit on screen, the expanded column shows the title above the introductory copy. Heading contrast follows the background color; reduced-motion preferences disable the fade.
