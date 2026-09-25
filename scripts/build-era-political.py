"""Political maps across the ages, in one style, for the History timeline.

Sources: aourednik/historical-basemaps (GPL-3.0) for the six historical stops
(1000 BCE, 200, 1000, 1400, 1600 and 1800 CE) and Natural Earth Admin 0 for the
present. Every map uses the same rule: land without a polity is grey (cultural
regions of hunters, herders and peoples too), the largest polities by area get
one of twelve bold colours, everything else is a patchwork of pastels chosen so
neighbours differ, and a territory whose SUBJECTO names a bold polity takes a
lighter tint of its overlord's colour. No border pixels: the shader draws cells.

Usage: python3 scripts/build-era-political.py [all|modern|<period-id> ...]
Writes dist/maps/eras/political-<period>.png (4320 × 2160) and a 1920 × 960 mobile
copy, or dist/maps/countries.png for the present. Needs numpy, Pillow, rasterio,
shapely and pyshp; downloads the GeoJSON into data/historical-basemaps/ once.
"""
import json, re, sys, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from shapely.geometry import shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/historical-basemaps'; DATA.mkdir(parents=True, exist_ok=True)
OUT = ROOT / 'dist/maps/eras'; OUT.mkdir(parents=True, exist_ok=True)
W, H = 4320, 2160
BASE = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/'
ERAS = {'3k-ya': 'bc1000', '200-ce': '200', '1000-ce': '1000', '1400-ce': '1400', '1600-ce': '1600', '1800-ce': '1800'}
OCEAN = (43, 75, 95)
GREY = (185, 179, 171)
BOLD = ['#b8433a', '#3172b0', '#3d9a5b', '#8a4fa8', '#d4842b', '#2a9d8f', '#a83e6a', '#5a6fbf', '#8c7a1f', '#c25a2e', '#4d8f3a', '#6a5acd']
PATCH = ['#d8dfbb', '#d8bca6', '#c2d8d0', '#dccb91', '#b9cce0', '#c5b9d2', '#d3d7b1', '#a8c5bd', '#dec5c9', '#cfd9a7', '#e0c4b0', '#b6d3d9']
BOLD_COUNT = 12
# Cultural regions named for a way of life or a people, not a state: grey like unnamed land.
CULTURAL = re.compile(r"hunter|gatherer|nomad|pastoral|\bpeoples?\b|\btribes?\b|tribal|aboriginal|\bcultures?\b|foraging|fishers|fichers|farmers|shellfish|marine mammal|Siberians|Khoisan|Bantu|Samis|Karelians|Innu|Ainu|Thule|Dorset|Athabaskan|Inupiaq|Yup'ik|Suspiaq|Sugpiaq|T'atsaot'ine|Dene|Cree|Ojibw|Pampas|Oromo|Bedouin|Berber|Tuareg|Pygm|Inuit|Eskimo|Algonqu|Iroquois|Sioux|Apache|Comanche|Guaran|Tupi|Arawak|Carib\b|Taino|Boethuk|Beothuk|Māori|Maori|Papuans?|Melanesian|Polynesian|Micronesian|Australian|Aleut|Chukchi|Koryak|Yukaghir|Evenk|Nenets|Khanty|Mansi|Sakha|Yakut|Buryat|Tungus|Mapuche|Guaycuru|Charrua|Tehuelche|Selk'nam|Yaghan|San\b|Nama|Herero|Himba|Pokot|Maasai|Masai|Turkana|Somali clans|Nuer|Dinka|Shilluk|Beja|Afar|Point Peninsula|Laurel|Hopewell|Adena|Woodland|Mississippian|Anasazi|Ancestral Puebl|Hohokam|Mogollon|Poverty Point|Chavin|Chavín|Paracas|Nazca|Nasca|Moche|Chorrera|El Paraiso|Marpole|Saqqaq|Norton|Ipiutak|Jomon|Jōmon|Yayoi|Lapita|Nok\b|Kintampo|Wilton|Valdivia|Cupisnique|Machalilla|Recuay|Vicús|Chinchorro|Marajoara|Taquara", re.I)
# Plural collectives ("Hausa States", "central Asian khanates") are many small polities: patchwork, never bold.
COLLECTIVE = re.compile(r"\b(states|kingdoms|khanates|emirates|sultanates|chiefdoms|city-states|settlements|principalities|republics|cities|duchies|dominions|khaganates|confederac)", re.I)
hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
# Australia's and New Guinea's named nations of 1600–1800 are peoples, not colonies: grey like the rest of the continent.
AUSTRALIA = (112, -45, 154, -8)
COLONY = re.compile(r"New South Wales|Van Diemen|Colony|Settlement|Dutch|British|Port ", re.I)
# A plural demonym with no state word (Dravidians, Arameans, Austronesians) names a people: grey. A few
# plurals are dynasties or states and stay coloured.
DEMONYM = re.compile(r"(ans|ians|ese|ites|ars|egs|uts|ics|Sámi|Saami|Sinic|complex|Antarctica)$", re.I)
STATE_PLURALS = {'Magyars', 'Khazars', 'Palas', 'Senas', 'Pratiharas', 'Chauhans', 'Rajputs', 'Sikhs', 'Volga Bulgars', 'Buyids', 'Ghaznavids', 'Seljuks', 'Fatimids', 'Abbasids', 'Umayyads', 'Almoravids', 'Almohads', 'Ayyubids', 'Mamluks', 'Safavids', 'Timurids', 'Zands', 'Qajars', 'Hittites', 'Marathas', 'Peshemegs'}
HISTORICAL = True
def is_cultural(name, geom):
    if not name: return True
    if name == 'Antarctica': return True
    if not HISTORICAL: return False
    if CULTURAL.search(name): return True
    if DEMONYM.search(name) and name not in STATE_PLURALS and not COLLECTIVE.search(name): return True
    c = geom.centroid
    if AUSTRALIA[0] <= c.x <= AUSTRALIA[2] and AUSTRALIA[1] <= c.y <= AUSTRALIA[3] and not COLONY.search(name): return True
    return False
# "United States" and "Papal States" are one state each, not a collective of small ones.
is_collective = lambda name: bool(COLLECTIVE.search(name)) and not re.match(r'United States|Papal States|Confederate States|United Provinces', name)
# Area on the sphere, roughly: degrees² scaled by the cosine of the centroid's latitude.
def true_area(g):
    import math
    return g.area * max(.05, math.cos(math.radians(g.centroid.y)))
tint = lambda rgb, f=.45: tuple(int(c + (235 - c) * f) for c in rgb)

def fetch(year):
    path = DATA / f'world_{year}.geojson'
    if not path.exists():
        urllib.request.urlretrieve(BASE + f'world_{year}.geojson', path)
    return json.load(open(path, encoding='utf8'))

def paint(features, name_of, subject_of):
    """features: list of (geometry, name, subject). Returns the RGB image."""
    geoms = []
    rows = []
    for geom, name, subject in features:
        try:
            g = shape(geom).buffer(0)
        except Exception:
            continue
        if g.is_empty:
            continue
        geoms.append(g); rows.append((name or '', subject or ''))
    # Area per polity name (in degrees², enough to rank), then the bold set.
    # Rank empires by true area, counting a territory toward its overlord (SUBJECTO) when it has one,
    # so an empire and its viceroyalties read as one colour family.
    area = {}
    for g, (name, subject) in zip(geoms, rows):
        if not name or is_cultural(name, g): continue
        key = subject if subject and not is_cultural(subject, g) and not is_collective(subject) else name
        if is_collective(key): continue
        area[key] = area.get(key, 0) + true_area(g)
    bold_names = [n for n, _ in sorted(area.items(), key=lambda kv: -kv[1])[:BOLD_COUNT]]
    bold_color = {n: hexrgb(BOLD[i]) for i, n in enumerate(bold_names)}
    # Patchwork: greedy colouring so touching polygons differ.
    tree = STRtree(geoms)
    colors = [None] * len(geoms)
    order = sorted(range(len(geoms)), key=lambda i: -true_area(geoms[i]))
    for i in order:
        name, subject = rows[i]
        if is_cultural(name, geoms[i]):
            colors[i] = GREY; continue
        if name in bold_color:
            colors[i] = bold_color[name]; continue
        if subject in bold_color and subject != name:
            colors[i] = tint(bold_color[subject]); continue
        used = set()
        for j in tree.query(geoms[i]):
            j = int(j)
            if j != i and colors[j] is not None and geoms[i].intersects(geoms[j]):
                used.add(colors[j])
        # Same-named polygons (one polity in pieces) share a colour when possible.
        same = next((colors[j] for j in range(len(geoms)) if j != i and rows[j][0] == name and colors[j] is not None), None)
        pick = same if same is not None and same not in used else next((hexrgb(c) for c in PATCH if hexrgb(c) not in used), hexrgb(PATCH[i % len(PATCH)]))
        colors[i] = pick
    ids = rasterize([(g.__geo_interface__, k + 1) for k, g in enumerate(geoms)], out_shape=(H, W), transform=from_bounds(-180, -90, 180, 90, W, H), fill=0, dtype='uint16')
    table = np.zeros((len(geoms) + 1, 3), dtype='uint8'); table[0] = OCEAN
    for k, c in enumerate(colors): table[k + 1] = c
    return Image.fromarray(table[ids]), bold_names

def build_era(period):
    global HISTORICAL
    HISTORICAL = True
    year = ERAS[period]
    g = fetch(year)
    features = [(f['geometry'], f['properties'].get('NAME'), f['properties'].get('SUBJECTO')) for f in g['features'] if f.get('geometry')]
    image, bold = paint(features, None, None)
    image.save(OUT / f'political-{period}.png')
    (OUT / 'mobile').mkdir(exist_ok=True)
    image.resize((1920, 960), Image.Resampling.NEAREST).save(OUT / f'mobile/political-{period}.png')
    print(period, year, 'bold:', ', '.join(bold))

def build_modern():
    global HISTORICAL
    HISTORICAL = False
    import shapefile
    reader = shapefile.Reader(str(next((ROOT / 'data/countries').glob('*.shp'))))
    features = []
    fields = reader.fields
    names = [f[0] for f in fields[1:]]
    for rec in reader.iterShapeRecords():
        r = dict(zip(names, rec.record))
        name = r.get('NAME_LONG') or r.get('NAME'); sovereign = r.get('SOVEREIGNT') or ''
        features.append((rec.shape.__geo_interface__, name, sovereign if sovereign and sovereign != r.get('ADMIN') and sovereign != name else ''))
    image, bold = paint(features, None, None)
    image.save(ROOT / 'dist/maps/countries.png')
    (ROOT / 'dist/maps/mobile').mkdir(exist_ok=True)
    image.resize((1920, 960), Image.Resampling.NEAREST).save(ROOT / 'dist/maps/mobile/countries.png')
    print('modern bold:', ', '.join(bold))

def build_none():
    """Before states: every land grey, for the periods with no polity to draw (Early hominins, Peopling the world)."""
    global HISTORICAL
    HISTORICAL = True
    import shapefile
    reader = shapefile.Reader(str(next((ROOT / 'data/countries').glob('*.shp'))))
    features = [(rec.shape.__geo_interface__, None, '') for rec in reader.iterShapeRecords()]
    image, _ = paint(features, None, None)
    image.save(OUT / 'political-none.png')
    (OUT / 'mobile').mkdir(exist_ok=True)
    image.resize((1920, 960), Image.Resampling.NEAREST).save(OUT / 'mobile/political-none.png')
    print('none: all land grey')

if __name__ == '__main__':
    targets = sys.argv[1:] or ['all']
    if 'all' in targets: targets = ['modern', 'none', *ERAS]
    for t in targets:
        build_modern() if t == 'modern' else build_none() if t == 'none' else build_era(t)
