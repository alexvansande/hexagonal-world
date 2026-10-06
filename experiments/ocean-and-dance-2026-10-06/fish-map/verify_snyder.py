"""Numerical verification of the equal-area lattice."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, sys, json
import snyder as sn
rng = np.random.default_rng(0)
out = {}
# random points on sphere: roundtrip
X = rng.normal(size=(200000, 3)); X /= np.linalg.norm(X, axis=1)[:, None]
f, xy = sn.forward(X)
X2 = sn.inverse(f, xy)
out['roundtrip_max_err_rad'] = float(np.abs(X2 - X).max())
# Jacobian area scale and angular deformation over the whole sphere (uniform points)
f2, xy2 = sn.forward(X[:100000])
det, om = sn.jacobian_stats(f2, xy2)
ok = np.isfinite(det) & np.isfinite(om)
out['jacobian_area_scale_min_max'] = [float(det[ok].min()), float(det[ok].max())]
out['jacobian_area_scale_p999_abs_err'] = float(np.quantile(np.abs(det[ok] - 1), 0.999))
out['sphere_omega_mean_deg'] = float(om[ok].mean()); out['sphere_omega_max_deg'] = float(om[ok].max())
out['sphere_omega_p99_deg'] = float(np.quantile(om[ok], .99))
# cell areas by fine geodesic subdivision
n = int(sys.argv[1]) if len(sys.argv) > 1 else 32
pos, cells, cface, cxy = sn.lattice(n)
C = len(cells); V = len(pos)
E = {}
for c, (a, b, d) in enumerate(cells):
    for u, v in ((a, b), (b, d), (d, a)):
        E.setdefault((min(u, v), max(u, v)), []).append((c, u < v))
out['n'] = n; out['cells'] = C; out['vertices'] = V; out['edges'] = len(E)
out['euler'] = V - len(E) + C
out['edges_with_2_cells_opposite_orientation'] = bool(all(len(l) == 2 and l[0][1] != l[1][1] for l in E.values()))
m = 24
sel = rng.choice(C, 400, replace=False)
errs = []
for c in sel:
    a, b, d = cxy[c]
    ij = [(i, j) for j in range(m + 1) for i in range(m + 1 - j)]
    idx = {p: k for k, p in enumerate(ij)}
    L = np.array(ij, float) / m
    pts = a + L[:, :1] * (b - a) + L[:, 1:] * (d - a)
    Xs = sn.inverse(np.full(len(pts), cface[c]), pts)
    tot = 0.0
    for j in range(m):
        for i in range(m - j):
            tot += sn.sph_area(Xs[idx[i, j]], Xs[idx[i + 1, j]], Xs[idx[i, j + 1]])
            if i + j <= m - 2:
                tot += sn.sph_area(Xs[idx[i + 1, j]], Xs[idx[i + 1, j + 1]], Xs[idx[i, j + 1]])
    u_, w_ = b - a, d - a; planar = 0.5 * abs(u_[0] * w_[1] - u_[1] * w_[0])
    errs.append(tot / planar - 1)
errs = np.array(errs)
out['cell_area_rel_err_maxabs_(24x24 geodesic subdivision, 400 cells)'] = float(np.abs(errs).max())
out['cell_area_rel_err_mean'] = float(errs.mean())
out['planar_cell_area_km2'] = float(4 * np.pi * 6371.0072 ** 2 / C)
print(json.dumps(out, indent=1))
json.dump(out, open(f'verify_snyder_n{n}.json', 'w'), indent=1)
