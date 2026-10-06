"""Fish map v2: uncut world-ocean disk, distortion optimised with land free.

Domain = sphere minus one eroded land region (the "outside"), a topological
disk; every other land mass stays in the mesh as cheap (low-weight) triangles.
The map is a piecewise-linear embedding found by minimising an ocean-weighted
distortion energy with a flip-free L-BFGS line search.
"""
import os, sys
from collections import deque
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import snyder as sn
import fishmap as fm
import straits as st

R_KM = fm.R_KM

# extra water routes that must read as continuous water (checked, and forced
# as water like the strait list)
ROUTES = {
    'Indonesian through-flow (Makassar-Lombok)': [(5, 127), (3, 122), (1, 119.5), (-2, 118), (-5, 118.5), (-7, 119),
                                                  (-8.3, 115.85), (-8.8, 115.8), (-10.5, 115.5)],
    'Indonesian through-flow (Molucca-Banda-Timor)': [(2, 126.5), (-1, 126.5), (-5, 128), (-7.5, 128.5), (-8.3, 127.5),
                                                      (-9.5, 128.0), (-11, 127)],
    'Banda-Arafura (south of New Guinea)': [(-6, 130), (-9.0, 130.0), (-9.5, 133), (-9.5, 137)],
    'Drake Passage (Pacific-Atlantic, 58S)': [(-58, -75), (-58, -66), (-58, -55)],
}
SEEDS = {'Afro-Eurasia': (50, 90), 'Americas': (40, -100), 'Antarctica': (-85, 0)}


class Mesh:
    def __init__(self, n, m=6):
        self.n = n
        pos, cells, cface, cxy = sn.lattice(n)
        self.pos, self.cells = pos, cells
        self.C = C = len(cells)
        E = {}
        for c, (a, b, d) in enumerate(cells):
            for u, v in ((a, b), (b, d), (d, a)):
                E.setdefault((min(u, v), max(u, v)), []).append(c)
        keys = list(E)
        self.eu = np.array([k[0] for k in keys]); self.ev = np.array([k[1] for k in keys])
        self.ec = np.array([E[k] for k in keys])
        self.eid = {k: i for i, k in enumerate(keys)}
        self.nbr = [[] for _ in range(C)]
        for a, b in self.ec:
            self.nbr[a].append(int(b)); self.nbr[b].append(int(a))
        self.vcells = [[] for _ in range(len(pos))]
        for c, t in enumerate(cells):
            for v in t:
                self.vcells[v].append(c)
        # barycentric samples in each geodesic triangle
        w = []
        for j in range(m):
            for i in range(m - j):
                w.append(((i + 1 / 3) / m, (j + 1 / 3) / m))
                if i + j <= m - 2:
                    w.append(((i + 2 / 3) / m, (j + 2 / 3) / m))
        w = np.array(w)
        P = pos[cells]
        S = P[:, None, 0] + w[None, :, :1] * (P[:, None, 1] - P[:, None, 0]) + w[None, :, 1:] * (P[:, None, 2] - P[:, None, 0])
        self.samp = S / np.linalg.norm(S, axis=2, keepdims=True)
        t = (np.arange(9) + 0.5) / 9
        Eu, Ev = pos[self.eu], pos[self.ev]
        ES = Eu[:, None] + t[None, :, None] * (Ev - Eu)[:, None]
        self.esamp = ES / np.linalg.norm(ES, axis=2, keepdims=True)
        # reference (true-shape) planar triangles, scaled to spherical area
        p0, p1, p2 = P[:, 0], P[:, 1], P[:, 2]
        e1 = p1 - p0; l1 = np.linalg.norm(e1, axis=1); u1 = e1 / l1[:, None]
        e2 = p2 - p0
        nrm = np.cross(e1, e2); u2 = np.cross(nrm, u1); u2 /= np.linalg.norm(u2, axis=1)[:, None]
        q1 = np.stack([l1, 0 * l1], 1); q2 = np.stack([np.einsum('ij,ij->i', e2, u1), np.einsum('ij,ij->i', e2, u2)], 1)
        chord_area = 0.5 * (q1[:, 0] * q2[:, 1])
        self.sph_area = sn.sph_area(p0, p1, p2)
        s = np.sqrt(self.sph_area / chord_area)
        Dm = np.stack([q1 * s[:, None], q2 * s[:, None]], 2)  # columns
        self.Dminv = np.linalg.inv(Dm)
        self.cent = P.mean(1); self.cent /= np.linalg.norm(self.cent, axis=1)[:, None]

    def locate(self, X):
        """cell index and barycentric coords of unit vectors X."""
        c = fm.cell_of(self, X)
        P = self.pos[self.cells[c]]
        lam = np.linalg.solve(np.transpose(P, (0, 2, 1)), X[..., None])[..., 0]
        lam /= lam.sum(1, keepdims=True)
        return c, lam


def classify(mesh):
    ocean, water, L = fm.masks()
    r, c = fm.pix(mesh.samp)
    focean = ocean[r, c].mean(1); fwater = water[r, c].mean(1)
    r, c = fm.pix(mesh.esamp)
    fedge = ocean[r, c].mean(1)
    forced = np.zeros(mesh.C, bool)
    for pts in list(st.STRAITS.values()) + list(ROUTES.values()):
        forced[fm.cell_of(mesh, fm.densify(pts))] = True
    return focean, fwater, fedge, forced


SEEDS.update({'Eurasia': (50, 90), 'Africa': (5, 20), 'NorthAmerica': (40, -100), 'SouthAmerica': (-10, -55)})
OUTSIDES = {'Afro-Eurasia (Sinai land slit)': (['Eurasia', 'Africa'], True),
            'Afro-Eurasia': (['Eurasia', 'Africa'], False),
            'Eurasia': (['Eurasia'], False), 'Africa': (['Africa'], False),
            'Americas (Panama land slit)': (['NorthAmerica', 'SouthAmerica'], True),
            'North America': (['NorthAmerica'], False), 'Antarctica': (['Antarctica'], False),
            # small inland disks: the outside region is only a disk of land around a
            # continental pole of inaccessibility; the rest of that continent stays in
            # the map as free land that absorbs the stretching of the outer rim
            'Eurasia inland disk': ('disk', 46.3, 86.7, 12.0),
            'Africa inland disk': ('disk', 5.6, 26.2, 12.0),
            'North America inland disk': ('disk', 43.4, -101.4, 9.0),
            'South America inland disk': ('disk', -14.0, -56.0, 9.0),
            'Antarctica inland disk': ('disk', -82.1, 55.0, 9.0)}


def _comp(mesh, mask, start):
    seen = np.zeros(mesh.C, bool); seen[start] = True; dq = deque([start])
    while dq:
        c = dq.popleft()
        for d in mesh.nbr[c]:
            if mask[d] and not seen[d]:
                seen[d] = True; dq.append(d)
    return seen


def land_slit(mesh, fedge, A, B, dom):
    """shortest edge path from region A's vertices to region B's vertices using
    only edges with no water along them (a cut that lies entirely on land)."""
    import heapq
    nV = len(mesh.pos)
    inA = np.zeros(nV, bool); inA[mesh.cells[A].ravel()] = True
    inB = np.zeros(nV, bool); inB[mesh.cells[B].ravel()] = True
    ok = (fedge == 0) & dom[mesh.ec[:, 0]] & dom[mesh.ec[:, 1]]
    adj = [[] for _ in range(nV)]
    L = np.arccos(np.clip(np.einsum('ij,ij->i', mesh.pos[mesh.eu], mesh.pos[mesh.ev]), -1, 1))
    for e in np.nonzero(ok)[0]:
        u, v = int(mesh.eu[e]), int(mesh.ev[e])
        adj[u].append((v, e)); adj[v].append((u, e))
    dist = np.full(nV, np.inf); pred = np.full(nV, -1)
    h = [(0.0, int(v)) for v in np.nonzero(inA)[0]]
    for _, v in h:
        dist[v] = 0
    heapq.heapify(h)
    while h:
        dd, v = heapq.heappop(h)
        if dd > dist[v]:
            continue
        if inB[v]:
            path = [v]
            while pred[path[-1]] != -1:
                path.append(int(pred[path[-1]]))
            return path[::-1], float(dd * R_KM)
        for u, e in adj[v]:
            if dd + L[e] < dist[u]:
                dist[u] = dd + L[e]; pred[u] = v; heapq.heappush(h, (dist[u], u))
    return None, None


def build_domain(mesh, focean, fwater, fedge, forced, outside, erode=1):
    parts, slit = OUTSIDES[outside]
    pure_land = (focean == 0) & ~forced  # lakes may lie inside the outside region
    core = pure_land.copy()
    for _ in range(erode):
        bad = np.zeros(len(mesh.pos), bool)
        bad[mesh.cells[~core].ravel()] = True
        core = core & ~bad[mesh.cells].any(1)
    comps = []
    for p in parts:
        seed = mesh.locate(fm.ll2vec(np.array([SEEDS[p][0]]), np.array([SEEDS[p][1]])))[0][0]
        assert core[seed], 'seed not in eroded land: ' + p
        comps.append(_comp(mesh, core, seed))
    R = np.any(comps, 0)
    ocean_seed = int(np.argmax(focean * ~R))
    dom = _comp(mesh, ~R, ocean_seed)
    enclosed = ~R & ~dom
    for it in range(50):  # remove pinch vertices (domain must be a manifold)
        bcount = np.zeros(len(mesh.pos), int)
        inter = dom[mesh.ec[:, 0]] != dom[mesh.ec[:, 1]]
        np.add.at(bcount, mesh.eu[inter], 1); np.add.at(bcount, mesh.ev[inter], 1)
        pinch = np.nonzero(bcount > 2)[0]
        if len(pinch) == 0:
            break
        for v in pinch:
            dom[mesh.vcells[v]] = True
    path, plen = (None, None)
    if slit:
        path, plen = land_slit(mesh, fedge, comps[0] & ~dom, comps[1] & ~dom, dom)
        assert path is not None, 'no land slit found'
    return dict(dom=dom, R=~dom, enclosed=enclosed, slit=path, slit_km=plen)


def build_scaffold(mesh, focean, forced, outside, erode=1, cap_rings=None):
    """Display domain = sphere minus the eroded outside land region R.
    Optimisation mesh = sphere minus a small cap at R's pole of inaccessibility:
    R stays in the mesh as a near-free scaffold, so the domain boundary cannot
    fold over itself (global injectivity), while the rim of the cap becomes the
    outer edge of the scaffold."""
    spec = OUTSIDES[outside]
    if spec[0] == 'disk':
        _, la, lo, rad = spec
        p0 = fm.ll2vec(np.array([la]), np.array([lo]))[0]
        ang = np.degrees(np.arccos(np.clip(mesh.cent @ p0, -1, 1)))
        R = ang <= rad
        assert focean[R].max() == 0 and not forced[R].any(), 'inland disk touches water'
        dom = ~R
        cap = ang <= rad / 2
        return dict(dom=dom, R=R, cap=cap, enclosed=np.zeros(mesh.C, bool), pole=int(np.argmin(ang)),
                    pole_depth_cells=-1)
    parts, _ = spec
    pure_land = (focean == 0) & ~forced
    core = pure_land.copy()
    for _ in range(erode):
        bad = np.zeros(len(mesh.pos), bool)
        bad[mesh.cells[~core].ravel()] = True
        core = core & ~bad[mesh.cells].any(1)
    comps = []
    for p in parts:
        seed = mesh.locate(fm.ll2vec(np.array([SEEDS[p][0]]), np.array([SEEDS[p][1]])))[0][0]
        assert core[seed], 'seed not in eroded land: ' + p
        comps.append(_comp(mesh, core, seed))
    R = np.any(comps, 0)
    ocean_seed = int(np.argmax(focean * ~R))
    dom = _comp(mesh, ~R, ocean_seed)
    enclosed = ~R & ~dom
    for it in range(50):  # no pinch vertices on the display boundary
        bcount = np.zeros(len(mesh.pos), int)
        inter = dom[mesh.ec[:, 0]] != dom[mesh.ec[:, 1]]
        np.add.at(bcount, mesh.eu[inter], 1); np.add.at(bcount, mesh.ev[inter], 1)
        pinch = np.nonzero(bcount > 2)[0]
        if len(pinch) == 0:
            break
        for v in pinch:
            dom[mesh.vcells[v]] = True
    R = ~dom
    # pole of inaccessibility of R (BFS steps from the domain) and cap around it
    dist = np.full(mesh.C, -1); dq = deque()
    for c in np.nonzero(dom)[0]:
        dist[c] = 0; dq.append(c)
    while dq:
        c = dq.popleft()
        for e in mesh.nbr[c]:
            if dist[e] < 0:
                dist[e] = dist[c] + 1; dq.append(e)
    pole = int(np.argmax(dist))
    if cap_rings is None:
        cap_rings = max(1, min(mesh.n // 6, int(dist[pole]) - 3))
    cap = np.zeros(mesh.C, bool); cap[pole] = True; fr = [pole]
    for _ in range(cap_rings):
        nx = []
        for c in fr:
            for v in mesh.cells[c]:
                for d in mesh.vcells[v]:
                    if not cap[d]:
                        cap[d] = True; nx.append(d)
        fr = nx
    if (cap & dom).any():   # thin outside region: grow the cap by edge steps instead
        k = max(1, int(dist[pole]) - 2)
        cap = np.zeros(mesh.C, bool); cap[pole] = True; fr = [pole]
        for _ in range(k - 1):
            nx = []
            for c in fr:
                for d in mesh.nbr[c]:
                    if not cap[d]:
                        cap[d] = True; nx.append(d)
            fr = nx
    assert not (cap & dom).any()
    return dict(dom=dom, R=R, cap=cap, enclosed=enclosed, pole=pole, pole_depth_cells=int(dist[pole]))


def make_tri(mesh, dom, slit):
    """domain triangles (global vertex ids); vertices on a land slit are
    duplicated so the slit opens into boundary on both sides."""
    cid = np.nonzero(dom)[0]
    tri = mesh.cells[cid].copy()
    vpos = list(mesh.pos)
    if slit:
        sedges = set()
        for u, v in zip(slit[:-1], slit[1:]):
            sedges.add((min(u, v), max(u, v)))
        loc = {c: i for i, c in enumerate(cid)}
        for v in slit:
            inc = [loc[c] for c in mesh.vcells[v] if c in loc]
            par = {t: t for t in inc}
            def f(t):
                while par[t] != t:
                    t = par[t]
                return t
            for i, t1 in enumerate(inc):
                for t2 in inc[i + 1:]:
                    common = set(tri[t1]) & set(tri[t2])
                    if len(common) == 2:
                        w = [x for x in common if x != v][0]
                        if (min(v, w), max(v, w)) not in sedges:
                            par[f(t1)] = f(t2)
            groups = {}
            for t in inc:
                groups.setdefault(f(t), []).append(t)
            for gi, ts in enumerate(sorted(groups.values(), key=len)[:-1]):
                nid = len(vpos); vpos.append(mesh.pos[v])
                for t in ts:
                    tri[t][tri[t] == v] = nid
    return cid, tri, np.array(vpos)


def topology(tri):
    E = {}
    for t in tri:
        for k in range(3):
            u, v = int(t[k]), int(t[(k + 1) % 3])
            E[(min(u, v), max(u, v))] = E.get((min(u, v), max(u, v)), 0) + 1
    V = len(np.unique(tri))
    bnd = [e for e, c in E.items() if c == 1]
    adj = {}
    for u, v in bnd:
        adj.setdefault(u, []).append(v); adj.setdefault(v, []).append(u)
    seen = set(); loops = 0
    for s0 in adj:
        if s0 in seen:
            continue
        loops += 1; st_ = [s0]
        while st_:
            x = st_.pop()
            if x in seen:
                continue
            seen.add(x); st_ += adj[x]
    return dict(V=V, E=len(E), F=len(tri), euler=V - len(E) + len(tri), boundary_loops=loops,
                boundary_edges=len(bnd), max_boundary_degree=max(len(a) for a in adj.values()),
                nonmanifold_edges=sum(1 for c in E.values() if c > 2))


# ---------------------------------------------------------------- optimiser
class Problem:
    def __init__(self, mesh, cid, tri_g, vpos, wc, wa):
        self.cid = cid
        self.vid, inv = np.unique(tri_g, return_inverse=True)
        self.tri = inv.reshape(-1, 3)
        self.X = vpos[self.vid]
        self.Dminv = mesh.Dminv[cid]
        A = mesh.sph_area[cid]
        self.wc = wc[cid] * A; self.wa = wa[cid] * A
        self.nv = len(self.vid)
        self.power = 1.0

    def J(self, x):
        t = self.tri
        Ds = np.stack([x[t[:, 1]] - x[t[:, 0]], x[t[:, 2]] - x[t[:, 0]]], 2)
        return Ds, Ds @ self.Dminv

    def eval(self, x, grad=True):
        Ds, J = self.J(x)
        a, b, c, d = J[:, 0, 0], J[:, 0, 1], J[:, 1, 0], J[:, 1, 1]
        D = a * d - b * c
        if (D <= 0).any():
            return np.inf, None
        F = a * a + b * b + c * c + d * d
        p = self.power
        fc = F / D; fa = D + 1 / D          # conformal (>=2) and area (>=2) distortion
        E = float((self.wc * fc ** p + self.wa * fa ** p).sum())
        if not grad:
            return E, None
        kc = self.wc * p * fc ** (p - 1); ka = self.wa * p * fa ** (p - 1)
        cof = np.stack([np.stack([d, -c], 1), np.stack([-b, a], 1)], 1)
        dJ = (kc / D)[:, None, None] * 2 * J + (-kc * F / D ** 2 + ka * (1 - 1 / D ** 2))[:, None, None] * cof
        dDs = dJ @ np.transpose(self.Dminv, (0, 2, 1))
        g1, g2 = dDs[:, :, 0], dDs[:, :, 1]
        g0 = -g1 - g2
        g = np.zeros((self.nv, 2))
        t = self.tri
        for k, gk in ((0, g0), (1, g1), (2, g2)):
            g[:, 0] += np.bincount(t[:, k], gk[:, 0], self.nv)
            g[:, 1] += np.bincount(t[:, k], gk[:, 1], self.nv)
        return E, g

    def max_step(self, x, p):
        t = self.tri
        Ds = np.stack([x[t[:, 1]] - x[t[:, 0]], x[t[:, 2]] - x[t[:, 0]]], 2)
        Pm = np.stack([p[t[:, 1]] - p[t[:, 0]], p[t[:, 2]] - p[t[:, 0]]], 2)
        a0 = Ds[:, 0, 0] * Ds[:, 1, 1] - Ds[:, 0, 1] * Ds[:, 1, 0]
        a1 = Ds[:, 0, 0] * Pm[:, 1, 1] + Pm[:, 0, 0] * Ds[:, 1, 1] - Ds[:, 0, 1] * Pm[:, 1, 0] - Pm[:, 0, 1] * Ds[:, 1, 0]
        a2 = Pm[:, 0, 0] * Pm[:, 1, 1] - Pm[:, 0, 1] * Pm[:, 1, 0]
        roots = np.full(len(t), np.inf)
        lin = np.abs(a2) < 1e-30
        with np.errstate(divide='ignore', invalid='ignore'):
            r = -a0 / a1
            roots = np.where(lin & (r > 0), r, roots)
            disc = a1 * a1 - 4 * a2 * a0
            sq = np.sqrt(np.where(disc >= 0, disc, np.nan))
            for s in (-1, 1):
                r = (-a1 + s * sq) / (2 * a2)
                roots = np.where(~lin & (disc >= 0) & (r > 0) & (r < roots), r, roots)
        return float(roots.min())


def untangle(prob, x, eps=0.05, iters=5000):
    """push non-positive triangles (det J below eps) back to positive orientation
    by gradient descent on sum(max(0, eps - det J)^2); a vertex move is accepted
    only if it does not create a new non-positive triangle."""
    t = prob.tri
    for it in range(iters):
        Ds, J = prob.J(x)
        D = J[:, 0, 0] * J[:, 1, 1] - J[:, 0, 1] * J[:, 1, 0]
        bad = D < eps
        if not (D <= 0).any():
            return x, it
        a, b, c, d = J[bad, 0, 0], J[bad, 0, 1], J[bad, 1, 0], J[bad, 1, 1]
        cof = np.stack([np.stack([d, -c], 1), np.stack([-b, a], 1)], 1)
        dJ = (-2 * (eps - D[bad]))[:, None, None] * cof
        dDs = dJ @ np.transpose(prob.Dminv[bad], (0, 2, 1))
        g = np.zeros_like(x)
        tb = t[bad]
        for k, gk in ((0, -dDs[:, :, 0] - dDs[:, :, 1]), (1, dDs[:, :, 0]), (2, dDs[:, :, 1])):
            g[:, 0] += np.bincount(tb[:, k], gk[:, 0], prob.nv); g[:, 1] += np.bincount(tb[:, k], gk[:, 1], prob.nv)
        nflip = int((D <= 0).sum())
        step = 1.0 / (np.abs(g).max() + 1e-30) * np.abs(x).max() * 1e-3
        for _ in range(30):
            xn = x - step * g
            Dn = np.linalg.det(prob.J(xn)[1])
            if int((Dn <= 0).sum()) < nflip or (int((Dn <= 0).sum()) == nflip and ((np.minimum(Dn, eps) - eps) ** 2).sum() < ((np.minimum(D, eps) - eps) ** 2).sum()):
                break
            step *= 0.5
        x = xn
    return x, iters


def lbfgs(prob, x, iters=3000, mem=12, tol=1e-10, log=None, every=250):
    E, g = prob.eval(x)
    S, Y = [], []
    hist = []
    for it in range(iters):
        q = g.ravel().copy(); al = []
        for s, y in reversed(list(zip(S, Y))):
            r = 1 / (y @ s); a = r * (s @ q); q -= a * y; al.append((r, a))
        if S:
            q *= (S[-1] @ Y[-1]) / (Y[-1] @ Y[-1])
        for (s, y), (r, a) in zip(zip(S, Y), reversed(al)):
            b = r * (y @ q); q += s * (a - b)
        p = -q.reshape(x.shape)
        if (p.ravel() @ g.ravel()) >= 0:
            p = -g; S, Y = [], []
        amax = prob.max_step(x, p)
        step = min(1.0, 0.9 * amax)
        gp = p.ravel() @ g.ravel()
        while True:
            xn = x + step * p
            En, _ = prob.eval(xn, grad=False)
            if En <= E + 1e-4 * step * gp:
                break
            step *= 0.5
            if step < 1e-20:
                break
        if step < 1e-20:
            if not S:
                break          # steepest descent failed too: converged/stuck
            S, Y = [], []      # reset the quasi-Newton memory and retry
            continue
        En, gn = prob.eval(xn)
        s = (xn - x).ravel(); y = (gn - g).ravel()
        if s @ y > 1e-20:
            S.append(s); Y.append(y)
            if len(S) > mem:
                S.pop(0); Y.pop(0)
        dE = E - En
        x, E, g = xn, En, gn
        hist.append(E)
        if log and it % every == 0:
            log(f'  it {it} E {E:.6f} |g| {np.abs(g).max():.2e} step {step:.2e}')
        if len(hist) > 100 and (hist[-100] - E) < tol * abs(E) * 100:
            break
    return x, E, len(hist)


def laea_init(mesh, prob, centre):
    """azimuthal equidistant projection centred on the antipode of `centre`
    (a continuous, cut-free start; the cap around `centre` is removed, which
    keeps the rim anisotropy low enough that no triangle starts flipped)."""
    c0 = -centre / np.linalg.norm(centre)
    a = np.array([1.0, 0, 0]) if abs(c0[0]) < 0.9 else np.array([0, 1.0, 0])
    e1 = np.cross(c0, a); e1 /= np.linalg.norm(e1); e2 = np.cross(c0, e1)
    X = prob.X
    cz = np.clip(X @ c0, -1, 1)
    c = np.arccos(cz)
    k = c / np.maximum(np.sin(c), 1e-12)   # azimuthal equidistant
    x = np.stack([k * (X @ e1), k * (X @ e2)], 1)
    Ds, J = prob.J(x)
    if (np.linalg.det(J) <= 0).any():      # fall back to stereographic (conformal: no flips)
        k = 2 / (1 + cz)
        x = np.stack([k * (X @ e1), k * (X @ e2)], 1)
    return x


def metrics(mesh, prob, x, focean, forced, show=None):
    Ds, J = prob.J(x)
    a, b, c, d = J[:, 0, 0], J[:, 0, 1], J[:, 1, 0], J[:, 1, 1]
    D = a * d - b * c
    F = a * a + b * b + c * c + d * d
    disc = np.sqrt(np.maximum(F * F - 4 * D * D, 0))
    s1 = np.sqrt((F + disc) / 2); s2 = np.sqrt(np.maximum((F - disc) / 2, 0))
    omega = np.degrees(2 * np.arcsin((s1 - s2) / (s1 + s2)))
    cid = prob.cid
    wo = np.maximum(focean[cid], forced[cid] * 1.0) * mesh.sph_area[cid]
    scale = (D * wo).sum() / wo.sum()  # normalise: ocean-weighted mean area scale = 1
    area = D / scale
    def wq(v, w, qs):
        o = np.argsort(v); cw = np.cumsum(w[o]) / w.sum()
        return [float(np.interp(q, cw, v[o])) for q in qs]
    oc = wo > 0
    out = dict(
        omega_ocean_mean=float((omega * wo).sum() / wo.sum()),
        omega_ocean_p50_p90_p99=wq(omega, wo, [.5, .9, .99]),
        omega_max_any_ocean=float(omega[oc].max()),
        omega_max_mostly_ocean=float(omega[focean[cid] >= 0.5].max()),
        area_ocean_mean=float((area * wo).sum() / wo.sum()),
        area_ocean_p10_p50_p90=wq(area, wo, [.1, .5, .9]),
        area_ocean_p01_p99=wq(area, wo, [.01, .99]),
        area_max_min_mostly_ocean=[float(area[focean[cid] >= 0.5].max()), float(area[focean[cid] >= 0.5].min())],
        area_max_min_any_ocean=[float(area[oc].max()), float(area[oc].min())],
        ocean_area_error_total=float(abs(area - 1)[oc] @ wo[oc] / wo[oc].sum()),
    )
    land = (focean[cid] == 0) & (show if show is not None else True)
    if land.any():
        wl = mesh.sph_area[cid][land]
        out['land_area_scale_p10_p50_p90'] = wq(area[land], wl, [.1, .5, .9])
        out['land_omega_p50_p90'] = wq(omega[land], wl, [.5, .9])
        out['land_total_area_ratio'] = float((area[land] * wl).sum() / wl.sum())
    out['flipped_triangles'] = int((D <= 0).sum())
    return out, omega, area


def boundary_polygon(mesh, prob):
    t = prob.tri
    cnt = {}
    for tr in t:
        for k in range(3):
            u, v = int(tr[k]), int(tr[(k + 1) % 3])
            cnt[(u, v)] = cnt.get((u, v), 0) + 1
    bedges = [(u, v) for (u, v) in cnt if (v, u) not in cnt]
    nxt = {u: v for u, v in bedges}
    start = bedges[0][0]; loop = [start]
    while True:
        nx = nxt[loop[-1]]
        if nx == start:
            break
        loop.append(nx)
    return np.array(loop), len(bedges)


def injectivity(mesh, prob, x):
    """locally injective (det>0) + interior angle sums 2pi + simple boundary
    => globally injective (embedding of the disk)."""
    loop, nb = boundary_polygon(mesh, prob)
    out = {'boundary_vertices': len(loop), 'boundary_edges': nb, 'single_boundary_loop': len(loop) == nb}
    # angle sums at interior vertices
    t = prob.tri
    ang = np.zeros(prob.nv)
    for k in range(3):
        p = x[t[:, k]]; q = x[t[:, (k + 1) % 3]]; r = x[t[:, (k + 2) % 3]]
        u = q - p; v = r - p
        a = np.arctan2(u[:, 0] * v[:, 1] - u[:, 1] * v[:, 0], (u * v).sum(1))
        ang += np.bincount(t[:, k], a, prob.nv)
    interior = np.ones(prob.nv, bool); interior[loop] = False
    out['max_interior_angle_sum_error_rad'] = float(np.abs(ang[interior] - 2 * np.pi).max())
    # boundary self-intersection (segment sweep in blocks)
    P = x[loop]; Q = np.roll(P, -1, 0)
    n = len(P); hits = 0
    lo = np.minimum(P, Q); hi = np.maximum(P, Q)
    order = np.argsort(lo[:, 0])
    for bi in range(0, n, 2000):
        idx = np.arange(bi, min(n, bi + 2000))
        A, B = P[idx], Q[idx]
        ov = (lo[idx, None, 0] <= hi[None, :, 0]) & (hi[idx, None, 0] >= lo[None, :, 0]) & \
             (lo[idx, None, 1] <= hi[None, :, 1]) & (hi[idx, None, 1] >= lo[None, :, 1])
        ii, jj = np.nonzero(ov)
        ii_g = idx[ii]
        keep = (jj > ii_g) & (np.abs(jj - ii_g) > 1) & ~((ii_g == 0) & (jj == n - 1))
        ii, jj = ii[keep], jj[keep]
        a, b, c, d = A[ii], B[ii], P[jj], Q[jj]
        def cr(o, p, q):
            return (p[:, 0] - o[:, 0]) * (q[:, 1] - o[:, 1]) - (p[:, 1] - o[:, 1]) * (q[:, 0] - o[:, 0])
        d1, d2, d3, d4 = cr(a, b, c), cr(a, b, d), cr(c, d, a), cr(c, d, b)
        hits += int(((d1 * d2 < 0) & (d3 * d4 < 0)).sum())
    out['boundary_self_intersections'] = hits
    signed = 0.5 * np.sum(P[:, 0] * Q[:, 1] - Q[:, 0] * P[:, 1])
    out['boundary_orientation_ccw'] = bool(signed > 0)
    return out, loop
