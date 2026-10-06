"""Core pipeline: classify equal-area lattice cells, keep the connected world
ocean, choose cuts, unfold onto the plane, and measure the result."""
import os, sys, heapq
from collections import deque
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import snyder as sn

HERE = os.path.dirname(os.path.abspath(__file__))
SCR = os.path.dirname(HERE)
R_KM = 6371.0072  # authalic radius
W, H = 4320, 2160
# world ocean = pixel component 1, plus Black Sea (27), Sea of Azov (21) and
# Sea of Marmara (32), whose real straits (Bosporus 0.7 km, Dardanelles 1.2 km,
# Kerch 4 km) are narrower than the 9 km mask pixels.
OCEAN_LABELS = [1, 27, 21, 32]

_mask = None


def masks():
    global _mask
    if _mask is None:
        m = np.fromfile(os.path.join(SCR, 'mask.bin'), np.uint8).reshape(H, W)
        L = np.fromfile(os.path.join(HERE, 'labels.bin'), np.int32).reshape(H, W)
        _mask = (np.isin(L, OCEAN_LABELS), m == 0, L)
    return _mask


def lonlat(X):
    lat = np.degrees(np.arcsin(np.clip(X[..., 2], -1, 1)))
    lon = np.degrees(np.arctan2(X[..., 1], X[..., 0]))
    return lon, lat


def pix(X):
    lon, lat = lonlat(X)
    r = np.clip(((90 - lat) * 12).astype(int), 0, H - 1)
    c = np.clip(((lon + 180) * 12).astype(int), 0, W - 1)
    return r, c


def rotation(q):
    q = np.asarray(q, float); q = q / np.linalg.norm(q)
    w, x, y, z = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


class Prep:
    def __init__(self, n, m=6):
        self.n = n
        pos, cells, cface, cxy = sn.lattice(n)
        self.pos, self.cells, self.cface, self.cxy = pos, cells, cface, cxy
        C = len(cells); self.C = C
        # m x m sub-triangle centroids per cell: used for the ocean fraction
        # and for the water "pieces" inside each cell (isthmus detection)
        sxy = sn.cell_samples(cxy, m)
        ns = sxy.shape[1]
        flat = sxy.reshape(-1, 2); fface = np.repeat(cface, ns)
        samp = np.empty((len(flat), 3))
        for s0 in range(0, len(flat), 500000):
            samp[s0:s0 + 500000] = sn.inverse(fface[s0:s0 + 500000], flat[s0:s0 + 500000])
        self.samp = samp.reshape(C, ns, 3)
        self.m = m
        up, dn = {}, {}
        k = 0
        for j in range(m):
            for i in range(m - j):
                up[i, j] = k; k += 1
                if i + j <= m - 2:
                    dn[i, j] = k; k += 1
        pairs = []
        for (i, j), d in dn.items():
            pairs += [(d, up[i, j]), (d, up[i + 1, j]), (d, up[i, j + 1])]
        self.sub_pairs = np.array(pairs)
        # boundary sub-triangles along cell edges (a,b), (b,c), (c,a)
        self.sub_edge = [np.array([up[i, 0] for i in range(m)]),
                         np.array([up[m - 1 - j, j] for j in range(m)]),
                         np.array([up[0, j] for j in range(m)])]
        # distortion at a 3x3 subset of sample points (rotation independent);
        # a tiny offset keeps finite differences off the kinks of the piecewise map
        oxy = sn.cell_samples(cxy, 3); no = oxy.shape[1]
        jit = np.random.default_rng(7).normal(size=(C * no, 2)) * 1e-3 * sn.S / n
        _, om = sn.jacobian_stats(np.repeat(cface, no), oxy.reshape(-1, 2) + jit, h=1e-9)
        om = om.reshape(C, no)
        self.om_mean = np.nanmean(om, 1); self.om_max = np.nanmax(om, 1)
        E = {}
        for c, (a, b, d) in enumerate(cells):
            for k, (u, v) in enumerate(((a, b), (b, d), (d, a))):
                E.setdefault((min(u, v), max(u, v)), []).append(c)
        keys = list(E.keys())
        self.eu = np.array([k[0] for k in keys]); self.ev = np.array([k[1] for k in keys])
        self.ec = np.array([E[k] for k in keys])
        self.eid = {k: i for i, k in enumerate(keys)}
        self.elen = R_KM * np.arccos(np.clip(np.einsum('ij,ij->i', pos[self.eu], pos[self.ev]), -1, 1))
        self.cone = np.array([int(np.argmax(pos @ v)) for v in sn.VERT])
        # cell -> its 3 edge ids
        ce = np.zeros((C, 3), int)
        for c, (a, b, d) in enumerate(cells):
            for k, (u, v) in enumerate(((a, b), (b, d), (d, a))):
                ce[c, k] = self.eid[(min(u, v), max(u, v))]
        self.ce = ce
        self.ecl = np.stack([np.argmax(ce[self.ec[:, 0]] == np.arange(len(keys))[:, None], 1),
                             np.argmax(ce[self.ec[:, 1]] == np.arange(len(keys))[:, None], 1)], 1)
        self.cell_km2 = 4 * np.pi * R_KM ** 2 / C
        # sample points along every edge (the edge is a straight lattice segment
        # in the face plane, a slightly curved line on the sphere)
        ke = 11
        t = (np.arange(ke) + 0.5) / ke
        c0 = self.ec[:, 0]
        cv = cells[c0]
        iu = np.argmax(cv == self.eu[:, None], 1); iv = np.argmax(cv == self.ev[:, None], 1)
        xu = cxy[c0, iu]; xv = cxy[c0, iv]
        exy = xu[:, None] + t[None, :, None] * (xv - xu)[:, None]
        self.esamp = sn.inverse(np.repeat(self.cface[c0], ke), exy.reshape(-1, 2)).reshape(len(c0), ke, 3)
        self.nbr = [[] for _ in range(C)]
        for e, (a, b) in enumerate(self.ec):
            self.nbr[a].append((int(b), e)); self.nbr[b].append((int(a), e))
        self.vadj = [[] for _ in range(len(pos))]
        for e, (u, v) in enumerate(zip(self.eu, self.ev)):
            self.vadj[u].append((v, e)); self.vadj[v].append((u, e))


class UF:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, a):
        p = self.p
        while p[a] != a:
            p[a] = p[p[a]]; a = p[a]
        return a

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b:
            return False
        self.p[a] = b
        return True


def classify(prep, R):
    ocean, water, L = masks()
    Xe = prep.samp @ R.T
    r, c = pix(Xe)
    return ocean[r, c].mean(1), water[r, c].mean(1), L[r, c]


def components(prep, keep):
    uf = UF(prep.C)
    both = keep[prep.ec[:, 0]] & keep[prep.ec[:, 1]]
    for a, b in prep.ec[both]:
        uf.union(int(a), int(b))
    root = np.array([uf.find(c) for c in range(prep.C)])
    return root


def cell_of(prep, Xm):
    """cell index containing each unit vector (mesh frame)."""
    face, xy = sn.forward(Xm)
    n = prep.n; sl = sn.S / n
    v = xy[:, 1] / (sl * np.sqrt(3) / 2); u = xy[:, 0] / sl - v / 2
    j = np.clip(np.floor(v).astype(int), 0, n - 1)
    i = np.clip(np.floor(u).astype(int), 0, None)
    up = (u - i) + (v - j) < 1
    over = i + j > n - 1
    i = np.where(over, n - 1 - j, i)
    up = up | over | (i + j == n - 1)
    tab = np.full((n, n, 2), -1)
    k = 0
    for jj in range(n):
        for ii in range(n - jj):
            tab[ii, jj, 1] = k; k += 1
            if ii + jj <= n - 2:
                tab[ii, jj, 0] = k; k += 1
    loc = tab[i, j, up.astype(int)]
    assert (loc >= 0).all()
    return face * k + loc


def ll2vec(lat, lon):
    la, lo = np.radians(lat), np.radians(lon)
    return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)


def densify(pts, step_km=4.0):
    X = ll2vec(np.array([p[0] for p in pts]), np.array([p[1] for p in pts]))
    out = []
    for a, b in zip(X[:-1], X[1:]):
        g = np.arccos(np.clip(a @ b, -1, 1))
        k = max(2, int(g * R_KM / step_km))
        t = np.linspace(0, 1, k)[:-1]
        out.append((np.sin((1 - t) * g)[:, None] * a + np.sin(t * g)[:, None] * b) / np.sin(g))
    out.append(X[-1:])
    return np.concatenate(out)


def polyline_cells(prep, R, pts):
    """ordered list of distinct cells along a lat/lon polyline."""
    c = cell_of(prep, densify(pts) @ R)
    seq = [int(c[0])]
    for x in c[1:]:
        if x != seq[-1]:
            seq.append(int(x))
    return seq


def cell_path(prep, a, b, score, maxd=4):
    """shortest dual-graph path a->b (ties: wettest)."""
    prev = {a: None}; frontier = [a]
    for _ in range(maxd):
        nxt = []
        for c in sorted(frontier, key=lambda x: -score[x]):
            for d, e in prep.nbr[c]:
                if d not in prev:
                    prev[d] = (c, e); nxt.append(d)
        if b in prev:
            break
        frontier = nxt
    if b not in prev:
        return None
    cells, edges = [b], []
    x = b
    while prev[x] is not None:
        c, e = prev[x]; edges.append(e); cells.append(c); x = c
    return cells[::-1], edges[::-1]


def classify(prep, R):
    ocean, water, L = masks()
    r, c = pix(prep.samp @ R.T)
    wet = ocean[r, c]
    focean = wet.mean(1); fwater = water[r, c].mean(1)
    r, c = pix(prep.esamp @ R.T)
    fedge = ocean[r, c].mean(1)
    # water pieces inside each cell: connected wet sub-triangles
    ns = wet.shape[1]
    big = ns + 1
    lab = np.where(wet, np.arange(ns)[None, :], big)
    p, q = prep.sub_pairs[:, 0], prep.sub_pairs[:, 1]
    both = wet[:, p] & wet[:, q]
    while True:
        # min-label propagation across adjacent wet sub-triangles; values only
        # decrease, so iterating to a fixed point labels each piece uniformly
        mn = np.where(both, np.minimum(lab[:, p], lab[:, q]), big)
        newT = lab.T.copy()
        np.minimum.at(newT, p, mn.T)   # unbuffered: repeated indices all apply
        np.minimum.at(newT, q, mn.T)
        newT = np.where(wet.T, newT, big)
        if (newT == lab.T).all():
            break
        lab = newT.T
    C = len(wet)
    cnt = np.bincount((np.arange(C)[:, None] * (ns + 2) + lab).ravel(), minlength=C * (ns + 2)).reshape(C, ns + 2)
    cnt[:, big] = 0
    dom = np.argmax(cnt, 1)
    touch = np.stack([((lab[:, idx] == dom[:, None]) & wet[:, idx]).any(1) for idx in prep.sub_edge], 1)
    wet_side = np.stack([wet[:, idx].any(1) for idx in prep.sub_edge], 1)
    split = (wet_side & ~touch).any(1)  # some wet edge belongs to a minor piece
    return focean, fwater, fedge, touch, split


def select_cells(prep, R, keep_min=0.05, wet_min=0.5, leaf_min=0.2, straits=None):
    """Keep every cell with meaningful ocean; join two cells only across an edge
    that is mostly water (or a hard-coded strait); keep the component that holds
    the world ocean."""
    if straits is None:
        import straits as stm
        straits = stm.STRAITS
    focean, fwater, fedge, touch, split = classify(prep, R)
    # an edge may only join through the dominant water piece of both cells
    # (no swimming across an isthmus hidden inside one cell)
    piece_ok = touch[prep.ec[:, 0], prep.ecl[:, 0]] & touch[prep.ec[:, 1], prep.ecl[:, 1]]
    C = prep.C
    forced_cells = np.zeros(C, bool); forced_edges = np.zeros(len(prep.eu), bool)
    strait_info = {}
    for name, pts in straits.items():
        seq = polyline_cells(prep, R, pts)
        cells_s, edges_s = [seq[0]], []
        for a, b in zip(seq[:-1], seq[1:]):
            p = cell_path(prep, a, b, focean)
            cells_s += p[0][1:]; edges_s += p[1]
        forced_cells[cells_s] = True; forced_edges[edges_s] = True
        strait_info[name] = dict(cells=cells_s, edges=edges_s,
                                 natural_edges=int(sum(fedge[e] >= wet_min for e in edges_s)))
    cand = (focean >= keep_min) | forced_cells
    a, b = prep.ec[:, 0], prep.ec[:, 1]
    joinable = cand[a] & cand[b] & (((fedge >= wet_min) & piece_ok) | forced_edges)
    leaf = np.zeros(len(prep.eu), bool)
    while True:
        root = components_on(prep, joinable)
        area = {}
        for c in np.nonzero(cand)[0]:
            area[root[c]] = area.get(root[c], 0) + focean[c]
        main = max(area, key=area.get)
        inmain = (root == main) & cand
        # leaf rule: a detached group attaches through its single wettest edge
        # to the main ocean if that edge is at least leaf_min water
        best = {}
        for e in np.nonzero(cand[a] & cand[b] & (inmain[a] != inmain[b]) & (fedge >= leaf_min) & piece_ok & ~joinable)[0]:
            r = root[a[e]] if not inmain[a[e]] else root[b[e]]
            if r not in best or fedge[e] > fedge[best[r]]:
                best[r] = e
        if not best:
            break
        for e in best.values():
            joinable[e] = True; leaf[e] = True
    keep = inmain
    joinable &= keep[a] & keep[b]
    dropped_groups = []
    for r in set(root[cand & ~keep]):
        cs = np.nonzero((root == r) & cand)[0]
        dropped_groups.append(cs)
    return dict(focean=focean, fwater=fwater, fedge=fedge, keep=keep, cand=cand, split=split,
                piece_blocked=(fedge >= wet_min) & ~piece_ok & cand[a] & cand[b] & ~forced_edges,
                joinable=joinable, forced_edges=forced_edges & joinable, forced_cells=forced_cells,
                leaf=leaf, straits=strait_info, dropped_groups=dropped_groups,
                wet_min=wet_min, keep_min=keep_min, leaf_min=leaf_min)


def components_on(prep, edgemask):
    uf = UF(prep.C)
    for a, b in prep.ec[edgemask]:
        uf.union(int(a), int(b))
    return np.array([uf.find(c) for c in range(prep.C)])


def steiner_cuts(prep, sel, rng=None, jitter=0.0):
    """Cut set: Steiner tree (Mehlhorn 2-approximation) through joinable (wet)
    edges connecting every free component that carries curvature (icosahedron
    vertex cone points). Free = edges that are not joins anyway: coast, land,
    peninsulas, dropped cells. Strait edges are never cut."""
    nE = len(prep.eu)
    interior = sel['joinable']
    w = np.where(interior, prep.elen, 0.0)
    w = np.where(sel['forced_edges'], 1e12, w)
    if rng is not None and jitter > 0:
        w = w * np.exp(jitter * rng.normal(size=nE))
    nV = len(prep.pos)
    uf = UF(nV)
    for e in np.nonzero(~interior)[0]:
        uf.union(int(prep.eu[e]), int(prep.ev[e]))
    comp = np.array([uf.find(v) for v in range(nV)])
    charge = {}
    for v in prep.cone:
        charge[comp[v]] = charge.get(comp[v], 0) + 1
    terms = list(charge)
    cut = np.zeros(nE, bool)
    if len(terms) <= 1:
        return cut, charge, comp
    dist = np.full(nV, np.inf); src = np.full(nV, -1); pred = np.full(nV, -1)
    tset = set(terms)
    h = []
    for v in range(nV):
        if comp[v] in tset:
            dist[v] = 0; src[v] = comp[v]; h.append((0.0, v))
    heapq.heapify(h)
    while h:
        d, v = heapq.heappop(h)
        if d > dist[v]:
            continue
        for u, e in prep.vadj[v]:
            nd = d + w[e]
            if nd < dist[u]:
                dist[u] = nd; src[u] = src[v]; pred[u] = e; heapq.heappush(h, (nd, u))
    best = {}
    for e in range(nE):
        u, v = prep.eu[e], prep.ev[e]
        a, b = src[u], src[v]
        if a != b:
            key = (min(a, b), max(a, b))
            cst = dist[u] + w[e] + dist[v]
            if key not in best or cst < best[key][0]:
                best[key] = (cst, e)
    tuf = UF(nV)
    cuf = UF(nV)
    for e in np.nonzero(~interior)[0]:
        cuf.union(int(prep.eu[e]), int(prep.ev[e]))
    for (a, b), (cst, e) in sorted(best.items(), key=lambda kv: kv[1][0]):
        if not tuf.union(a, b):
            continue
        path = [e]
        for x in (prep.eu[e], prep.ev[e]):
            while pred[x] != -1:
                pe = pred[x]; path.append(pe)
                x = prep.eu[pe] if prep.ev[pe] == x else prep.ev[pe]
        for pe in path:
            if interior[pe] and cuf.union(int(prep.eu[pe]), int(prep.ev[pe])):
                cut[pe] = True
    return cut, charge, comp


def layout(prep, keep, allowed, root_cell):
    """Unfold kept cells onto one triangular lattice (integer coords) by a BFS
    spanning tree over allowed (joinable, uncut) edges. Neighbour across edge
    (u,v) gets its third vertex at u+v-w (rhombus rule; all cells congruent)."""
    C = prep.C
    sl = sn.S / prep.n
    rel = prep.cxy[root_cell] / sl
    jj = np.rint(rel[:, 1] / (np.sqrt(3) / 2)); ii = np.rint(rel[:, 0] - jj / 2)
    P = {root_cell: {int(v): (int(x), int(y)) for v, x, y in zip(prep.cells[root_cell], ii, jj)}}
    tree = np.zeros(len(prep.eu), bool)
    dq = deque([root_cell])
    while dq:
        c = dq.popleft()
        pc = P[c]
        for k in range(3):
            e = prep.ce[c, k]
            if not allowed[e]:
                continue
            d = int(prep.ec[e, 0] if prep.ec[e, 1] == c else prep.ec[e, 1])
            if d in P:
                continue
            u, v = int(prep.eu[e]), int(prep.ev[e])
            wc = [int(x) for x in prep.cells[c] if x != u and x != v][0]
            wd = [int(x) for x in prep.cells[d] if x != u and x != v][0]
            pu, pv, pw = pc[u], pc[v], pc[wc]
            P[d] = {u: pu, v: pv, wd: (pu[0] + pv[0] - pw[0], pu[1] + pv[1] - pw[1])}
            tree[e] = True
            dq.append(d)
    return P, tree


def to_xy(ij):
    ij = np.asarray(ij, float)
    return np.stack([ij[..., 0] + ij[..., 1] / 2, ij[..., 1] * np.sqrt(3) / 2], -1)


def analyse(prep, sel, cut, P, tree):
    keep = sel['keep']; J = sel['joinable']
    out = {}
    out['kept_cells'] = int(keep.sum()); out['placed_cells'] = len(P)
    a, b = prep.ec[:, 0], prep.ec[:, 1]
    between_kept = keep[a] & keep[b]
    joined = np.zeros(len(prep.eu), bool)
    for e in np.nonzero(between_kept)[0]:
        ca, cb = int(a[e]), int(b[e])
        if ca in P and cb in P:
            u, v = int(prep.eu[e]), int(prep.ev[e])
            if P[ca][u] == P[cb][u] and P[ca][v] == P[cb][v]:
                joined[e] = True
    out['water_joins'] = int((joined & J).sum())
    # dry edge whose two cells still meet in the plane: topologically cut (not a
    # join), but with zero opening because no curvature is released there
    out['closed_land_seams'] = int((joined & ~J).sum())
    out['tree_edges_not_matching'] = int((tree & ~joined).sum())
    ocean_cut = J & ~joined
    out['ocean_cut_edges'] = int(ocean_cut.sum())
    out['ocean_cut_km'] = float(prep.elen[ocean_cut].sum())
    # same, weighted by the water fraction along each edge (km of water severed)
    out['ocean_cut_water_km'] = float((prep.elen * sel['fedge'])[ocean_cut].sum())
    gap = between_kept & ~J & ~joined
    out['open_land_gaps'] = int(gap.sum()); out['open_land_gap_km'] = float(prep.elen[gap].sum())
    out['steiner_cut_edges'] = int(cut.sum())
    keys = {}; dup = 0; neg = 0; edge_owner = {}
    for c, pc in P.items():
        tri = [pc[int(v)] for v in prep.cells[c]]
        (x0, y0), (x1, y1), (x2, y2) = to_xy(tri)
        if (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0) <= 0:
            neg += 1
        k = tuple(sorted(tri))
        if k in keys:
            dup += 1
        keys[k] = c
        for i in range(3):
            edge_owner.setdefault(tuple(sorted((tri[i], tri[(i + 1) % 3]))), []).append(c)
    out['overlapping_cells'] = dup
    out['misoriented_cells'] = neg
    seams = 0
    for ek, cs in edge_owner.items():
        if len(cs) > 2:
            seams += 100
        elif len(cs) == 2:
            common = set(map(int, prep.cells[cs[0]])) & set(map(int, prep.cells[cs[1]]))
            if len(common) < 2 or not joined[prep.eid[tuple(sorted(common))]]:
                seams += 1
    out['false_seams'] = seams  # layout-adjacent cells that are not sphere neighbours
    w = sel['focean'][keep]
    out['omega_mean_oceanweighted'] = float((prep.om_mean[keep] * w).sum() / w.sum())
    out['omega_max_kept_ocean_cells'] = float(prep.om_max[keep & (sel['focean'] > 0.5)].max())
    out['omega_max_kept'] = float(prep.om_max[keep].max())
    out['retained_ocean_pct'] = float(100 * sel['focean'][keep].sum() / sel['focean'].sum())
    out['forced_strait_edges'] = int(sel['forced_edges'].sum())
    out['leaf_joins'] = int((sel['leaf'] & J).sum())
    out['split_cells (isthmus inside cell)'] = int((sel['split'] & keep).sum())
    out['wet_edges_blocked_by_isthmus_rule'] = int((sel['piece_blocked'] & keep[a] & keep[b]).sum())
    xy = to_xy(np.array([v for c in P for v in P[c].values()])) * sn.S / prep.n * R_KM
    out['bbox_km'] = [float(np.ptp(xy[:, 0])), float(np.ptp(xy[:, 1]))]
    return out, ocean_cut, joined


def run(prep, R, rng=None, jitter=0.0, sel=None, **kw):
    if sel is None:
        sel = select_cells(prep, R, **kw)
    cut, charge, comp = steiner_cuts(prep, sel, rng, jitter)
    keep = sel['keep']
    kept = np.nonzero(keep)[0]
    cen = prep.samp[kept].mean(1)
    g = (cen * sel['focean'][kept, None]).sum(0); g /= np.linalg.norm(g)
    root = int(kept[np.argmax(cen @ g)])
    P, tree = layout(prep, keep, sel['joinable'] & ~cut, root)
    out, ocean_cut, joined = analyse(prep, sel, cut, P, tree)
    out['charged_components'] = len(charge)
    inc = [np.nonzero((prep.cells == v).any(1))[0] for v in prep.cone]
    out['cones_on_wet_ocean'] = int(sum(1 for cs in inc if all(keep[c] for c in cs)
                                        and all(sel['joinable'][e] for c in cs for e in prep.ce[c]
                                                if v_in_edge(prep, e, cs))))
    return out, dict(sel=sel, cut=cut, P=P, tree=tree, ocean_cut=ocean_cut, joined=joined,
                     charge=charge, comp=comp, root=root)


def v_in_edge(prep, e, cs):
    a, b = prep.ec[e]
    return a in cs and b in cs


def strait_report(prep, R, res):
    sel = res['sel']; J = sel['joinable']; jn = res['joined']; keep = sel['keep']
    rep = {}
    for name, info in sel['straits'].items():
        es = info['edges']
        rep[name] = dict(cells=len(info['cells']), all_cells_kept=bool(keep[info['cells']].all()),
                         edges=len(es), edges_joined=int(sum(bool(J[e] and jn[e]) for e in es)),
                         edges_wet_without_forcing=info['natural_edges'])
        rep[name]['survived'] = rep[name]['all_cells_kept'] and rep[name]['edges_joined'] == len(es)
    return rep


def peninsula_report(prep, R, res, transects):
    sel = res['sel']; J = sel['joinable']; jn = res['joined']; keep = sel['keep']
    rep = {}
    for name, pts in transects.items():
        seq = polyline_cells(prep, R, pts)
        states = []
        for a, b in zip(seq[:-1], seq[1:]):
            e = [e for d, e in prep.nbr[a] if d == b]
            if not e:
                states.append('vertex-contact'); continue
            e = e[0]
            if not (keep[a] and keep[b]):
                states.append('removed-land-cell' if not (sel['cand'][a] and sel['cand'][b]) else 'dropped-ocean-cell')
            elif J[e] and jn[e]:
                states.append('water-join')
            elif J[e]:
                states.append('ocean-cut')
            elif jn[e]:
                states.append('closed-land-seam')
            else:
                states.append('open-gap')
        if len(seq) == 1:
            status = 'unresolved: both sides in one cell'
        elif 'removed-land-cell' in states or 'dropped-ocean-cell' in states:
            status = 'cut: land cells removed between the two sides'
        elif 'open-gap' in states:
            status = 'cut: open gap'
        elif 'ocean-cut' in states:
            status = 'cut: ocean cut'
        elif 'closed-land-seam' in states or 'vertex-contact' in states:
            status = 'cut: closed land seam'
        else:
            status = 'joined across (narrower than mesh edges are dry)'
        rep[name] = dict(cells=len(seq), crossings=states, status=status)
    return rep
