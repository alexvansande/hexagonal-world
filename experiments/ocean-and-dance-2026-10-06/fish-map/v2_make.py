"""Render and check a v2 run.
usage: python3 -I v2_make.py N RUN_TAG OUT_PREFIX [extra run tags for the stats table]"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import v2_core as v, fishmap as fm, render as rd, straits as st

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
n, tag, prefix = int(sys.argv[1]), sys.argv[2], sys.argv[3]
others = sys.argv[4:]
run = json.load(open(os.path.join(HERE, f'v2-run-{tag}.json')))
Z = np.load(os.path.join(HERE, f'v2-run-{tag}.npz'))
x, cid, tri_g, vpos, vid, loop = Z['x'], Z['cid'], Z['tri'], Z['vpos'], Z['vid'], Z['loop']
omega, area = Z['omega'], Z['area']
show = Z['show']                      # display domain (scaffold = outside region is not drawn)
slit = []
M = v.Mesh(n)
fo, fw, fe, forced = v.classify(M)
inv = {g: i for i, g in enumerate(vid)}
tri = np.vectorize(inv.get)(tri_g)
tri, cid, omega, area = tri[show], cid[show], omega[show], area[show]
used = np.unique(tri)
X3 = vpos[vid]                       # sphere position of each map vertex
cell_pos = {c: i for i, c in enumerate(cid)}
indom = np.zeros(M.C, bool); indom[cid] = True

# ---------------- frame: rotate to the smallest landscape bounding box
best = None
for ang in np.radians(np.arange(0, 180, 1.0)):
    ca, sa = np.cos(ang), np.sin(ang)
    q = x[used] @ np.array([[ca, -sa], [sa, ca]]).T
    e = np.ptp(q, 0)
    if e[0] >= e[1] and (best is None or e[0] * e[1] < best[0]):
        best = (e[0] * e[1], ang)
ang = best[1]
Rm = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]])
xr = x[used] @ Rm.T
LONG, MARGIN, SS = 3200, 70, 2
lo, hi = xr.min(0), xr.max(0)
scale = (LONG - 2 * MARGIN) / (hi[0] - lo[0])
Wp = LONG; Hp = int(np.ceil((hi[1] - lo[1]) * scale)) + 2 * MARGIN


def to_px(p, ss=1):
    p = np.asarray(p) @ Rm.T
    return np.stack([(p[..., 0] - lo[0]) * scale + MARGIN, (hi[1] - p[..., 1]) * scale + MARGIN], -1) * ss


def sphere_to_map(X):
    """unit vectors -> map coords (nan if outside the domain)."""
    c, lam = M.locate(X)
    out = np.full((len(X), 2), np.nan)
    for k, (cc, l) in enumerate(zip(c, lam)):
        if cc in cell_pos:
            t = tri[cell_pos[cc]]
            out[k] = l @ x[t]
    return out


# ---------------- rasterise (supersampled)
W2, H2 = Wp * SS, Hp * SS
P = to_px(x, SS)
tid = np.full(H2 * W2, -1, np.int32)
bary = np.zeros((H2 * W2, 2), np.float32)
for t, (a, b, c) in enumerate(tri):
    pa, pb, pc = P[a], P[b], P[c]
    x0 = int(np.floor(min(pa[0], pb[0], pc[0]))); x1 = int(np.ceil(max(pa[0], pb[0], pc[0])))
    y0 = int(np.floor(min(pa[1], pb[1], pc[1]))); y1 = int(np.ceil(max(pa[1], pb[1], pc[1])))
    x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, W2 - 1), min(y1, H2 - 1)
    if x1 < x0 or y1 < y0:
        continue
    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
    gx = gx.ravel(); gy = gy.ravel()
    T = np.array([[pb[0] - pa[0], pc[0] - pa[0]], [pb[1] - pa[1], pc[1] - pa[1]]])
    det = T[0, 0] * T[1, 1] - T[0, 1] * T[1, 0]
    if det == 0:
        continue
    dx, dy = gx - pa[0], gy - pa[1]
    l1 = (T[1, 1] * dx - T[0, 1] * dy) / det
    l2 = (-T[1, 0] * dx + T[0, 0] * dy) / det
    m = (l1 >= -1e-9) & (l2 >= -1e-9) & (l1 + l2 <= 1 + 1e-9)
    if not m.any():
        continue
    idx = (gy[m] - 0.5).astype(int) * W2 + (gx[m] - 0.5).astype(int)
    tid[idx] = t
    bary[idx] = np.stack([l1[m], l2[m]], 1)
cov = tid >= 0
ii = np.nonzero(cov)[0]
tt = tid[ii]
l1, l2 = bary[ii, 0].astype(float), bary[ii, 1].astype(float)
Xs = (1 - l1 - l2)[:, None] * X3[tri[tt, 0]] + l1[:, None] * X3[tri[tt, 1]] + l2[:, None] * X3[tri[tt, 2]]
Xs /= np.linalg.norm(Xs, axis=1)[:, None]

BG = np.array([250, 249, 245.]); LAND = np.array([196, 186, 165.]); LAKE = np.array([168, 186, 196.])
ocean_a = rd.sample_ocean(Xs)[:, None]
water_any = fm.masks()[1]
r, c = fm.pix(Xs)
lake = (water_any[r, c] & ~fm.masks()[0][r, c])[:, None]
col = np.empty((len(ii), 3))
for s0 in range(0, len(ii), 2000000):
    sl = slice(s0, s0 + 2000000)
    col[sl] = rd.sample_bm(Xs[sl])
land_col = np.where(lake, LAKE, LAND)
img = np.tile(BG, (H2 * W2, 1))
img[ii] = col * ocean_a + land_col * (1 - ocean_a)

# hard-coded strait / route channels: water drawn on top where the 9 km mask is land
ch = Image.new('L', (W2, H2), 0); dch = ImageDraw.Draw(ch)
routes = dict(st.STRAITS); routes.update(v.ROUTES)
route_px = {}
for name, pts in routes.items():
    Xr = fm.densify(pts, 3.0)
    mp = sphere_to_map(Xr)
    route_px[name] = (Xr, mp)
    pp = to_px(mp, SS)
    okp = ~np.isnan(pp[:, 0])
    rr, cc_ = fm.pix(Xr)
    dry = ~fm.masks()[0][rr, cc_]          # only where the 9 km mask closes the passage
    draw = okp[:-1] & okp[1:] & (dry[:-1] | dry[1:])
    for a_, b_ in zip(pp[:-1][draw], pp[1:][draw]):
        dch.line([tuple(a_), tuple(b_)], fill=255, width=5 * SS)
cha = (np.asarray(ch).ravel() / 255.0)[:, None]
CHAN = np.array([92, 160, 205.])
img = img * (1 - cha * cov[:, None]) + CHAN * cha * cov[:, None]
img = img.reshape(H2, W2, 3)
img = img.reshape(Hp, SS, Wp, SS, 3).mean((1, 3))
base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
Image.fromarray(np.asarray(base)).save(os.path.join(HERE, f'{prefix}-fish-map-clean.png'))
dr = ImageDraw.Draw(base)
bp = to_px(x[loop])
dr.line([tuple(p) for p in bp] + [tuple(bp[0])], fill=(70, 62, 52), width=3)
base.save(os.path.join(HERE, f'{prefix}-fish-map.png'))

# ---------------- labelled version
FONT = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
FONTB = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
FONTI = '/usr/share/fonts/opentype/inter/Inter-Italic.otf'
lab = base.copy(); dl = ImageDraw.Draw(lab)
oceans = {'PACIFIC OCEAN': (5, -150), 'SOUTH PACIFIC': (-30, -120), 'ATLANTIC OCEAN': (28, -42), 'SOUTH ATLANTIC': (-25, -15),
          'INDIAN OCEAN': (-20, 78), 'SOUTHERN OCEAN': (-58, 100), 'ARCTIC OCEAN': (84, -150),
          'Mediterranean': (34.5, 18), 'Caribbean': (15, -75), 'Bering Sea': (57, -178), 'Red Sea': (20, 38.5),
          'Arabian Sea': (14, 64), 'Bay of Bengal': (14, 88), 'South China Sea': (13, 114), 'Tasman Sea': (-38, 160),
          'Hudson Bay': (59, -85), 'Gulf of Mexico': (25, -90), 'Baltic': (58, 19.5), 'Black Sea': (43.2, 34),
          'Coral Sea': (-16, 155), 'Weddell Sea': (-70, -45), 'Ross Sea': (-75, -175), 'Persian Gulf': (27, 51),
          'Philippine Sea': (20, 132), 'Sea of Okhotsk': (54, 149), 'North Sea': (56, 3), 'Barents Sea': (74, 40)}
lands = {'NORTH AMERICA': (45, -100), 'SOUTH AMERICA': (-12, -58), 'ANTARCTICA': (-80, 40), 'AUSTRALIA': (-25, 134),
         'Greenland': (73, -40), 'AFRICA': (5, 20), 'EURASIA': (50, 90), 'Madagascar': (-19.5, 46.7),
         'Borneo': (0.8, 114), 'New Guinea': (-5, 142), 'Sumatra': (-0.5, 101.8), 'Japan': (36.5, 138.5),
         'Iceland': (65, -18.5), 'New Zealand': (-42, 172.5), 'Arabia': (23, 46), 'India': (21, 78), 'Europe': (50, 15)}
strs = {'Drake Passage': (-58.5, -64), 'Gibraltar': (35.95, -5.6), 'Bering Str.': (65.8, -168.8), 'Malacca': (3.2, 100.4),
        'Bosporus': (41.1, 29.05), 'Bab-el-Mandeb': (12.6, 43.4), 'Hormuz': (26.5, 56.5), 'Torres': (-10.3, 142.2),
        'Lombok': (-8.6, 115.8), 'Makassar': (-2, 118), 'Fram Str.': (79, 0), 'Davis Str.': (67, -58),
        'Oresund': (55.9, 12.7), 'Magellan': (-53.5, -70.5), 'Kerch': (45.35, 36.55), 'Nares': (79, -70)}
placed = []


def put(name, ll, font, fill, size, marker=False):
    p = sphere_to_map(fm.ll2vec(np.array([ll[0]]), np.array([ll[1]])))[0]
    if np.isnan(p[0]):
        return False
    q = to_px(p)
    f = ImageFont.truetype(font, size)
    if marker:
        dl.ellipse([q[0] - 4, q[1] - 4, q[0] + 4, q[1] + 4], fill=(200, 30, 30), outline=(255, 255, 255))
        q = q + [7, -size * 0.6]
        anchor = 'lm'
    else:
        anchor = 'mm'
    dl.text(tuple(q), name, font=f, fill=fill, anchor=anchor, stroke_width=3 if marker else 2,
            stroke_fill=(255, 255, 255) if marker or fill[0] < 100 else (20, 40, 70))
    return True


for k, ll in oceans.items():
    big = k.isupper()
    put(k, ll, FONTB if big else FONTI, (235, 242, 250), 34 if big else 19)
for k, ll in lands.items():
    big = k.isupper()
    put(k, ll, FONTB if big else FONT, (60, 52, 40), 30 if big else 18)
for k, ll in strs.items():
    put(k, ll, FONT, (120, 20, 20), 17, marker=True)
outside_name = run['outside']
fT = ImageFont.truetype(FONTB, 30); fS = ImageFont.truetype(FONT, 20)
dl.text((MARGIN, 18), 'The world ocean, uncut (fish map v2)', font=fT, fill=(40, 40, 40))
dl.text((MARGIN, Hp - 52), f'Outside the dark outer boundary: {outside_name.split(" (")[0]}. The boundary runs on land only; '
        f'land is squashed freely, water is never cut.', font=fS, fill=(60, 60, 60))
lab.save(os.path.join(HERE, f'{prefix}-fish-map-labelled.png'))

# ---------------- distortion panels
def tri_image(vals, cmapf, width=1600):
    s2 = width / LONG
    im = Image.new('RGB', (int(Wp * s2), int(Hp * s2)), tuple(BG.astype(int)))
    d2 = ImageDraw.Draw(im)
    Pp = to_px(x) * s2
    cols = cmapf(vals)
    for t in range(len(tri)):
        d2.polygon([tuple(Pp[j]) for j in tri[t]], fill=tuple(int(u) for u in cols[t]))
    d2.line([tuple(p) for p in Pp[loop]] + [tuple(Pp[loop[0]])], fill=(40, 40, 40), width=2)
    return im


def ramp(t):
    t = np.clip(t, 0, 1)[:, None]
    a = np.array([49, 54, 149.]); b = np.array([255, 255, 191.]); c = np.array([165, 0, 38.])
    return np.where(t < .5, a + (b - a) * t * 2, b + (c - b) * (t - .5) * 2)


ocean_tri = fo[cid] > 0
gray = lambda t: np.tile([215, 208, 192], (len(t), 1))
om_c = ramp(omega / 40); om_c[~ocean_tri] = [215, 208, 192]
ar_c = ramp(0.5 + np.log2(np.clip(area, 1e-3, 1e3)) / 4); ar_c[~ocean_tri] = [215, 208, 192]
tri_image(None, lambda _: om_c).save(os.path.join(HERE, f'{prefix}-distortion-angle.png'))
tri_image(None, lambda _: ar_c).save(os.path.join(HERE, f'{prefix}-distortion-area.png'))

# ---------------- diagnostic world map
Wd, Hd = 3600, 1800
bm = np.asarray(Image.fromarray(rd.bluemarble()).resize((Wd, Hd), Image.BILINEAR)).astype(float)
cidw = rd.world_cells(M, np.eye(3), Wd, Hd)
outm = ~indom[cidw]
bm[outm] = bm[outm] * 0.35 + np.array([90, 90, 90]) * 0.65
fz = forced[cidw] & indom[cidw]
bm[fz] = bm[fz] * 0.5 + np.array([255, 220, 0]) * 0.5
dimg = Image.fromarray(bm.astype(np.uint8)); dd = ImageDraw.Draw(dimg)


def pl(lon, lat, colr, wd):
    xs = (np.asarray(lon) + 180) / 360 * Wd; ys = (90 - np.asarray(lat)) / 180 * Hd
    for i in range(len(xs) - 1):
        if abs(xs[i + 1] - xs[i]) < Wd / 2:
            dd.line([(xs[i], ys[i]), (xs[i + 1], ys[i + 1])], fill=colr, width=wd)


lonb, latb = fm.lonlat(X3[loop])
pl(np.r_[lonb, lonb[0]], np.r_[latb, latb[0]], (255, 255, 255), 3)
if slit:
    lo_, la_ = fm.lonlat(M.pos[slit]); pl(lo_, la_, (255, 40, 40), 5)
for name, pts in routes.items():
    la_, lo_ = zip(*pts); pl(lo_, la_, (0, 255, 255), 2)
dd.text((20, 20), f'v2 domain: grey = outside region ({outside_name}); white = outer boundary; '
        f'yellow = forced-water strait cells; cyan = checked water routes', font=ImageFont.truetype(FONT, 26), fill=(255, 255, 255))
dimg.save(os.path.join(HERE, f'{prefix}-diagnostic.png'))

# ---------------- checks
ocean, water, L = fm.masks()
checks = {}
for name, (Xr, mp) in route_px.items():
    c, _ = M.locate(Xr)
    r_, c_ = fm.pix(Xr)
    wet = ocean[r_, c_]
    seg = np.linalg.norm(np.diff(mp, axis=0), axis=1)
    checks[name] = dict(all_points_in_domain=bool(indom[c].all()), mask_water_fraction=float(wet.mean()),
                        land_points_drawn_as_channel=int((~wet).sum()),
                        mapped_route_continuous=bool(np.isfinite(mp).all()),
                        max_map_step_vs_median=float(seg.max() / max(np.median(seg), 1e-12)),
                        route_length_px=float(seg.sum() * scale))
ring = fm.densify([(-58, lo) for lo in np.arange(-180, 181, 5)], 10)
c_ring, _ = M.locate(ring); r_, c_ = fm.pix(ring)
checks['Southern Ocean ring at 58S (closed loop)'] = dict(all_points_in_domain=bool(indom[c_ring].all()),
                                                          mask_water_fraction=float(ocean[r_, c_].mean()))
# winding: does the ring's image wind around Antarctica's image?
mp = sphere_to_map(ring)
pa = sphere_to_map(fm.ll2vec(np.array([-80.0]), np.array([40.0])))[0]
if np.isfinite(mp).all() and np.isfinite(pa).all():
    d_ = mp - pa; a_ = np.unwrap(np.arctan2(d_[:, 1], d_[:, 0]))
    checks['Southern Ocean ring at 58S (closed loop)']['winding_around_antarctica'] = float((a_[-1] - a_[0]) / (2 * np.pi))
# land squash summary per land mass
lm = {}
for k, ll in {'Antarctica': (-80, 40), 'Australia': (-25, 134), 'North America': (45, -100), 'South America': (-12, -58),
              'Africa': (5, 20), 'Greenland': (73, -40), 'Eurasia': (50, 90)}.items():
    cc = M.locate(fm.ll2vec(np.array([ll[0]]), np.array([ll[1]])))[0][0]
    if not indom[cc]:
        lm[k] = 'outside region (not in map)'; continue
    seen = {cc}; fr = [cc]
    while fr:
        nx = []
        for c0 in fr:
            for d0 in M.nbr[c0]:
                if d0 not in seen and indom[d0] and fo[d0] == 0:
                    seen.add(d0); nx.append(d0)
        fr = nx
    ids = np.array([cell_pos[c0] for c0 in seen])
    wgt = M.sph_area[cid[ids]]
    lm[k] = dict(cells=len(ids), area_ratio_map_over_true=float((area[ids] * wgt).sum() / wgt.sum()),
                 area_scale_p10_p90=[float(np.quantile(area[ids], .1)), float(np.quantile(area[ids], .9))],
                 omega_median=float(np.median(omega[ids])))
stats = dict(run=run, routes=checks, land_masses=lm, image=dict(width=Wp, height=Hp, scale_px_per_rad=scale),
             comparison={t: json.load(open(os.path.join(HERE, f'v2-run-{t}.json'))) for t in others})
json.dump(stats, open(os.path.join(HERE, f'{prefix}-stats.json'), 'w'), indent=1)
print(json.dumps(dict(routes=checks, land=lm), indent=1))
