# Fish map: an equal-area unfolding of the world ocean

This is a standalone experiment. Nothing in `/home/user/hexagonal-world` was changed and nothing was published.

Final map: `fish-map.png` (3200x2032, with outlines), `fish-map-clean.png` (no outlines),
`fish-diagnostic.png` (world map), `fish-distortion.png` (angular distortion per cell).
The final run uses frequency n = 64. Files with the `_n32` suffix are the comparison run at n = 32.

## Method

### 1. Mesh: equal-area cells from Snyder's icosahedral projection (a departure from the brief)

The brief suggested a geodesic subdivision with each small triangle flattened separately. I did
not use that, for one reason. A geodesic triangle flattened to its own shape leaves an angle gap
at every interior vertex, because the angles around a vertex on the sphere sum to more than 360°.
A non-overlapping edge-to-edge layout then needs at least one cut edge at every such vertex. On the
final mesh that is at least 27,634 cut edges, or about 3.3 million km of cuts through the ocean.

What I did instead:

- **Projection.** I used the Snyder equal-area icosahedral projection, implemented from the
  construction in J. P. Snyder (1992), "An Equal-Area Map Projection for Polyhedral Globes",
  *Cartographica* 29(1):10–21 (code in `snyder.py`). Each icosahedron face is split into three
  triangles P-A-B (P is the face centre). Each one is mapped to a planar triangle of equal area:
  - great circles through P become straight rays;
  - a point Q on edge AB goes to t = area(PAQ)/area(PAB) along the planar edge;
  - the radius along each ray is |px|/|pq| = sqrt((1−cos PX)/(1−cos PQ)).

  Areas use the exact spherical-excess formula.
- **Cells.** Each planar face is divided into a regular triangular lattice with n² triangles.
  The cells are the inverse images of these lattice triangles, so the 20n² cells on the sphere
  have exactly equal area. They are curvilinear triangles with nearly geodesic edges. Every cell
  maps, area-preserving, onto a congruent equilateral planar triangle.
- **Why this layout works.** The Snyder map is continuous across face edges, because adjacent
  faces mirror each other. So all of the sphere's curvature sits at 12 cone points (the
  icosahedron vertices, 60° deficit each), and every other vertex closes flat.
- **Unfolding rule.** Unfolding is exact integer arithmetic on one triangular lattice. The
  neighbour across edge (u, v) gets its third vertex at u + v − w.
- **Leeuwen–Strebe.** The slice-and-dice mapping (van Leeuwen & Strebe 2006) was not needed,
  because every target triangle is congruent.

### 2. Cell selection (revised after the coastline / straits design change)

- **Ocean mask.** I labelled 4-connected water components of the mask (`label.c`). The world
  ocean is component 1 plus the Black Sea, the Sea of Azov and the Sea of Marmara. Their real
  outlets (Bosporus 0.7 km, Dardanelles 1.2 km, Kerch 4 km) are narrower than the 9 km pixels.
  The Caspian, Aral Sea, Great Lakes and other lakes are excluded as not ocean. Suez is a canal
  and is excluded.
- **Which cells are kept.** A cell is a candidate if at least 5% of its 36 sample points are
  ocean. Only the ocean part of each cell is drawn: pixels from a bilinear ocean mask, with land
  and lakes shown as background. This replaces the original ">50% ocean" rule. The outline of
  the map is therefore the real coastline.
- **Which edges may join.** An edge between two cells can join only if:
  1. at least 50% of the 11 sample points along the edge are ocean, **and**
  2. the edge's water belongs to the *dominant water piece* of both cells. I compute connected
     wet sub-triangles on a 6x6 grid inside each cell. This "isthmus rule" stops a join through a
     cell that has land across its middle, as at Panama or Suez. At n = 64 it found 405 split
     cells and blocked 48 wet edges.
- **Hard-coded straits.** Every strait in `straits.py` is forced kept and joined, and the cut
  search is not allowed to cut those edges. There are 25 polylines, listed below.
- **Leaf rule.** A detached group of cells can attach through its single wettest edge if that
  edge is at least 20% water and passes the isthmus rule. This applied to 587 edges.
- **Connectivity.** The kept set is the component, connected through joinable edges, that holds
  the world ocean.

### 3. Cuts

Away from the 12 cones the Snyder metric is flat. So the layout develops consistently unless a
loop in the ocean surrounds net curvature. A loop has net curvature if it encloses a cone point
or a land region that contains cone points.

- **Free edges.** Edges that cannot join cost nothing to cut: coast, land, peninsulas, dropped
  cells. They form "free components".
- **Charged components.** A free component that contains cone points is "charged", and so is a
  cone point sitting in open water.
- **What must be cut.** The minimum ocean cut is a Steiner tree, through joinable (wet) edges
  weighted by length, that connects all charged components.
- **How I solved it.** I used Mehlhorn's 2-approximation. Cycles in the cut network are skipped,
  so the ocean is never split into pieces. I then took the best of 40 random weight
  perturbations.
- **Layout.** A BFS spanning tree over joinable, uncut edges places the cells. Every non-tree
  edge is then checked; where both sides land on the same lattice points, it counts as joined.
- **Globe rotation.** 3,600 random rotations were tried at n = 24 (`search.py`, three seeds),
  with local refinement of the best 8 per seed. The best 6 were then refined again at the final
  n. The objective was ocean cut length weighted by the water fraction along each cut edge, with
  any overlap forbidden.

## Results (final, n = 64)

| quantity | value |
|---|---|
| cells / kept | 81,920 / 60,090 (every cell 6,226.387 km²; lattice edge about 120 km) |
| world ocean retained | **99.968 %** of 361.88 M km² (lost: 53.6k km² in cells under 5% ocean, 62.4k km² in 63 small detached groups, mostly Canadian Arctic Archipelago fjords and inlets) |
| ocean-ocean cuts | **121 edges, 13,391 km** (13,227 km counting only the water along those edges) |
| land seams | 1,060 dry edges stay closed (zero width, land shown as background); 44 dry edges open as gaps (5,280 km) |
| charged components | 9. Of the 12 cones, 4 are on land (Appalachians 35.5N 81.7W, Senegal 15.2N 13.8W, SE China 25.6N 116.3E, Chaco 25.6S 63.7W) and 8 are in kept ocean cells, each needing a cut to land |
| rotation (quaternion w,x,y,z, mesh→Earth) | 0.11066, 0.57940, 0.80370, 0.07828 |
| bounding box of the unfolding | about 23,900 x 37,700 km |

The ocean cuts are the slits from the 8 ocean cones to the nearest land: N Pacific south of the
Aleutians, central S Pacific to Mexico, Amundsen Sea, Barents Sea, Vanuatu to Australia, S
Atlantic to South Africa, off Somalia, and the S Indian Ocean to Western Australia. There are also
short links that join Antarctica to South America and Australia to Asia through Indonesia.

**Zero ocean cuts is not possible with this construction.** Each cone in the ocean has to be
slit open to some charged land region. The best of about 3,600 rotations still puts 8 of the 12
vertices in the sea. The 12 vertices come in 6 antipodal pairs, and land is rarely antipodal to
land.

### Verification (`stats_n64.json`, `verify_snyder_n32.json`)

**Equal area**
- Jacobian area scale over 100k random points: 0.999977–1.000028. This range is
  finite-difference noise; the 99.9th percentile of |error| is 3.8e-6.
- Cell area against a 24x24 geodesic subdivision of 400 random cells: max relative error 8.1e-5,
  mean 1e-6. The limit here is the subdivision used for the check, not the projection.
- Planar triangle areas in the layout: 6226.3870212 km² for all 60,090 cells, a relative spread
  of 3e-14, equal to the spherical cell area.
- Forward/inverse round trip: max error 8e-14 rad.

**Angular distortion** (Tissot maximum angular deformation ω, area-weighted by ocean)
- mean 9.58°, median 8.93°, 90th percentile 14.5°, 99th percentile 16.3°, max 17.26°.
- Snyder's published maximum for this projection is 17.27°.
- The highest distortion runs along the lines from each face centre to its vertices (see
  `fish-distortion.png`). The globe rotation changes the ocean mean by only about 0.2°.

**No overlaps**
- No two cells sit on the same lattice triangle.
- An independent separating-axis test over 2.34 M nearby triangle pairs found 0 overlaps.
- 0 mirrored cells: all have positive determinant, so the map is not flipped.

**Edge joins**
- All 88,733 joined edges were checked. Each shares the same two global sphere vertices, with
  opposite orientation in the two cells (counter-clockwise order) and identical plane positions.
  There were 0 failures.
- All 60,089 spanning-tree edges are water edges.
- No two cells touch in the layout unless they are neighbours on the sphere.

### Straits (n = 64): all 25 survived (kept and joined, never cut)

The numbers below are edges that would have been wet without forcing, out of the edges on each
strait path:
- Gibraltar 3/3
- Dardanelles–Marmara–Bosporus 2/6
- Kerch 1/2
- Bab-el-Mandeb 4/6
- Hormuz 3/3
- Skagerrak–Kattegat 6/6
- Øresund 3/4
- Kvarken (Gulf of Bothnia) 3/5
- Gorlo (White Sea) 7/11
- Gulf of Ob 7/12
- Juan de Fuca–Georgia 1/4
- Gulf of Suez 0/5
- Gulf of Aqaba/Tiran 0/3
- Lake Maracaibo outlet 1/4
- English Channel 8/11
- Bering 6/6
- Fram 11/11
- Davis 22/22
- Hudson Strait 15/16
- Nares 8/17
- Parry Channel 24/27
- Malacca–Singapore 17/17
- Torres 8/8
- Magellan 4/10
- Drake 11/11

Kvarken, Gorlo, Ob, Juan de Fuca, Suez, Aqaba and Maracaibo were added after a first run at
n = 32 dropped those waters. Suez as a canal is deliberately not connected.

### Peninsulas (n = 64): all 12 are cuts

Each result comes from a transect across the land mass.

| peninsula | result at n = 64 |
|---|---|
| Malay (7N), Baja California, Italy, Korea, Kamchatka, Florida, Suez isthmus, Crimea | land cells removed between the two sides |
| Kra Isthmus, Antarctic Peninsula, Panama | an open gap in the map |
| Jutland | a closed land seam (an edge that is not joined, zero width) |

A dry seam opens into a visible gap only where it connects curvature, that is a cone point.
Elsewhere it stays shut, so the two sides meet at a coastline-shaped boundary of background-coloured
land, but no triangles are joined across it.

### Resolution comparison

At n = 32 (15,342 kept cells of 24,906 km²):
- ocean cuts: 65 edges, 14,434 km;
- 99.83% of the ocean retained;
- 0 overlaps;
- Panama is still "joined across", because the isthmus lies within one cell's width of a wet edge;
- the Kvarken strait failed, which detached the Bothnian Bay.

n = 64 fixes both, which is why it is the final run. The originally suggested 20–40 range cannot
resolve isthmuses about 60 km wide.

## Limitations

- **Angular distortion is fixed by the polyhedron.** The mean of about 9.6° and the 17° maximum
  come from Snyder's icosahedral geometry, not from the cut choice. The map is exactly equal-area
  but not low in shape distortion.
- **Isthmus detection** works on a 6x6 grid inside each cell, which is about 20 km at n = 64.
  Features narrower than that, and the 9 km mask itself, rely on the hard-coded list. The strait
  and peninsula lists are a judgement call and not exhaustive.
- **Detached groups.** The 63 small detached ocean groups (≤ 4,500 km² each) are fjords and
  channels of the Canadian archipelago, Greenland and similar places. They are dropped, not
  connected.
- **Ice.** Blue Marble shows sea ice and ice shelves as white even where the mask says ocean,
  for example near Antarctica.
- **Search is heuristic.** The rotation search ran with an earlier list of 18 straits and without
  the isthmus rule. Only the final local refinement used the final rules. `run_all.sh` reruns
  everything with the final rules, so its numbers may differ slightly. The Steiner step is a
  2-approximation, so the cut length is not proven optimal.
- **No captions.** The layout's orientation in the image is chosen to minimise the bounding box.
  There are no labels or graticule.

## What I'd try next

1. **Lower the shape distortion while staying exactly equal-area.**
   - Relax the vertex positions with each triangle's area fixed and the land/cut boundaries free.
     With per-triangle area constraints, piecewise-linear meshes "lock": the free parameters are
     only about as many as the boundary vertices. So this needs patch constraints with
     slice-and-dice interiors, or a smooth equal-area correction afterwards: a Dacorogna–Moser
     flow or a Gastner–Newman diffusion step applied to a conformal or as-rigid-as-possible
     flattening.
   - Use polyhedra with more, smaller cones. These need a lattice that stays consistent across
     unequal faces.
2. **Optimise the rotation and the cut tree together** at the final n, with an exact Steiner
   solver (12 terminals is small enough for Dreyfus–Wagner on the contracted graph).
3. **Use a finer mask** (for example 1 km), so fewer straits need hard-coding and cell
   fractions are more accurate.

## Files

All files are in `/tmp/claude-0/-home-user-hexagonal-world/a06c0abc-38f9-5e56-b0a1-5bebd61aba6d/scratchpad/fish/`.

- **Maps**
  - `fish-map.png`: the unfolded map, with a faint triangle grid, red ocean cuts and thin brown
    land seams.
  - `fish-map-clean.png`: the same map with no outlines.
  - `fish-diagnostic.png`: Blue Marble world map. Grey: cells with under 5% ocean (removed).
    Magenta: ocean cells dropped as detached. Yellow fill: hard-coded strait cells. White line:
    edge of the kept region. Red lines: ocean cuts. Yellow lines: strait polylines. Cyan lines:
    peninsula transects. Dots: cone points (red in the sea, black on land).
  - `fish-distortion.png`: ω per cell, from blue (0°) to red (18°), with the cuts drawn in black.
- **Data**
  - `stats_n64.json`, `stats_n32.json`: all numbers, verification results, strait and peninsula
    reports, dropped groups, cone points.
  - `layout_n64.json`, `layout_n32.json`: lattice coordinates of every placed cell.
  - `verify_snyder_n32.json`: the equal-area checks.
- **Code**
  - `snyder.py`: the projection and the lattice.
  - `fishmap.py`: selection, cuts, layout, analysis.
  - `straits.py`: the strait and peninsula lists.
  - `render.py`: rendering.
  - `search.py`: rotation search.
  - `make_map.py`: final run, verification and images.
  - `verify_snyder.py`: area checks.
  - `label.c`: water component labelling.
  - `run_all.sh`: runs everything end to end.
