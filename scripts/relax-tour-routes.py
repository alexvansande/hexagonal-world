"""Corridor relaxation for story routes: least-cost paths through a passability
raster built from the height overview, Holdridge life zones and HydroRIVERS.

Hard stops (route endpoints and named places) stay fixed. Between them each
strand follows a low-cost path inside a soft corridor around the authored
polyline, with its own smooth noise so parallel strands take slightly different
courses. Output is the generated sidecar dist/history/<period>.strands.json,
stamped with a hash of the routes file so a stale sidecar is detectable.

Usage: python3 scripts/relax-tour-routes.py <period-id>|all
Inputs: dist/history/<period>.routes.json and dist/history/relax.json (per story:
strands, noise, sea 'coastal' prefers shorelines / 'open' treats open water as
free as coast and islands as stops; landBridge route IDs make modern sea inside
the corridor cost like land; places are named hard stops). Two-way routes are
relaxed once; the loader mirrors their strands. Needs numpy and Pillow (a
scratch virtualenv is fine). No network.
"""
import heapq, json, math, sys, time
import numpy as np
from PIL import Image

root = __import__('pathlib').Path(__file__).resolve().parent.parent
history = root / 'dist/history'
relax_settings = json.load(open(history / 'relax.json'))
ids = [p.stem.replace('.routes', '') for p in sorted(history.glob('*.routes.json'))] if sys.argv[1] == 'all' else sys.argv[1:]
STEP = 0.2                      # degrees per cell
W, H = int(360 / STEP), int(180 / STEP)
MAX_STRANDS = max([relax_settings['default']['strands']] + [s.get('strands', 0) for s in relax_settings['stories'].values()])
CORRIDOR_MAX, CORRIDOR_MIN = 2.5, .6   # soft corridor (deg) scales with each leg's length
t0 = time.time()

# --- rasters ---------------------------------------------------------------
height = np.asarray(Image.open(root / 'dist/maps/height/overview.png'), dtype=np.float32) / 255
hm = json.load(open(root / 'dist/maps/height/manifest.json'))
sea_level = hm['seaLevel']
f = height.shape[1] // W
height = height[:H * f, :W * f].reshape(H, f, W, f).mean(axis=(1, 3))
eco = np.asarray(Image.open(root / 'dist/maps/ecology-data-v2.png').convert('RGB'))[:, :, 0]
classes = json.load(open(root / 'dist/maps/sources.json'))['holdridgeClasses']
ys = (np.arange(H) * eco.shape[0] // H); xs = (np.arange(W) * eco.shape[1] // W)
eco = eco[ys][:, xs]
def class_set(test): return {int(k) for k, v in classes.items() if test(v.lower())}
desert = class_set(lambda v: 'desert' in v and 'polar' not in v)
polar = class_set(lambda v: 'polar' in v or 'tundra' in v) | {1}
ice = {1}
land = (eco != 0) & (height >= sea_level)
sea = ~land
coast = sea & (np.roll(land, 1, 0) | np.roll(land, -1, 0) | np.roll(land, 1, 1) | np.roll(land, -1, 1) |
               np.roll(np.roll(land, 1, 0), 1, 1) | np.roll(np.roll(land, -1, 0), -1, 1))
# Rivers: rasterize polylines with a minimum discharge (level index <= 6 is >= 100 m3/s).
rivers = np.zeros((H, W), dtype=bool)
def cell(lon, lat):
    return int((lon + 180) / STEP) % W, min(H - 1, max(0, int((90 - lat) / STEP)))
for level, line in json.load(open(root / 'dist/maps/river-lines.json')):
    if level > 6: continue
    prev = None
    for lon, lat in line:
        x, y = cell(lon, lat)
        if prev is not None:
            px, py = prev; n = max(abs(x - px), abs(y - py), 1)
            if n < 40:
                for i in range(n + 1):
                    rivers[py + (y - py) * i // n, (px + (x - px) * i // n) % W] = True
        rivers[y, x] = True; prev = (x, y)
rivers |= np.roll(rivers, 1, 0) | np.roll(rivers, -1, 0) | np.roll(rivers, 1, 1) | np.roll(rivers, -1, 1)
# Slope and elevation from the height overview (relative brightness, not metres).
elev = np.clip((height - sea_level) / (1 - sea_level), 0, 1)
gy, gx = np.gradient(height)
slope = np.hypot(gx, gy); slope = slope / (np.percentile(slope[land], 97) + 1e-9)
cost = np.ones((H, W), dtype=np.float32)
cost += 6 * np.minimum(1, slope) ** 2 + 4 * np.clip((elev - .35) / .65, 0, 1)
cost[np.isin(eco, list(desert))] *= 1.8
cost[np.isin(eco, list(polar))] *= 1.4
cost[np.isin(eco, list(ice))] *= 3
cost[rivers & land] *= .55
land_cost = cost.copy()
# One cost raster per sea mode; each story picks its own.
costs = {}
for mode in ('coastal', 'open'):
    c = land_cost.copy()
    c[sea] = 5.0 if mode == 'coastal' else 1.0
    c[coast] = 2.5 if mode == 'coastal' else 1.0
    if mode == 'open': c[land] = np.maximum(c[land], 8.0)   # islands are stops, not shortcuts
    costs[mode] = c
print(json.dumps({'grid': [W, H], 'land': int(land.sum()), 'rivers': int((rivers & land).sum()), 'seconds': round(time.time() - t0, 1)}), flush=True)

# --- helpers ---------------------------------------------------------------
def to_cell(lat, lon): return cell(lon, lat)
def to_geo(x, y): return [90 - (y + .5) * STEP, -180 + (x + .5) * STEP]
def smooth_noise(seed):
    rng = np.random.default_rng(seed); low = rng.standard_normal((H // 20 + 2, W // 20 + 2))
    ys = np.linspace(0, low.shape[0] - 1.001, H); xs = np.linspace(0, low.shape[1] - 1.001, W)
    y0 = ys.astype(int); x0 = xs.astype(int); fy = (ys - y0)[:, None]; fx = (xs - x0)[None, :]
    a = low[y0][:, x0]; b = low[y0][:, x0 + 1]; c = low[y0 + 1][:, x0]; d = low[y0 + 1][:, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
def seg_distance(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay; l2 = dx * dx + dy * dy
    t = 0 if l2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / l2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))
NEIGHBORS = [(dx, dy) for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2) if (dx, dy) != (0, 0) and math.gcd(abs(dx), abs(dy)) == 1]

def relax(poly, noise, cost, NOISE, land_bridge=False):
    """Least-cost path from poly[0] to poly[-1] inside a soft corridor around poly (lat/lon)."""
    # Work in a longitude frame centred on the polyline so boxes never split at the date line.
    lon0 = poly[0][1]
    shift = lambda lon: ((lon - lon0 + 180) % 360) - 180
    pts = [(shift(lon), lat) for lat, lon in poly]
    span = sum(math.hypot((b[0] - a[0]) * math.cos(math.radians((a[1] + b[1]) / 2)), b[1] - a[1]) for a, b in zip(pts, pts[1:]))
    CORRIDOR = max(CORRIDOR_MIN, min(CORRIDOR_MAX, .25 * span))
    minx = min(p[0] for p in pts) - 4 * CORRIDOR; maxx = max(p[0] for p in pts) + 4 * CORRIDOR
    miny = min(p[1] for p in pts) - 4 * CORRIDOR; maxy = max(p[1] for p in pts) + 4 * CORRIDOR
    def corridor(x, y):
        lon = shift(-180 + (x + .5) * STEP); lat = 90 - (y + .5) * STEP
        if lon < minx or lon > maxx or lat < miny or lat > maxy: return None
        cl = math.cos(math.radians(lat))
        d = min(seg_distance(lon * cl, lat, a[0] * cl, a[1], b[0] * cl, b[1]) for a, b in zip(pts, pts[1:])) if len(pts) > 1 else 0
        if d > 4 * CORRIDOR: return None
        return 1 + 3 * max(0, (d - CORRIDOR) / CORRIDOR) ** 2
    start = to_cell(*poly[0]); goal = to_cell(*poly[-1])
    dist = {start: 0.0}; prev = {}; heap = [(0.0, start)]; cache = {}
    def local(x, y):
        key = (x, y)
        if key not in cache:
            c = corridor(x, y); base = float(land_cost[y, x]) * 1.2 if land_bridge and sea[y, x] else float(cost[y, x])
            cache[key] = None if c is None else base * c * math.exp(NOISE * noise[y, x])
        return cache[key]
    while heap:
        d, (x, y) = heapq.heappop(heap)
        if (x, y) == goal: break
        if d > dist.get((x, y), 1e18): continue
        here = local(x, y)
        for dx, dy in NEIGHBORS:
            nx, ny = (x + dx) % W, y + dy
            if ny < 0 or ny >= H: continue
            there = local(nx, ny)
            if there is None: continue
            lat = 90 - (ny + .5) * STEP
            length = math.hypot(dx * math.cos(math.radians(lat)), dy)
            nd = d + (here + there) / 2 * length
            if nd < dist.get((nx, ny), 1e18):
                dist[(nx, ny)] = nd; prev[(nx, ny)] = (x, y); heapq.heappush(heap, (nd, (nx, ny)))
    if goal not in dist: raise SystemExit('No path for segment starting at %r' % (poly[0],))
    path = [goal]
    while path[-1] != start: path.append(prev[path[-1]])
    path.reverse()
    return [to_geo(x, y) for x, y in path], dist[goal]

def simplify(points, tol):
    if len(points) < 3: return points
    a, b = points[0], points[-1]; best, index = 0, 0
    for i, p in enumerate(points[1:-1], 1):
        d = seg_distance(p[1] * math.cos(math.radians(p[0])), p[0], a[1] * math.cos(math.radians(a[0])), a[0], b[1] * math.cos(math.radians(b[0])), b[0])
        if d > best: best, index = d, i
    if best > tol: return simplify(points[:index + 1], tol)[:-1] + simplify(points[index:], tol)
    return [a, b]

def polyline_cost(poly, cost):
    total, length = 0.0, 0.0
    for a, b in zip(poly, poly[1:]):
        n = max(2, int(math.hypot(a[0] - b[0], a[1] - b[1]) / STEP))
        for i in range(n):
            lat = a[0] + (b[0] - a[0]) * i / n; lon = a[1] + (b[1] - a[1]) * i / n
            x, y = to_cell(lat, lon); total += float(cost[y, x]); length += 1
    return total / max(1, length)

# --- routes ----------------------------------------------------------------
def fnv(text):
    h = 2166136261
    for ch in text: h = ((h ^ ord(ch)) * 16777619) & 0xffffffff
    return format(h, 'x')
noises = [smooth_noise(11 + i) for i in range(MAX_STRANDS)]
for period_id in ids:
    routes_text = open(history / ('%s.routes.json' % period_id)).read()
    routes = json.loads(routes_text)
    # Junctions: a coordinate used by two different routes is a hard stop.
    counts = {}
    for r in routes:
        for c in {tuple(c) for c in r['coordinates']}: counts[c] = counts.get(c, 0) + 1
    junctions = {c for c, n in counts.items() if n > 1}
    result, meta, t1 = {}, {}, time.time()
    for route in routes:
        settings = {**relax_settings['default'], **relax_settings['stories'].get(route['story'], {})}
        STRANDS, NOISE, SEA = settings['strands'], settings['noise'], settings['sea']
        cost = costs[SEA]
        named = relax_settings.get('places', {}).get(route['story'], {})
        if isinstance(named, str): named = relax_settings['places'][named]   # alias of another story's list
        places = {tuple(p) for p in named.values()} | junctions
        land_bridge = route['id'] in relax_settings.get('landBridge', [])
        coords = [tuple(c) for c in route['coordinates']]
        hard = [0] + [i for i, c in enumerate(coords) if c in places and 0 < i < len(coords) - 1] + [len(coords) - 1]
        strands, strand_costs = [], []
        for st in range(STRANDS):
            strand, total = [], 0.0
            for a, b in zip(hard, hard[1:]):
                piece, c = relax(coords[a:b + 1], noises[st], cost, NOISE, land_bridge); total += c
                piece = simplify(piece, .12)
                if len(piece) < 2: piece = [None, None]                      # stops share one raster cell
                piece[0] = list(coords[a]); piece[-1] = list(coords[b])     # hard stops exactly
                strand += piece if not strand else piece[1:]
            exact = {tuple(coords[i]) for i in hard}
            strands.append([[lat, lon] if (lat, lon) in exact else [round(lat, 2), round(lon, 2)] for lat, lon in strand]); strand_costs.append(round(polyline_cost(strand, cost), 3))
        result[route['id']] = strands
        meta[route['id']] = {'authored': round(polyline_cost(coords, cost), 3), 'relaxed': strand_costs, 'hard': len(hard)}
    output = history / ('%s.strands.json' % period_id)
    body = json.dumps({'generated': True, 'routesHash': fnv(routes_text), 'strands': result}, separators=(',', ':')) + '\n'
    open(output, 'w').write(body)
    print(json.dumps({'period': period_id, 'routes': len(result), 'bytes': len(body), 'seconds': round(time.time() - t1, 1)}), flush=True)
