"""Stage 1: random search over globe rotations (coarse mesh), then local refinement."""
import os, sys, json, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, fishmap as fm
n = int(sys.argv[1]); N = int(sys.argv[2]); seed = int(sys.argv[3])
prep = fm.Prep(n)
rng = np.random.default_rng(seed)
res = []
def score(o):
    return o['ocean_cut_water_km'] + 1e6 * o['overlapping_cells'] + 1e5 * (o['placed_cells'] < o['kept_cells'])
for i in range(N):
    q = rng.normal(size=4); q /= np.linalg.norm(q)
    o, _ = fm.run(prep, fm.rotation(q))
    res.append((score(o), q.tolist(), o))
res.sort(key=lambda r: r[0])
# local refinement around the 8 best
best = res[:8]
for k in range(len(best)):
    s0, q0, o0 = best[k]
    q0 = np.array(q0); step = 0.08
    for it in range(60):
        q = q0 + step * rng.normal(size=4); q /= np.linalg.norm(q)
        o, _ = fm.run(prep, fm.rotation(q))
        s = score(o)
        if s < s0:
            s0, q0, o0 = s, q, o
        if it % 20 == 19:
            step *= 0.5
    best[k] = (s0, q0.tolist(), o0)
best.sort(key=lambda r: r[0])
json.dump(dict(random=res[:30], refined=best), open(f'search_n{n}_s{seed}.json', 'w'), indent=1)
for b in best:
    print(round(b[0]), b[2]['cones_on_wet_ocean'], b[2]['charged_components'], b[1])
