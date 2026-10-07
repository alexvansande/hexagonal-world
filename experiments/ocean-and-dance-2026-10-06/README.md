# Ocean and dance experiments (October 6, 2026)

Exploratory work from one session. Nothing here is used by the app in `dist/`;
the one idea that became a feature is the small-hexagon dance
(`dist/small-dance.mjs`, see README **Dance pieces** and DESIGN-DECISIONS
"Dancing smaller hexagons"). Previews are downscaled JPEGs; full renders and
intermediate data were left out.

Scripts were run from a scratch directory and contain absolute paths to it and
to two inputs that are not in the repository: the land mask (`continents.png`
from the asset release, thresholded at grey < 128 into a raw 4320 × 2160 byte
file `mask.bin`) and `maps/bluemarble-high.jpg` from the same release. Adjust
the paths before re-running.

## 1. Spaceship Earth orientations (`spaceship-orientation/`)

Rotations of the Spaceship Earth net (rhombic method) on the app's own
rotation convention (`dist/optimizer.mjs`).

- **Most vertices on land.** The net has 10 distinct corners on the globe
  (4 three-piece corners, each opposite a hexagon centre, and 6 two-piece
  corners in 3 antipodal pairs). Best found: 8 of 10 on land at lon −79.63°,
  lat 77.93°, roll −81.53°; the four hexagon centres fall in open ocean and land
  within 35° of the centres drops from 38% (shipped preset) to 12%. 9 or 10 were
  not reached in 1.5 M samples. `verts.mjs`, `field.mjs`, `search.py`,
  `rank.py`, `show.py`.
- **Border with the least ocean.** The app's optimizer run with an inverted
  mask over the 16 exposed edges: 67.3% of the border on land at lon 109.39°,
  lat 13.15°, roll −165.65° (the shipped preset has 0%, by design). Eight seeds
  converged to the same basin. `border.mjs`, `check.mjs`.
- `shot.mjs` loads a view in Chromium for screenshots.

## 2. Rearranged puzzle pieces (`puzzle-rearrangement/`)

Level-1 (28) and level-2 (196) cells of the default Spaceship Earth,
rearranged so the outer border has the least ocean.

- `anneal.mjs` is the **rejected first attempt**: it ignored internal joins and
  produced scrambled neighbours (64 of 65 and 531 of 538 joins wrong). Kept
  only as a record of the mistake.
- `unfold.mjs` is the corrected search: a spanning tree of true spherical
  joins laid flat with no overlaps and no accidental contacts, minimising
  ocean on the cut edges. Results: 43.5% ocean on the level-1 border and 33.7%
  on level 2 (default layout: 97.8% and 97.5%), all joins valid, every restart
  converging to the same score. `pairs.mjs` and `validate.mjs` hold the edge
  partners and the join audit; `core.mjs`, `edges.mjs`, `render.mjs` and
  `paint.py` build pieces, measure edges and render offline from Blue Marble
  (no app relief lighting or rivers).

## 3. Fish map (`fish-map/`)

An unfolded world ocean "from the point of view of fish". Built by a helper
agent; full method and numbers in `REPORT-v1.md` and `REPORT-v2.md`.

- **v1**: exactly equal-area (Snyder icosahedral cells), 13,391 km of cuts
  through ocean. Rejected by the user because the cuts split the Drake Passage
  and Indonesia.
- **v2**: no cuts through water, Eurasia outside, distortion absorbed by land;
  ocean angular distortion 3° on average, area only roughly kept, ribbon seas
  along Eurasia's coast. The user preferred the look of Spilhaus-style maps
  with the Americas and Eurasia both on the rim (which needs a cut at the
  Bering Strait) and **dropped the project**; this direction is unresolved.
- `label_fish.py` labels the v1 map at known ocean points.

## 4. Spilhaus layout from puzzle pieces (`spilhaus-puzzle/`)

The world ocean in one piece, Spilhaus-style, built from 7,254 rigid level-4
cells (about 115 km) of Spaceship Earth with Satellite imagery. Every join is a
true neighbour edge; there are no overlaps and no inconsistent joins.

- **Why there are gaps.** Rigid pieces can't absorb curvature. On this sphere it
  all sits at the 6 two-piece corners (the octahedron's axis points, 120° each);
  Euler's formula confirms exactly 6 such corners at every level. A corner on
  the rim land (Afro-Eurasia or the Americas) is free; a corner at sea needs a
  slit to that land.
- **Orientation** (`outer.mjs`, `waterdist.mjs`, `orient*.py`): no rotation
  puts all 6 corners on rim land (best 5 on any land, in 1.5–2 M samples). The
  search minimises squared water-only slit length to the rim and picks lon
  103.75°, lat 48.02°, roll −135.39°: one corner in Mongolia, one just off
  Chile, four at sea (Tasman Sea, east of Madagascar, off California, off the
  Canaries).
- **Cuts and joins** (`edges3.mjs`, `spilhaus.mjs`): each sea corner gets the
  cheapest water-only slit to a point at least 1° inside rim land, plus one cut
  joining the Americas to Afro-Eurasia (Bering Strait). Pieces join only across
  mostly-water edges whose water touches each piece's largest water patch and
  that don't cross rim land between waters; this blocks joins across isthmuses
  such as Tehuantepec. Joins along the Bosporus–Dardanelles and the Danish
  straits are forced open; the Kerch route falls inside a single piece, so
  nothing was forced there and the Sea of Azov was not checked. Ocean cut length is about 7,800 km, most of it the Tasman Sea
  corner's slit through Australia and Indonesia to Thailand.
- **Checks**: `where.mjs` and `wind.mjs` locate inconsistent joins and the
  corner a leaking loop winds around (used to find the Malay-peninsula and
  Tehuantepec leaks). Final run: 0 overlaps, 0 inconsistent joins.
- Rendered offline from Blue Marble (no app relief lighting or rivers); scripts
  read the orientation from the `ANGLES` environment variable.
