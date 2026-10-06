# Fish map v2: the world ocean in one piece

## Result in one paragraph
The world ocean is one connected piece, with no cuts through water. The only thing outside the map is Eurasia. Africa, the Americas, Antarctica, Australia and every island stay inside as land, and that land is allowed to stretch and squash freely. The map has no fold-overs and no triangle is flipped. The outer boundary runs entirely over land: there are 0 boundary edges with any water on them.

On the main map, the ocean's angular distortion averages 3.05° (median 2.6°, 90th percentile 5.3°, 99th percentile 13°). Area is only roughly preserved: the middle 80% of the ocean is drawn at 0.47–1.57 times its true area, and 18.7% of the ocean is off by more than a factor of 2.

The price is paid next to the outer boundary. A few seas that border Eurasia are drawn as long, thin ribbons, and a handful of triangles are distorted by more than 100°:
- the Chukchi Sea and Bering Strait;
- the Red Sea;
- the Alboran Sea and Gibraltar;
- the Gulf of Thailand.

Distortion above 30° covers only 0.15% of the ocean's area.

## Changes from v1
- **v1's trade-off is gone.** v1 kept area exactly equal, which forced 13,391 km of cuts through water. Those included the Drake Passage, which made Antarctica look joined to South America, and a cut through Indonesia. v2 has no cuts at all.
- **Spilhaus-style construction.** As in Spilhaus's 1942 world-ocean map, the domain is the sphere minus one land region: Spilhaus, A. F. (1942), "Maps of the whole world ocean", *Geographical Review* 32(3):431–435. His later square version used Adams's conformal "world in a square" projection (O. S. Adams, 1925 and 1929).
- **Free-form fit instead of a fixed projection.** Instead of a fixed formula, the map is a piecewise-linear embedding fitted by numerical optimisation. Land is given almost no weight, so it soaks up most of the distortion.
- **Suez stays closed.** The Mediterranean connects to the rest of the ocean only through Gibraltar, and the Red Sea only through Bab-el-Mandeb.

## Method
1. **Mesh.** I reused v1's equal-area icosahedral lattice at n = 64: 81,920 triangles of 6,226 km² each, about 1.1° across, joined by straight great-circle edges. There is no extra refinement along coasts.
2. **Water.** For each triangle I take its ocean fraction from 36 sample points in the land/sea mask. "Ocean" means the main ocean body plus the Black Sea, Sea of Azov and Sea of Marmara; lakes and the Caspian do not count. Cells along 25 hard-coded straits and 4 extra check routes count as fully water. The check routes are two Indonesian through-flow paths, the Banda–Arafura passage south of New Guinea, and a line across the Drake Passage at 58°S.
3. **The outside region.** Eurasia's land is shrunk inward by one cell, so a strip of coastal land always separates it from the sea. Only cells with no ocean at all are used. Anything that becomes enclosed is added to the outside; there was 0 km² of ocean in it. The map shows the sphere minus this region: 39.7 M km², a topological disk whose single boundary loop of 439 edges lies on land.
4. **How fold-overs are prevented.** My first attempt deleted the outside region entirely and left its edge free. Those maps folded over: the outer boundary crossed itself 110–229 times. In the final version Eurasia stays in the mesh as a near-weightless filler: 10 times cheaper than other land, angle term only. Only a small cap around Eurasia's most inland point is removed. A boundary that never touches itself plus no flipped triangle guarantees the whole map is overlap-free.
   - The outer boundary of the filler (63 edges) does not cross itself.
   - No triangle is flipped.
   - Angles around every interior vertex sum to 360° (error below 2e-15 rad).

   This filler trick follows Jiang, Schaefer and Panozzo, "Simplicial complex augmentation framework for bijective maps", *ACM TOG* 36(6), 2017.
5. **What is minimised.** For each triangle, the energy compares its true shape on the sphere with its drawn shape:
   - an angle term of the MIPS type (Hormann & Greiner, 2000), which is lowest when the triangle keeps its shape;
   - plus β times an area term, which is lowest when it keeps its size.

   Weights:
   - **Ocean:** each triangle's term is weighted by its ocean fraction.
   - **Land:** gets weight 0.01.
   - **Coastal land:** a land triangle next to water gets at least half its wettest neighbour's weight, so narrow seas are not crushed.
   - **Option:** an exponent p = 1.5 can be used to punish extreme triangles harder.
6. **Solver.** The solver starts from an azimuthal equidistant projection centred opposite Eurasia, which has no cuts and no flips. It runs 15,000 quasi-Newton (L-BFGS) iterations. The step length is capped so no triangle can ever flip, following Smith & Schaefer, "Bijective parameterization with free boundaries", *ACM TOG* 34(4), 2015. Energy fell by less than 0.01% over the last 5,000 iterations, so the runs are converged (a local optimum).

## Choosing the outside region
These comparisons were run on a coarser mesh (n = 32), with 3,000 iterations and the balanced setting (β = 0.3).

| outside region | outside area (M km²) | ocean angular distortion, mean | 90th percentile | ocean area, p10–p90 |
|---|---|---|---|---|
| Eurasia | 32.5 | 6.93° | 12° | 0.56–1.50 |
| Afro-Eurasia | 53.8 | 6.94° | 12° | 0.56–1.50 |
| Africa | 21.3 | 8.46° | 16° | 0.51–1.62 |
| North America | 10.5 | 9.09° | 18° | 0.48–1.76 |
| Antarctica | 7.4 | 10.21° | 26° | 0.04–2.60 |
| small inland disk (Eurasia / Africa / N. America / S. America / Antarctica) | 3–5.5 | 15.5° / 8.6° / 19.5° / 13.2° / 13.1° | 16–63° | much worse |

Eurasia and Afro-Eurasia came out the same. Cutting Africa off at Sinai was allowed and gains nothing, because Africa is already near-free land, so I kept Africa visible. I implemented a land-only cut across Sinai and used it in the first, superseded attempt. The small inland disks were worse, but they may also have been less converged at 3,000 iterations.

## Final settings (n = 64, outside = Eurasia)

| setting | ocean angular distortion, mean | median / p90 / p99 | max (≥50% ocean) | area p10 / p50 / p90 | area p1 / p99 | area max / min | mean abs. area error |
|---|---|---|---|---|---|---|---|
| **conformal-leaning (β = 0.1), main map** | **3.05°** | 2.6 / 5.3 / 13 | 135° | 0.47 / 0.81 / 1.57 | 0.44 / 3.65 | 196× / 0.30× | 0.445 |
| balanced (β = 0.3) | 6.01° | 5.3 / 11 / 23 | 151° | 0.59 / 0.89 / 1.43 | 0.55 / 2.80 | 159× / 0.36× | 0.323 |
| area-leaning (β = 1.0), `v2-area-*` | 11.0° | 9.9 / 19 / 38 | 159° | 0.74 / 0.95 / 1.26 | 0.70 / 1.93 | 105× / 0.47× | 0.194 |
| robust (β = 0.3, p = 1.5) | 7.74° | 6.6 / 14 / 32 | 111° | 0.56 / 0.83 / 1.58 | 0.52 / 3.12 | 18× / 0.35× | 0.376 |

All four settings have 0 flipped triangles, a boundary that never crosses itself, and 0 water on the outer boundary. Area is scaled so the ocean-weighted mean is 1.

Main map in more detail:
- Share of ocean area by angular distortion: >15° 0.75%, >30° 0.15%, >45° 0.06%, >90° 0.02%.
- Share of ocean area by area factor: more than ×2 (or below ½) 18.7%, ×3 1.53%, ×5 0.56%, ×10 0.13%.

## Checks
- **Ocean cuts: 0.** The domain is one disk and the map is continuous on it.
  - All 362.3 M km² of world ocean is in the map: 0 km² in the outside region, 0 km² enclosed.
  - The outer boundary touches no water anywhere: 0 of 439 boundary edges have any ocean on them.
- **No fold-overs:**
  - Every triangle is positively oriented (0 flipped).
  - The angle sums are exact.
  - Neither the filler's boundary nor the display boundary crosses itself.
- **Straits and routes.** All 29 straits and check routes lie entirely inside the domain and map to unbroken lines with no jumps: the largest step between neighbouring points is 1.0–1.5× the median step, except Bering at 2.4×.
  - Fully open water in the mask: Gibraltar, Bab-el-Mandeb, Hormuz, Øresund, Kvarken, Fram, Davis, Bering, Malacca, Torres, the Drake Passage, Makassar–Lombok, Molucca–Banda–Timor, and Banda–Arafura.
  - Closed in the 9 km mask, so the missing water is drawn as a 5 px channel: Bosporus/Dardanelles (68% water in the mask), Kerch (41%), Magellan (30%; part of that is my waypoints cutting corners), Nares (74%), the Northwest Passage (78%), Juan de Fuca, Gorlo, the Gulf of Ob, Maracaibo, Hudson Strait, the Skagerrak and the English Channel.
  - The Southern Ocean ring at 58°S is all water and goes exactly once around Antarctica. Antarctica is no longer attached to South America.
- **Where distortion stays severe** (ocean with more than 30° angular distortion, by 10° box):
  - Chukchi Sea and Bering Strait (60–70°N, 160°W–180°): about 220k km². The East Siberian and Chukchi shelf is drawn as a ribbon down the map's left edge; the Bering route, about 280 km on the ground, is 950 px long on the map.
  - Red Sea: about 156k km². Drawn as a ribbon along the right edge.
  - Gibraltar and the Alboran Sea: about 79k km². The western Mediterranean becomes a long channel.
  - Gulf of Thailand and southern South China Sea: about 48k km².
  - Smaller patches: Levant, Chukotka coast, about 14k km² off south-west Africa.

  All of these border the outside region. The map's rim must be long enough to wrap the whole ocean, so whatever lies along Eurasia's coast gets pulled out along it. A wider land margin (3 cells) did not help, and running 2,500 more iterations changed the energy by 0.02%. This looks like a real cost of the outside region, not a convergence problem.
- **How the land is squashed** (drawn area ÷ true area, with the p10–p90 range):

  | land mass | area ratio | p10–p90 | median shape distortion |
  |---|---|---|---|
  | Antarctica | 0.42 | 0.33–0.56 | 27° |
  | South America | 0.50 | — | 52° |
  | Australia | 0.61 | — | 49° |
  | Greenland | 1.00 | — | 57° |
  | North America | 1.97 | 0.45–3.49 | 63° |
  | Africa | 2.33 | 0.93–3.94 | 69° |

  - **Overall:** land is drawn at 1.74 times its true area.
  - **Distortion across all land:** median 53°, 90th percentile 97°.
  - **Where land stretches most:** Africa and North America are inflated and sheared near the rim, where they act as padding.
  - **Main exception:** one thin sliver of land pokes out at the far left edge.

## Limitations
- The mesh is uniform at about 1.1°, with no refinement along coasts. Passages narrower than the cells only stay connected because they are on the hard-coded list and drawn as channels.
- The optimum is local, and the outside-region comparison was done on a coarser mesh with fewer iterations.
- Narrow seas next to the outside region form ribbons, as listed above.
- The centre of the Pacific is drawn at about 0.5 times its true area while seas near the rim are enlarged, so area is only roughly right.
- Sea ice and ice shelves show white in the Blue Marble imagery.

## Next steps
- Refine the mesh along coasts and run the solver at multiple resolutions.
- Use a dedicated penalty against ribbons in seas next to the outside region, for example a stronger weight on the strip of land along the outside region's coast, or a rim with a prescribed shape such as Spilhaus's square.
- Test outside regions that are long and thin (a long boundary through land only), which could reduce how much the rim has to stretch.

## Files

All in `fish/`.

**Maps (main = conformal-leaning):**
- `v2-fish-map.png` (3200×3101), with the outer boundary drawn
- `v2-fish-map-clean.png`
- `v2-fish-map-labelled.png`: oceans, seas, 16 straits, land masses, and a note that Eurasia is outside
- `v2-diagnostic.png`: world map showing the outside region in grey, the boundary in white, forced-water cells in yellow and the checked routes in cyan
- `v2-distortion-angle.png`: blue at 0°, yellow at 20°, red at 40° or more
- `v2-distortion-area.png`: area factor on a log scale, blue at ¼, yellow at 1, red at 4

**Area-leaning version:** `v2-area-fish-map.png`, `v2-area-fish-map-clean.png`, `v2-area-fish-map-labelled.png`, `v2-area-distortion-*.png`, `v2-area-diagnostic.png`.

**Stats:**
- `v2-stats.json`: main run, route and strait checks, land squash, and the comparison runs
- `v2-area-stats.json`
- `v2-run-*.json` and `.npz`: every run, with mapped coordinates and per-triangle distortion

**Scripts:**
- `v2_core.py`: mesh, domain and outside region, land-only cut, filler, energy, solver, checks
- `v2_run.py`: runs one configuration
- `v2_make.py`: rendering, labels and checks
- `v2_table.py`: comparison table
- `v2_compare.sh`, `v2_compare_disks.sh`, `v2_final.sh`, and `v2_run_all.sh` (end to end, about 45 minutes on 4 cores)

**Superseded experiments:** `v2-scratch/`, including the attempts that folded over.
