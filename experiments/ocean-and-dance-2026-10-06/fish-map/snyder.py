"""Snyder-type equal-area icosahedral projection (Snyder 1992) and the
equal-area triangular lattice built on it.

Construction (Snyder, J.P. 1992, "An Equal-Area Map Projection for Polyhedral
Globes", Cartographica 29(1):10-21): each icosahedron face is split into three
spherical triangles P-A-B (P = face centre, A,B = adjacent face vertices) and
each is mapped to the planar triangle p-a-b of equal area such that
  * great circles through P map to straight rays through p,
  * a point Q on edge AB maps to q = a + t(b-a), t = area(PAQ)/area(PAB),
  * along the ray, |px|/|pq| = sqrt((1-cos PX)/(1-cos PQ)).
Sector areas are matched by the first rule and radial areas by the second, so
the map is exactly equal-area. Areas use the exact spherical-excess formula.
Unit sphere; planar face area = 4*pi/20.
"""
import numpy as np

PHI = (1 + 5 ** 0.5) / 2


def icosahedron():
    v = []
    for s1 in (-1, 1):
        for s2 in (-1, 1):
            v += [(0, s1, s2 * PHI), (s1, s2 * PHI, 0), (s2 * PHI, 0, s1)]
    V = np.array(v, float)
    V /= np.linalg.norm(V, axis=1)[:, None]
    d = np.linalg.norm(V[:, None] - V[None], axis=2)
    e = d[d > 1e-9].min()
    adj = np.abs(d - e) < 1e-6
    F = []
    for i in range(12):
        for j in range(i + 1, 12):
            for k in range(j + 1, 12):
                if adj[i, j] and adj[j, k] and adj[i, k]:
                    a, b, c = V[i], V[j], V[k]
                    if np.dot(np.cross(b - a, c - a), a + b + c) < 0:
                        F.append((i, k, j))
                    else:
                        F.append((i, j, k))
    F = np.array(F)
    assert len(F) == 20
    return V, F


VERT, FACES = icosahedron()
CENT = VERT[FACES].sum(1)
CENT /= np.linalg.norm(CENT, axis=1)[:, None]
S = np.sqrt(4 * np.pi / (5 * np.sqrt(3)))  # planar face side (unit sphere)
A2 = np.array([[0.0, 0.0], [S, 0.0], [S / 2, S * np.sqrt(3) / 2]])  # planar face vertices
P2 = A2.mean(0)


def sph_area(a, b, c):
    det = np.einsum('...i,...i', a, np.cross(b, c))
    den = 1 + np.einsum('...i,...i', a, b) + np.einsum('...i,...i', b, c) + np.einsum('...i,...i', c, a)
    return 2 * np.arctan2(np.abs(det), den)


def _slerp(A, B, u):
    g = np.arccos(np.clip(np.einsum('...i,...i', A, B), -1, 1))[..., None]
    u = u[..., None]
    return (np.sin((1 - u) * g) * A + np.sin(u * g) * B) / np.sin(g)


def inverse(face, xy, iters=60):
    """planar face coordinates (N,2) on face index array (N,) -> unit vectors (N,3)."""
    face = np.asarray(face)
    xy = np.asarray(xy, float)
    T = np.array([A2[1] - A2[0], A2[2] - A2[0]]).T
    lam = np.linalg.solve(T, (xy - A2[0]).T).T
    bary = np.stack([1 - lam[:, 0] - lam[:, 1], lam[:, 0], lam[:, 1]], 1)
    k = (np.argmin(bary, 1) + 1) % 3          # sub-triangle (p, a_k, a_k+1)
    ka, kb = k, (k + 1) % 3
    a, b = A2[ka], A2[kb]
    M = np.stack([a - P2, b - P2], 2)          # (N,2,2)
    ab = np.linalg.solve(M, (xy - P2)[..., None])[..., 0]
    f = ab.sum(1)
    t = np.where(f > 0, ab[:, 1] / np.where(f > 0, f, 1), 0.0)
    P = CENT[face]
    A = VERT[FACES[face, ka]]
    B = VERT[FACES[face, kb]]
    target = t * sph_area(P, A, B)
    lo = np.zeros(len(xy)); hi = np.ones(len(xy))
    for _ in range(iters):
        mid = (lo + hi) / 2
        Q = _slerp(A, B, mid)
        big = sph_area(P, A, Q) > target
        hi = np.where(big, mid, hi); lo = np.where(big, lo, mid)
    Q = _slerp(A, B, (lo + hi) / 2)
    cq = np.einsum('ij,ij->i', P, Q)
    cr = 1 - f ** 2 * (1 - cq)
    rho = np.arccos(np.clip(cr, -1, 1))
    Tn = Q - cq[:, None] * P
    Tn /= np.maximum(np.linalg.norm(Tn, axis=1), 1e-300)[:, None]
    X = np.cos(rho)[:, None] * P + np.sin(rho)[:, None] * Tn
    return X


def forward(X):
    """unit vectors (N,3) -> (face, planar xy)."""
    X = np.asarray(X, float)
    face = np.argmax(X @ CENT.T, 1)
    P = CENT[face]
    out = np.zeros((len(X), 2))
    done = np.zeros(len(X), bool)
    for k in range(3):
        A = VERT[FACES[face, k]]
        B = VERT[FACES[face, (k + 1) % 3]]
        d1 = np.einsum('ij,ij->i', np.cross(P, A), X)
        d2 = np.einsum('ij,ij->i', np.cross(X, B), P)
        sel = (d1 >= -1e-15) & (d2 >= -1e-15) & ~done
        if not sel.any():
            continue
        Ps, As, Bs, Xs = P[sel], A[sel], B[sel], X[sel]
        Q = np.cross(np.cross(Ps, Xs), np.cross(As, Bs))
        n = np.linalg.norm(Q, axis=1)
        Q = Q / np.where(n > 0, n, 1)[:, None]
        Q *= np.sign(np.einsum('ij,ij->i', Q, Ps) + 1e-300)[:, None]
        Q = np.where(n[:, None] > 0, Q, As)
        t = sph_area(Ps, As, Q) / sph_area(Ps, As, Bs)
        cx = np.einsum('ij,ij->i', Ps, Xs); cq = np.einsum('ij,ij->i', Ps, Q)
        f = np.sqrt(np.clip((1 - cx) / (1 - cq), 0, None))
        q = A2[k] + t[:, None] * (A2[(k + 1) % 3] - A2[k])
        out[sel] = P2 + f[:, None] * (q - P2)
        done |= sel
    return face, out


def lattice(n):
    """Equal-area triangular lattice of frequency n on every face.
    Returns vertex positions on sphere (V,3), cells (C,3) of global vertex ids (CCW
    seen from outside), cell face (C,), cell planar vertex coords (C,3,2)."""
    ij = [(i, j) for j in range(n + 1) for i in range(n + 1 - j)]
    idx = {p: m for m, p in enumerate(ij)}
    lat = np.array(ij, float) / n
    loc = A2[0] + lat[:, :1] * (A2[1] - A2[0]) + lat[:, 1:] * (A2[2] - A2[0])
    tris = []
    for j in range(n):
        for i in range(n - j):
            tris.append((idx[i, j], idx[i + 1, j], idx[i, j + 1]))
            if i + j <= n - 2:
                tris.append((idx[i + 1, j], idx[i + 1, j + 1], idx[i, j + 1]))
    tris = np.array(tris)
    nl = len(loc)
    allxy = np.tile(loc, (20, 1))
    allface = np.repeat(np.arange(20), nl)
    Xall = inverse(allface, allxy)
    key = np.round(Xall * 1e8).astype(np.int64)
    gid = {}
    vid = np.zeros(len(Xall), int)
    pos = []
    for m, kk in enumerate(map(tuple, key)):
        # tolerate rounding at bucket boundaries by probing neighbours
        g = gid.get(kk)
        if g is None:
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for dz in (-1, 0, 1):
                        g = gid.get((kk[0] + dx, kk[1] + dy, kk[2] + dz))
                        if g is not None:
                            break
                    if g is not None:
                        break
                if g is not None:
                    break
        if g is None:
            g = len(pos); gid[kk] = g; pos.append(Xall[m])
        vid[m] = g
    pos = np.array(pos)
    cells = np.concatenate([vid[f * nl + tris] for f in range(20)])
    cface = np.repeat(np.arange(20), len(tris))
    cxy = np.concatenate([loc[tris] for f in range(20)])
    return pos, cells, cface, cxy


def cell_samples(cxy, m):
    """m*m sample points per cell (centroids of an m-subdivision), planar."""
    pts = []
    for j in range(m):
        for i in range(m - j):
            pts.append(((i + 1 / 3) / m, (j + 1 / 3) / m))
            if i + j <= m - 2:
                pts.append(((i + 2 / 3) / m, (j + 2 / 3) / m))
    w = np.array(pts)
    a, b, c = cxy[:, 0], cxy[:, 1], cxy[:, 2]
    return a[:, None] + w[None, :, :1] * (b - a)[:, None] + w[None, :, 1:] * (c - a)[:, None]


def jacobian_stats(face, xy, h=1e-6):
    """area scale and Tissot max angular deformation (deg) of the inverse map."""
    X0 = inverse(face, xy)
    X1 = inverse(face, xy + [h, 0])
    X2 = inverse(face, xy + [0, h])
    d1 = (X1 - X0) / h; d2 = (X2 - X0) / h
    E = np.einsum('ij,ij->i', d1, d1); F = np.einsum('ij,ij->i', d1, d2); G = np.einsum('ij,ij->i', d2, d2)
    tr = E + G; det = np.sqrt(np.maximum(E * G - F * F, 0))
    disc = np.sqrt(np.maximum((tr / 2) ** 2 - det ** 2, 0))
    s1 = np.sqrt(tr / 2 + disc); s2 = np.sqrt(np.maximum(tr / 2 - disc, 0))
    # singular values of plane->sphere map; Tissot of sphere->plane uses 1/s
    a, b = 1 / s2, 1 / s1
    omega = np.degrees(2 * np.arcsin((a - b) / (a + b)))
    return det, omega
