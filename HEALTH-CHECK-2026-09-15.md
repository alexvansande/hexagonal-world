# Performance and Firefox health check

September 15, 2026. The diagnosis below records the original state. The
implementation follow-up at the end records the subsequently authorized fixes.
Existing uncommitted work was preserved; nothing has been published.

## Summary

The strongest explanation for the reported startup freeze is the large shared
graphics shader. A cold Chrome run froze the main thread for 8.4 seconds. Firefox
also failed to finish loading the original renderer, including a run without
profiling hooks. Temporarily excluding the bridge shader family in an isolated
test browser allowed the default map to load in both browsers.

Default memory demand is also substantial, especially the global river raster
and lighting preparation. Separately, a temporary surface-download failure can
leave the map missing indefinitely without a visible error or retry.

These findings fit the reports, but do not prove the exact cause on the reporters'
computers. The screenshot establishes a first-load Chrome freeze; it does not
identify hardware, browser version, URL, or a Firefox error message.

## 1. High: the default map compiles expensive live shader paths

Locations: `dist/app.mjs:68`, `dist/app.mjs:117`,
`dist/ecology-grid.mjs:128`, `dist/relief.mjs:238`.

The main fragment shader is about 30,700 characters and includes all bridge
experiments, geographic projection paths, live coloring, and overlays. Even when
the base map uses precomputed tiles, these paths remain in the compiled program;
runtime uniform conditions do not remove the cost of preparing that program.
The bridge family repeatedly invokes projection/sampling code. One experimental
branch also contains a 19-by-19 color-comparison loop.

Measured in Chrome at 1440 × 1000 CSS pixels, device pixel ratio 2:

| Diagnostic case | Longest main-thread task | Longest graphics error query |
| --- | ---: | ---: |
| Original shader, cold shader-cache test | 8,404 ms | 8,245 ms |
| Original shader, subsequent normal run | 178 ms | 19 ms |
| Bridge family omitted in temporary test shader | 302 ms | 119 ms |

The original cold run also spent 230 ms waiting for program linking. The
8-second wait occurs at the elevation upload's `gl.getError()`, which synchronizes
with preceding GPU work. Its location does **not** mean the elevation upload alone
caused the delay. The controlled shader isolation strongly implicates preparing
or executing the shared program for its first draws. Native driver profiling
would be needed to divide that wait precisely between compilation and execution.

### Firefox reproduction

- Used an isolated Playwright Firefox 146.0.1 build on this Apple Silicon Mac.
- Original instrumented startup remained unresponsive beyond 90 seconds.
- An independent original-code run without profiling hooks still had no completed
  map at the external 25-second deadline.
- The temporary test with the bridge family omitted loaded all 68 required tiles
  and lighting, with no application exceptions or WebGL error. Total harness time
  was 3.4 seconds, including a deliberate one-second observation period.
- Inspected the resulting Firefox screenshot beside the original Chrome result;
  both showed the complete default map, rivers, lighting, and controls.
- Independent Firefox checks confirmed working WebGL, bitmap resizing, and the
  unbound `createImageBitmap` promise callback; those were not the failure here.
- A narrower isolation retaining the other bridge paths but omitting only the
  old mode-4 function still blocked at `gl.getError()` for 88,549 ms, eventually
  completing at about 91 seconds. Removing that single experiment is insufficient;
  the evidence implicates the broader bridge/projection program.

This establishes a reproducible Firefox problem in the tested build and graphics
environment, not a claim that every Firefox release or GPU fails. The temporary
shader substitution is a diagnostic experiment, not a finished patch: live
customized maps must retain their accepted bridge appearance.

**Recommended direction:** compile a small program for precomputed surfaces;
prepare specialized live programs only when needed. Keep legacy experimental
bridge modes out of the default program, and retain the accepted mode in its own
live variant. Use nonblocking shader completion where supported and avoid making
startup wait on unnecessary synchronous graphics queries. Do not just remove the
error check and leave the expensive work unchanged. Mozilla's
[WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
documents the blocking-query and shader-compilation concerns.

## 2. High: default rivers and lighting carry a large memory cost

Locations: `dist/river-layers.mjs:12`, `dist/map-layers.mjs:142`,
`dist/app.mjs:644`, `dist/app.mjs:396`, `dist/relief.mjs:268`.

The selected desktop river level is always decoded at 4320 × 2160. Its retained
raw data consists of approximately:

| Storage | Raw size |
| --- | ---: |
| Distance and width arrays | 17.8 MiB |
| Painted RGBA array | 35.6 MiB |
| River canvas pixel surface | 35.6 MiB |
| Uploaded RGBA texture | 35.6 MiB |
| Combined nominal footprint | **124.6 MiB** |

Decoding additionally creates temporary bitmap and RGBA readback buffers. This is
bounded storage, not the old unbounded width/level cache leak, but it is still
heavy for an initial fitted map. CPU profiling attributed about 50 ms to reading
the river field and 31 ms to painting it in a subsequent normal run.

Across the measured default startup runs, requested WebGL texture storage peaked
around **159–164 MiB**, settling near **98 MiB** in one completed run. The river
texture is already included in those figures; do not add it twice. These are
instrumented raw texture-size estimates, not process-memory measurements. They
exclude canvas backing buffers, antialiasing/depth storage, CPU image arrays,
shader compiler memory, browser overhead, and driver-specific expansion.

Lighting preparation allocates up to five intermediate textures, then retains two
lighting snapshots and a screen-copy texture. The intermediate targets are already
released after baking, and the lighting cache is bounded to three entries.

**Recommended direction:** use a tiled or resolution-adaptive river representation;
consider sampling distance/width directly in the shader to avoid painting and
retaining a full RGBA copy. Prepare lower-resolution interactive lighting first,
then refine it. Preserve fine detail for zoom and exports. Budget the combined
rendering system in bytes instead of considering the tile cache in isolation.

## 3. Medium: failed surface loads stay failed until reload

Locations: `dist/precomputed-surfaces.mjs:28`,
`dist/precomputed-surfaces.mjs:42`, `dist/precomputed-surfaces.mjs:55`,
`dist/app.mjs:302`.

The surface loader records failures permanently in a Set, suppresses the cause,
and refuses to request the same keys again. The draw path still reports itself as
precomputed, so there is no automatic live fallback or visible loading error.

Confirmed with an isolated network-failure test: returned temporary HTTP 503 for
initial surface images, then restored normal responses and clicked Zoom In.
The app remained at zero surface tiles, 20 failures, zero pending requests, and
empty error/loading messages. No retry occurred. A narrower overview-only failure
test likewise retained failed keys after the connection was restored.

**Recommended direction:** bounded retries with backoff, an explicit retry action,
visible partial-load status, and a usable fallback when overview tiles fail.

## 4. Medium: device limits are applied unevenly

Locations: `dist/app.mjs:65`, `dist/app.mjs:178`, `dist/app.mjs:644`,
`dist/device-profile.mjs:2`, `dist/projected-lighting.mjs:38`.

The desktop viewport has a pixel-ratio cap but no total pixel budget. The app
maintains a WebGL canvas, a 2D overlay, and a screen-copy texture, with antialiasing
and preserved drawing buffers enabled. Large display dimensions multiply all of
these costs. Device classification is based on viewport dimensions, so a weaker
laptop can receive the full desktop pipeline.

The main map source checks `MAX_TEXTURE_SIZE`; the 4320-pixel-wide river upload
does not. A GPU limited to 4096 cannot accept that upload. This is a confirmed
code-path omission, but was not reproduced on physical 4096-limited hardware.

**Recommended direction:** apply texture-limit checks consistently, cap total
interactive canvas pixels, and adapt quality to measured performance/resource
limits. Evaluate whether preserved buffers and antialiasing are necessary for
every interactive frame while keeping exports intact.

## What looks healthy

- The complete existing `npm test` suite passed.
- Existing surface stability checks passed at 1920 × 1200 and 2560 × 1440,
  both at 2× pixel ratio: stable redraws, no repeated initial image downloads,
  bounded cache, completed requests, Zoom and Fit.
- Default settled view used 68 cached surface tiles; the texture limit remains 120.
- The normal map renderer schedules redraws on demand; no continuous default-map
  redraw loop was identified.
- Arrangement, puzzle, surface mesh, image, river-field, and lighting caches are
  either bounded or cleared for their corresponding state changes. The previous
  audit's unbounded river-mask cache should not be reported as an existing leak.
- Fine elevation tiles are export-only and released afterward.

## Scope and next verification

The public homepage was reachable during this check. Its bridge shader and relief
module matched the local files byte for byte; the deployed app has the same
implicated startup path. Local palette experiments are additional uncommitted
work and were not enabled for these measurements. No DNS failure was reproduced;
this does not establish availability from every reporter's network.

Tested Chrome 152 and Playwright Firefox 146 on this Mac, principally the default
Lifezones / Spaceship Earth view. Timing is local, instrumented, and affected by
driver caches. It is not a cross-device benchmark. Physical low-memory phones,
Windows/Linux GPUs, current Firefox release/ESR combinations, long customization
sessions, and large exports still need coverage.

Recommended implementation order: (1) shader separation and Firefox startup,
(2) river/lighting memory budgets, (3) load recovery, (4) consistent device limits.
Add real-browser cold-start and failed-download tests alongside the current
geometry and source-level suite. A fix must preserve preset appearance, live
customization, saved links, and exports.


## Implementation follow-up

The user subsequently authorized performance fixes, with pre-rendered defaults,
progressive loading, and preservation of the map design.

### Implemented locally

- All 64 default combinations select pre-rendered PNG bases and lighting. The
  image program has a 435-character fragment shader. Default opening does not
  compile the live ecology shader, download global rivers/elevation, or create
  terrain-rendering framebuffers. Basic WebGL image compositing remains in use;
  this is not a claim of zero GPU activity.
- Coarse images load first; only visible detail follows. Both tile caches have
  120-texture limits. Obsolete requests are cancelled, failed downloads can retry,
  and a visible Retry action recovers without enabling heavy rendering.
- Fine lighting is prepared offline in view-independent tiles. Graticules remain
  inexpensive vector projection lines so their screen-space width is preserved.
  Opacity and compatible background changes reuse the image layers.
- Customized maps use specialized live programs. Ecology sector selection now
  evaluates the shared spherical projection once, rather than repeatedly inside
  nested region/sector branches. The accepted bridge geometry remains intact.
- Live rivers use packed distance/width channels with the original coverage and
  interpolation, removing the retained painted RGBA array/canvas. Oversized
  source textures and display buffers respect device limits. Switching back to
  defaults releases live data, terrain textures/framebuffers and shader programs.
- Export code loads on demand. PNG/PDF exports wait for images and restore the
  viewport and URL. Cache versions and generated local routes were updated.

### Measurements and verification

For the **same currently approved Lifezones default with lighting off**, at
1440 × 1000 CSS pixels and device ratio 2, nominal requested texture storage fell
from **52.9 MiB to 17.3 MiB**, about **67%**. The 159–164 MiB figure in the original
diagnosis included the earlier lit default, so it is not the controlled baseline
for this comparison. Texture instrumentation excludes browser/driver overhead,
canvas buffers and CPU arrays. Default startup also avoids the global river
buffers described above. One new cold-start profile had a longest main-thread
task of 140 ms; local elapsed time was 1.62 seconds including a deliberate
one-second observation period. Timing is hardware/cache-dependent.

Verification completed:

- `npm test`, including new default-image, failure/retry, river packing, resource
  disposal and cache-budget checks.
- All 64 default routes in Chrome and isolated Firefox 146, plus all 64
  close-ups in Firefox: no application or
  WebGL errors, no terrain framebuffers or live ecology/height shaders, no global
  river/elevation downloads. Simulated HTTP 503 failures recovered in both.
- Chrome and Firefox desktop/phone checks: custom geography, return to defaults,
  framebuffer release, rapid style switches, 2048px graphics limits, PNG and PDF
  exports, and restored viewport/URL.
- Stable pixels and completed requests at 1920 × 1200 and 2560 × 1440, ratio 2,
  including zoom and Fit; no repeated download loop.
- All 64 normal views compared with the pre-fix app using the approved palette.
  Maximum mean RGB difference was 1.33/255 in 550 × 400 comparison samples.
  Reviewed the higher-difference views and close-up Satellite/Elevation/Ivory
  captures. Six live projection comparisons were effectively identical (maximum
  mean RGB difference 0.0015/255). Raster resampling means these are not claims of
  pixel-for-pixel equality at arbitrary zoom or export dimensions.

### Publication decision still open

The full lossless image collection is approximately **6.77 GB**, especially
because of maximum-zoom lighting. It exceeds
GitHub Pages' [1 GB site limit](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
Visitors load visible tiles, not the complete collection, but the hosting limit
applies to the collection. Lossless compression and sharing identical Flower
World/Gosper bases reduce duplication without changing source pixels.

The pending choice is separate image hosting for fully image-based deep zoom,
or retaining GitHub Pages and using live lighting only after deep zoom. No host
was changed and nothing was published. The complete all-image version is a local
implementation; it must not be described as ready to publish to the current host.
