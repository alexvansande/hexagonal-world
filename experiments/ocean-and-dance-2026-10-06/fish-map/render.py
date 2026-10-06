"""Rendering: unfolded fish map from Blue Marble, and diagnostic world map."""
import os, sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import snyder as sn
import fishmap as fm

Image.MAX_IMAGE_PIXELS = None
SQ3 = np.sqrt(3)
BG = (243, 240, 233)
_bm = None


def bluemarble():
    global _bm
    if _bm is None:
        _bm = np.asarray(Image.open(os.path.join(fm.SCR, 'dl', 'bm.jpg')).convert('RGB'))
    return _bm


def sample_bm(X):
    img = bluemarble()
    Hh, Ww = img.shape[:2]
    lon, lat = fm.lonlat(X)
    x = (lon + 180) / 360 * Ww - 0.5
    y = (90 - lat) / 180 * Hh - 0.5
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
    fx = (x - x0)[:, None]; fy = (y - y0)[:, None]
    y0c = np.clip(y0, 0, Hh - 1); y1c = np.clip(y0 + 1, 0, Hh - 1)
    x0c = x0 % Ww; x1c = (x0 + 1) % Ww
    a = img[y0c, x0c].astype(float); b = img[y0c, x1c].astype(float)
    c = img[y1c, x0c].astype(float); d = img[y1c, x1c].astype(float)
    return (a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy)


def sample_ocean(X):
    """bilinear world-ocean fraction (lakes, Caspian and land -> 0)."""
    oc = fm.masks()[0]
    Hh, Ww = oc.shape
    lon, lat = fm.lonlat(X)
    x = (lon + 180) / 360 * Ww - 0.5
    y = (90 - lat) / 180 * Hh - 0.5
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
    fx = x - x0; fy = y - y0
    y0c = np.clip(y0, 0, Hh - 1); y1c = np.clip(y0 + 1, 0, Hh - 1)
    x0c = x0 % Ww; x1c = (x0 + 1) % Ww
    return (oc[y0c, x0c] * (1 - fx) * (1 - fy) + oc[y0c, x1c] * fx * (1 - fy)
            + oc[y1c, x0c] * (1 - fx) * fy + oc[y1c, x1c] * fx * fy)


def layout_frame(prep, P, long_px, margin=40):
    """rotation angle minimising the bounding box, and pixel transform."""
    pts = fm.to_xy(np.array([v for c in P for v in P[c].values()]))
    best = None
    for ang in np.radians(np.arange(0, 180, 0.5)):
        ca, sa = np.cos(ang), np.sin(ang)
        q = pts @ np.array([[ca, -sa], [sa, ca]]).T
        ext = np.ptp(q, 0)
        a = ext[0] * ext[1] + 0.3 * max(ext) ** 2 * (ext[1] > ext[0])  # prefer landscape
        if best is None or a < best[0]:
            best = (a, ang)
    ang = best[1]
    ca, sa = np.cos(ang), np.sin(ang)
    Rm = np.array([[ca, -sa], [sa, ca]])
    q = pts @ Rm.T
    lo, hi = q.min(0), q.max(0)
    scale = (long_px - 2 * margin) / max(hi - lo)
    Wp = int(np.ceil((hi[0] - lo[0]) * scale)) + 2 * margin
    Hp = int(np.ceil((hi[1] - lo[1]) * scale)) + 2 * margin

    def to_px(xy):
        r = np.asarray(xy) @ Rm.T
        return np.stack([(r[..., 0] - lo[0]) * scale + margin, (hi[1] - r[..., 1]) * scale + margin], -1)

    def from_px(px, py):
        rx = (px - margin) / scale + lo[0]
        ry = hi[1] - (py - margin) / scale
        r = np.stack([rx, ry], -1)
        return r @ Rm  # inverse rotation
    return Wp, Hp, to_px, from_px


def cell_lookup(P):
    d = {}
    for c, pc in P.items():
        d[tuple(sorted(pc.values()))] = c
    return d


def locate(xy, lut):
    u = xy[:, 0] - xy[:, 1] / SQ3
    v = 2 * xy[:, 1] / SQ3
    i = np.floor(u).astype(np.int64); j = np.floor(v).astype(np.int64)
    up = (u - i) + (v - j) < 1
    cell = np.full(len(xy), -1)
    keys = np.stack([i, j, up], 1)
    uk, inv = np.unique(keys, axis=0, return_inverse=True)
    inv = inv.ravel()
    cid = np.full(len(uk), -1)
    for k, (ii, jj, uu) in enumerate(uk):
        if uu:
            t = tuple(sorted([(ii, jj), (ii + 1, jj), (ii, jj + 1)]))
        else:
            t = tuple(sorted([(ii + 1, jj), (ii + 1, jj + 1), (ii, jj + 1)]))
        cid[k] = lut.get(t, -1)
    return cid[inv]


def to_sphere(prep, P, cells, xy):
    """layout point (lattice units) inside placed cell -> unit vector (mesh frame)."""
    out = np.zeros((len(xy), 3))
    order = np.argsort(cells)
    cs, starts = np.unique(cells[order], return_index=True)
    bounds = list(starts) + [len(order)]
    fxy = np.zeros((len(xy), 2)); face = np.zeros(len(xy), int)
    for k, c in enumerate(cs):
        idx = order[bounds[k]:bounds[k + 1]]
        tri = fm.to_xy(np.array([P[c][int(v)] for v in prep.cells[c]]))
        T = np.array([tri[1] - tri[0], tri[2] - tri[0]]).T
        lam = np.linalg.solve(T, (xy[idx] - tri[0]).T).T
        f = prep.cxy[c]
        fxy[idx] = f[0] + lam[:, :1] * (f[1] - f[0]) + lam[:, 1:] * (f[2] - f[0])
        face[idx] = prep.cface[c]
    return sn.inverse(face, fxy, iters=45)


def render_layout(prep, R, P, long_px=3200, ss=2, value=None, chunk=400000, ocean_only=True):
    """returns RGB image array (and pixel transforms). value: per-cell RGB override."""
    Wp, Hp, to_px, from_px = layout_frame(prep, P, long_px)
    lut = cell_lookup(P)
    acc = np.zeros((Hp * Wp, 3)); cov = np.zeros(Hp * Wp)
    offs = [((a + 0.5) / ss, (b + 0.5) / ss) for a in range(ss) for b in range(ss)]
    py, px = np.divmod(np.arange(Hp * Wp), Wp)
    for ox, oy in offs:
        for s in range(0, Hp * Wp, chunk):
            sl = slice(s, s + chunk)
            xy = from_px(px[sl] + ox, py[sl] + oy)
            cid = locate(xy, lut)
            m = cid >= 0
            if not m.any():
                continue
            if value is None:
                X = to_sphere(prep, P, cid[m], xy[m]) @ R.T
                al = sample_ocean(X)[:, None] if ocean_only else 1.0
                col = sample_bm(X) * al + np.array(BG, float) * (1 - al)
            else:
                col = value[cid[m]]
            ii = np.arange(s, min(s + chunk, Hp * Wp))[m]
            acc[ii] += col; cov[ii] += 1
    bg = np.array(BG, float)
    img = (acc + (ss * ss - cov)[:, None] * bg) / (ss * ss)
    return np.clip(img, 0, 255).astype(np.uint8).reshape(Hp, Wp, 3), to_px


def layout_edges(prep, P, joined, joinable):
    """layout segments: water joins (interior grid), ocean cuts (joinable edge
    whose sides were separated), land seams (dry edge between kept cells)."""
    seg_cell, seg_cut, seg_land = [], [], []
    for c, pc in P.items():
        cv = [int(v) for v in prep.cells[c]]
        for k in range(3):
            u, v = cv[k], cv[(k + 1) % 3]
            e = prep.eid[(min(u, v), max(u, v))]
            a, b = prep.ec[e]
            other = int(b if a == c else a)
            if other not in P:
                continue
            s = (pc[u], pc[v])
            if joinable[e] and joined[e]:
                if c < other:
                    seg_cell.append(s)
            elif joinable[e]:
                seg_cut.append(s)
            elif c < other or not joined[e]:
                seg_land.append(s)
    return seg_cell, seg_cut, seg_land


def draw_segments(img, to_px, segs, color, width):
    im = Image.fromarray(img)
    dr = ImageDraw.Draw(im)
    for a, b in segs:
        p = to_px(fm.to_xy(np.array([a, b])))
        dr.line([tuple(p[0]), tuple(p[1])], fill=color, width=width)
    return np.asarray(im)


def world_cells(prep, R, Wd, Hd):
    """cell id for each pixel of an equirectangular image."""
    lon = (np.arange(Wd) + 0.5) / Wd * 360 - 180
    lat = 90 - (np.arange(Hd) + 0.5) / Hd * 180
    LO, LA = np.meshgrid(np.radians(lon), np.radians(lat))
    X = np.stack([np.cos(LA) * np.cos(LO), np.cos(LA) * np.sin(LO), np.sin(LA)], -1).reshape(-1, 3)
    Xm = X @ R  # earth -> mesh frame (R maps mesh->earth)
    return cell_of(prep, Xm).reshape(Hd, Wd)


cell_of = fm.cell_of


def edge_polyline(prep, e, R, k=8):
    """points along a mesh edge (curved on sphere) in lon/lat."""
    c = prep.ec[e, 0]
    cv = list(map(int, prep.cells[c]))
    u, v = int(prep.eu[e]), int(prep.ev[e])
    xu = prep.cxy[c][cv.index(u)]; xv = prep.cxy[c][cv.index(v)]
    t = np.linspace(0, 1, k)[:, None]
    X = sn.inverse(np.full(k, prep.cface[c]), xu + t * (xv - xu))
    return fm.lonlat(X @ R.T)
