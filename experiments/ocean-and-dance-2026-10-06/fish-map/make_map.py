"""Stage 2: final mesh, rotation refinement, cut optimisation, verification,
rendering.  usage: python3 -I make_map.py N [search json ...]"""
import os, sys, json, glob, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw
import fishmap as fm, render as rd, snyder as sn, straits as st

HERE = fm.HERE
n = int(sys.argv[1])
files = sys.argv[2:] or sorted(glob.glob(os.path.join(HERE, 'search_n*_s*.json')))
tag = f'n{n}'
t0 = time.time()
prep = fm.Prep(n, m=6)
print('prep', round(time.time() - t0, 1), flush=True)


def score(o):
    return o['ocean_cut_water_km'] + 1e6 * o['overlapping_cells'] + 1e6 * (o['placed_cells'] < o['kept_cells'])


cands = []
for f in files:
    d = json.load(open(f))
    cands += [r[1] for r in d["refined"][:2]]
rng = np.random.default_rng(11)
results = []
for q in cands:
    q0 = np.array(q); o0, _ = fm.run(prep, fm.rotation(q0)); s0 = score(o0)
    step = 0.03
    for it in range(20):
        qq = q0 + step * rng.normal(size=4); qq /= np.linalg.norm(qq)
        o, _ = fm.run(prep, fm.rotation(qq))
        if score(o) < s0:
            s0, q0, o0 = score(o), qq, o
        if it % 7 == 6:
            step /= 2
    results.append((s0, q0.tolist()))
    print('cand', round(s0), flush=True)
results.sort()
q = np.array(results[0][1])
R = fm.rotation(q)
sel = fm.select_cells(prep, R)
best = None
for k in range(40):
    o, res = fm.run(prep, R, rng=rng if k else None, jitter=0.0 if k == 0 else 0.4, sel=sel)
    if best is None or score(o) < score(best[0]):
        best = (o, res)
out, res = best
print('final', out, flush=True)
P = res['P']; keep = sel['keep']

# ---------------- verification ----------------
ver = {}
# 1. every joined edge: same spherical edge, opposite orientation in the two cells, same planar points
bad_orient = 0; bad_pos = 0; nj = 0
for e in np.nonzero(res['joined'])[0]:
    a, b = map(int, prep.ec[e]); u, v = int(prep.eu[e]), int(prep.ev[e])
    ca = list(map(int, prep.cells[a])); cb = list(map(int, prep.cells[b]))
    da = (ca[(ca.index(u) + 1) % 3] == v); db = (cb[(cb.index(u) + 1) % 3] == v)
    bad_orient += int(da == db)
    bad_pos += int(P[a][u] != P[b][u] or P[a][v] != P[b][v])
    nj += 1
ver['joined_edges_checked'] = nj
ver['joined_edges_with_same_orientation (should be 0)'] = bad_orient
ver['joined_edges_with_position_mismatch (should be 0)'] = bad_pos
ver['tree_edges'] = int(res['tree'].sum())
ver['tree_edges_all_water'] = bool((res['tree'] <= res['sel']['joinable']).all())
# 2. geometric overlap test independent of the lattice keys (SAT on triangles)
tris = {c: rd.fm.to_xy(np.array([P[c][int(v)] for v in prep.cells[c]])) for c in P}
grid = {}
for c, t in tris.items():
    g = tuple(np.floor(t.mean(0) / 2).astype(int))
    grid.setdefault(g, []).append(c)


def sat_overlap(A, B, eps=1e-9):
    for T in (A, B):
        for i in range(3):
            d = T[(i + 1) % 3] - T[i]; nrm = np.array([-d[1], d[0]])
            pa = A @ nrm; pb = B @ nrm
            if pa.max() <= pb.min() + eps or pb.max() <= pa.min() + eps:
                return False
    return True


ov = 0; pairs = 0
for (gx, gy), cs in grid.items():
    near = [c2 for dx in (-1, 0, 1) for dy in (-1, 0, 1) for c2 in grid.get((gx + dx, gy + dy), [])]
    for c in cs:
        for c2 in near:
            if c2 > c:
                pairs += 1
                ov += sat_overlap(tris[c], tris[c2])
ver['triangle_pairs_tested'] = pairs
ver['overlapping_triangle_pairs (SAT, interiors)'] = ov
areas = np.array([0.5 * ((t[1, 0] - t[0, 0]) * (t[2, 1] - t[0, 1]) - (t[2, 0] - t[0, 0]) * (t[1, 1] - t[0, 1])) for t in tris.values()])
lat_km = sn.S / n * fm.R_KM
ver['planar_triangle_area_km2_min_max'] = [float(areas.min() * lat_km ** 2), float(areas.max() * lat_km ** 2)]
ver['spherical_cell_area_km2'] = prep.cell_km2
# 3. lower bound for the alternative (each geodesic triangle flattened on its own)
J = sel['joinable']
vert_ok = np.ones(len(prep.pos), bool)
touched = np.zeros(len(prep.pos), bool)
for e in range(len(prep.eu)):
    for x in (prep.eu[e], prep.ev[e]):
        if keep[prep.ec[e]].any():
            touched[x] = True
        if not J[e]:
            vert_ok[x] = False
interior_v = vert_ok & touched
ver['wet_interior_vertices'] = int(interior_v.sum())
ver['lower_bound_ocean_cut_km_if_triangles_flattened_individually'] = float(interior_v.sum() * prep.elen.mean())

straits = fm.strait_report(prep, R, res)
pens = fm.peninsula_report(prep, R, res, st.PENINSULAS)
# dropped groups
drops = []
ocean_frac = sel['focean']
for cs in res['sel']['dropped_groups']:
    X = prep.samp[cs].mean(1).sum(0) @ R.T
    lon, lat = fm.lonlat(X / np.linalg.norm(X))
    drops.append(dict(cells=len(cs), ocean_km2=float(ocean_frac[cs].sum() * prep.cell_km2),
                      lat=float(lat), lon=float(lon)))
drops.sort(key=lambda d: -d['ocean_km2'])
lost_lowfrac = float(ocean_frac[~sel['cand']].sum() * prep.cell_km2)
stats = dict(n=n, quaternion=q.tolist(), summary=out, verification=ver, straits=straits,
             peninsulas=pens, dropped_ocean_groups=drops,
             ocean_km2_in_cells_below_keep_threshold=lost_lowfrac,
             ocean_km2_total=float(ocean_frac.sum() * prep.cell_km2),
             cone_points=[dict(zip(('lon', 'lat'), map(float, fm.lonlat(fm.rotation(q) @ v))),
                               wet=bool(all(sel['keep'][c] for c in np.nonzero((prep.cells == g).any(1))[0])))
                          for v, g in zip(sn.VERT, prep.cone)],
             omega_sphere_reference=dict(mean=float(prep.om_mean.mean()), max=float(prep.om_max.max())),
             rotation_candidates=results)
kept = keep
w = ocean_frac[kept]
om = prep.om_mean[kept]
stats['omega_ocean_weighted_percentiles'] = {p: float(np.interp(p / 100, np.cumsum(w[np.argsort(om)]) / w.sum(), np.sort(om))) for p in (50, 90, 99)}
json.dump(stats, open(os.path.join(HERE, f'stats_{tag}.json'), 'w'), indent=1)
json.dump({str(c): {str(v): p for v, p in P[c].items()} for c in P}, open(os.path.join(HERE, f'layout_{tag}.json'), 'w'))
print(json.dumps(dict(verification=ver, straits={k: v['survived'] for k, v in straits.items()},
                      peninsulas={k: v['status'] for k, v in pens.items()}), indent=1), flush=True)

# ---------------- rendering ----------------
img, to_px = rd.render_layout(prep, R, P, long_px=3200, ss=2)
Image.fromarray(img).save(os.path.join(HERE, f'fish-map-clean_{tag}.png'))
seg_cell, seg_cut, seg_land = rd.layout_edges(prep, P, res['joined'], J)
im2 = rd.draw_segments(img, to_px, seg_cell, (255, 255, 255, 60), 1)
im2 = (0.75 * img + 0.25 * im2).astype(np.uint8)  # faint triangle grid
im2 = rd.draw_segments(im2, to_px, seg_cut, (230, 40, 40), 3)
im2 = rd.draw_segments(im2, to_px, seg_land, (150, 120, 90), 1)
Image.fromarray(im2).save(os.path.join(HERE, f'fish-map_{tag}.png'))
# distortion
om_c = np.clip(prep.om_mean / 18, 0, 1)
cmap = np.stack([40 + 215 * om_c, 60 + 120 * (1 - np.abs(om_c - .5) * 2), 200 * (1 - om_c) + 30], 1)
dimg, _ = rd.render_layout(prep, R, P, long_px=1600, ss=1, value=cmap)
dimg = rd.draw_segments(dimg, _, seg_cut, (0, 0, 0), 2)
Image.fromarray(dimg).save(os.path.join(HERE, f'fish-distortion_{tag}.png'))
# diagnostic world map
Wd, Hd = 3600, 1800
bm = np.asarray(Image.fromarray(rd.bluemarble()).resize((Wd, Hd), Image.BILINEAR)).astype(float)
cid = rd.world_cells(prep, R, Wd, Hd)
cat = np.zeros(cid.shape, int)
cat[~sel['cand'][cid]] = 1                          # no meaningful ocean
cat[sel['cand'][cid] & ~keep[cid]] = 2              # ocean cells not connected
cat[sel['forced_cells'][cid] & keep[cid]] = 3       # hard-coded strait cells
tint = {1: (np.array([90, 90, 90]), 0.6), 2: (np.array([255, 0, 160]), 0.6), 3: (np.array([255, 220, 0]), 0.55)}
for k, (col, a) in tint.items():
    m = cat == k
    bm[m] = bm[m] * (1 - a) + col * a
# kept-region boundary
edge = np.zeros(cid.shape, bool)
kk = keep[cid]
edge[:, 1:] |= kk[:, 1:] != kk[:, :-1]; edge[1:] |= kk[1:] != kk[:-1]
bm[edge] = (255, 255, 255)
dimg = Image.fromarray(bm.astype(np.uint8)); dr = ImageDraw.Draw(dimg)


def pl(lon, lat, col, wd):
    xs = (np.asarray(lon) + 180) / 360 * Wd; ys = (90 - np.asarray(lat)) / 180 * Hd
    for i in range(len(xs) - 1):
        if abs(xs[i + 1] - xs[i]) < Wd / 2:
            dr.line([(xs[i], ys[i]), (xs[i + 1], ys[i + 1])], fill=col, width=wd)


for e in np.nonzero(res['ocean_cut'])[0]:
    lon, lat = rd.edge_polyline(prep, e, R); pl(lon, lat, (255, 30, 30), 4)
for e in np.nonzero(sel['forced_edges'])[0]:
    pass
for name, pts in st.STRAITS.items():
    lat, lon = zip(*pts); pl(lon, lat, (255, 255, 0), 2)
for name, pts in st.PENINSULAS.items():
    lat, lon = zip(*pts); pl(lon, lat, (0, 255, 255), 2)
for cp in stats['cone_points']:
    x = (cp['lon'] + 180) / 360 * Wd; y = (90 - cp['lat']) / 180 * Hd
    dr.ellipse([x - 9, y - 9, x + 9, y + 9], outline=(255, 255, 255), width=3,
               fill=(255, 30, 30) if cp['wet'] else (0, 0, 0))
dimg.save(os.path.join(HERE, f'fish-diagnostic_{tag}.png'))
print('done', round(time.time() - t0, 1))
