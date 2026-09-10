# Hexagon World code audit — September 10, 2026

The reported problems have concrete causes. The most serious is an interface refactor that deletes DOM elements while the renderer and event handlers continue to require them. There are also avoidable CPU costs and an unbounded raster cache. The underlying arrangement geometry passed the existing tests before and after these repairs.

This audit includes local fixes, automated regression coverage, and browser verification. It preserves the pre-existing uncommitted work. It does not establish that every possible setting combination or device is bug-free.

## Confirmed issues and repairs

| Priority | Finding | Repair |
| --- | --- | --- |
| High | `installFloatingShell()` removed `#view-title`, `#status`, and `.badge`; `rebuild()` and `render()` dereferenced them afterward. A format click could change some state, then throw before updating the mesh. Error reporting could itself throw. | Removed obsolete title/badge updates and retained status in the control column. Restored access to the research button that was also being removed. |
| High | `riverMasks` retained a 4,320 × 2,160 canvas for every width/level combination. All 132 combinations could retain about 4.6 GiB of raw pixel buffers, excluding GPU storage. Concurrent requests could also duplicate the river download. | Reuse one canvas; share the pending download; debounce slider rasterization; skip hidden rivers and unchanged GPU uploads. |
| Medium | Format presets restored absolute pan/scale values saved for an older page layout. The map could be partly behind the floating column or outside a small viewport. | Fit each chosen format into the currently available map area. Apply its render-quality setting to the canvas as well as the control. |
| Medium | Format icons used arbitrary center coordinates and a fixed hex orientation, producing gaps/overlaps and inaccurate silhouettes. | Derive the icons from the same geometry and rotation as the formats, including Felv's cut pieces. Infinite mode shows a larger repeating honeycomb sample. |
| Medium | Styles only assigned some controls. Atlas ink omitted surface treatment, allowing Life zones' land-cutout mode to survive the switch. | Apply complete relief defaults plus the style's lighting preset, and set treatment/tone/river defaults explicitly. Selection feedback follows the actual controls. |
| Medium | Small subgrid hexagons ignored `cell.center`, so every child was drawn concentrically. Dot opacity also disagreed with the UI. | Apply each child center, cache the fixed hierarchy, and use the documented 20% dot opacity. |
| Medium | Felv and Fuller repeatedly searched arrangement candidates and recalculated spherical edge matches on the main thread. Region labels repeated the full border-label lookup for each edge, tile, and frame. | Cache spherical pairings and labels; precompute arrangement contacts; reuse arrangements for unchanged geometry. Preserve the existing arrangement assignments. |
| Medium | Ecology coloring searched land-class groups for each pixel of a multi-megapixel image. | Precompute the class-to-color lookup, with parity checks across all supported class counts and invalid values. |
| Medium | Saved panel state was restored before the panels were moved/created, then overwritten by code collapsing every panel. | Complete the interface structure first, then restore settings and attach persistence listeners. |
| Medium | Below 600 px, the floating column occupied nearly the entire screen and covered the map controls. | Bound the column to 42% of viewport height and retain pan/rotate controls in the remaining map area. |
| Low | Export styles referenced undefined CSS variables. Retired preset-dialog styles and obsolete preset data remained. | Define the required tokens and remove confirmed unused preset styles, preset viewport data, imports, and an unused clipping helper. |

## Measured improvements

Local Node measurements on this machine; arrangement figures average five runs. These are CPU timings for the named operation, not whole-app frame rates.

| Operation | Before | After |
| --- | ---: | ---: |
| Fuller arrangement search | 118.44 ms | 2.79 ms |
| Felv arrangement construction | 124.42 ms | 5.39 ms |
| Ecology coloring, synthetic 4,320 × 2,160 RGBA input, 15 classes | 390.65 ms | 47.77 ms |

A direct comparison confirmed identical region IDs, rotations, and positions for every named arrangement across all four projection methods. The infinite pattern itself was not replaced.

## Infinite mode: limitation versus bug

The periodic tiling is deterministic and viewport bounded. Existing independent tests verify full coverage, stable assignments after panning, opacity, and the exact mismatch flags for all four projection methods. Local browser checks also confirmed rendering after zoom and panning.

Some spherical boundaries cannot meet consistently at the three-way junctions of a planar honeycomb. Red discontinuities mark those incompatible joins; they are a documented limitation of this construction. Removing the red marks would conceal the discontinuities, not make the projection seamless.

The crashes and expensive repeated label calculations affected infinite mode too. Dense overlays and relief remain more expensive there because many copies may be visible at once.

## Remaining architectural and performance debt

- `app.mjs` still mixes DOM construction, state changes, persistence, input gestures, asset loading, and rendering. State is divided between the `state` object and live form controls. A useful next refactor is to separate state/preset application from rendering and build the final interface structure directly, using the new interaction tests to protect behavior.
- Much of the JavaScript and CSS is compressed into very long lines, and older layout rules are overridden later. Formatting and consolidating those rules would make future changes easier to review. A wholesale rewrite was not needed for these repairs.
- Relief still loads a large elevation set and performs multiple GPU passes. Dense Tissot overlays compute derivatives separately for each visible tile on every draw. Those are remaining performance candidates; neither has a cross-device frame-rate guarantee. Adaptive elevation detail and cached per-region overlay geometry merit a separate profiling pass.
- `optimizer-worker.mjs` is no longer referenced by the live interface. It does not account for live rendering lag because it is not loaded. The optimizer and clearance modules still support offline search generation/tests, and `globe-drag.mjs` imports the optimizer's rotation helper. They should not be indiscriminately deleted as “unused.”
- The README's older search section describes a live cancellable worker search, whereas the current UI selects precomputed results from `search-presets.mjs`. That documentation needs a separate reconciliation with the intended search feature.

## Verification

- `npm test`: all existing geometry, optimizer, tiling, map-layer, arrangement, globe-drag, and relief tests pass, plus `audit-tests.mjs`.
- New `/tests/app-controls.html`: 18 browser checks pass. Covers all five formats and six styles, rapid switching, treatment reset, nonempty rendering and WebGL errors, zoom, expanded-panel restoration after reload, mobile map access, and PNG encoding.
- Existing `/tests/relief-render.html`: all GPU checks pass, including exterior panel shadows, reversed light direction, terrain self-shadowing, zero-height behavior, pan consistency, and PNG encoding.
- Manual browser check: infinite-map panning updates the view without gaps. No new application console errors were observed during the successful checks.

Browser checks used the local Codex browser on this machine. Full export-download flows, network-failure scenarios, sustained frame-rate profiling, and other browsers/devices are not comprehensively covered by this audit.

## Subsequent controls update

The follow-up request replaced the approximate Tissot ellipse renderer with geographic-circle projection and background path preparation, flattened all settings sections, saved panel states by ID, simplified distortion to a combined toggle with opacity, set Flower World to 60°, and made zero border weight hide red marks as well as ordinary outlines. The earlier descriptions above record the initial audit; the per-frame Tissot derivative loop and runtime sidebar reparenting have now been removed. Browser regression coverage expanded from 18 to 24 checks.

## Curated styles update

Six user-supplied looks now have actual rendered thumbnails and complete style settings. Style application preserves geography and viewport, while format application preserves styling. Elevation resets sea level, Political includes graticules, and Lifezones substitutes the subgrid for dots. The infinite icon now uses 37 hexagons. Obsolete synthetic thumbnail CSS and unused style fields in format presets were removed.

Lifezones colors are sampled in sixth-generation Gosper-aligned hex cells; native land and ocean-temperature resolution remain 0.5° and 1° respectively. Rivers and elevation keep their original sampling. All four projections passed local GPU rendering checks; visual inspection at 931% zoom confirmed hexagonal color boundaries. The full Node suite and all 26 browser control checks passed, as did the relief GPU checks. The README now describes the current precomputed orientation controls.
