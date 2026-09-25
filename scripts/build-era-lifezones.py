"""Life zones of the last glacial world for the History timeline.

Inputs: CHELSA-TraCE21k (CC0) centennial layers at timestep -200 (about 21,000
years ago): bio01 (mean annual temperature), bio05/bio06 (warmest and coldest
month), bio12 (annual precipitation) and dem (surface altitude, ice sheets
included, sea level of the time), plus dem at timestep 20 (present) to find the
ice. Holdridge life zones are classified from biotemperature (a sinusoidal
year between bio06 and bio05, negative months counted as 0) and the ratio of
potential evapotranspiration to precipitation, in the 38 classes of the site's
present-day raster; ice sheets are class 1. Ocean cells keep the present
raster's exposure and temperature channels; shelf exposed at the time becomes
land. Output: dist/maps/eras/ecology-<period>.png in the ecology-waves.png
encoding (R class, G exposure, B temperature). Usage:
  python3 scripts/build-era-lifezones.py [--data DIR] [--period 50k-ya] [--step -200]
"""
import argparse, json, math
from pathlib import Path
import numpy as np
import rasterio
from rasterio.enums import Resampling
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument('--data', default=str(ROOT / 'data/chelsa-trace'))
ap.add_argument('--period', default='50k-ya')
ap.add_argument('--step', default='-200')
ap.add_argument('--ice', type=float, default=250, help='metres of surface rise over the present that count as ice sheet')
args = ap.parse_args()
DATA = Path(args.data)
W, H = 1440, 720
def layer(name, step):
    path = DATA / f'CHELSA_TraCE21k_{name}_{step}_V1.0.tif'
    with rasterio.open(path) as ds:
        a = ds.read(1, out_shape=(1, H, W), resampling=Resampling.average).astype('float64')
        nodata = ds.nodata
        # CHELSA stores °C × 10 with an offset (see tags) or plain values; read the scale and offset when present.
        scale = ds.scales[0] if ds.scales else 1; offset = ds.offsets[0] if ds.offsets else 0
        tags = ds.tags(1)
        print(name, step, 'dtype', ds.dtypes[0], 'nodata', nodata, 'scale', scale, 'offset', offset, 'range', float(np.nanmin(a)), float(np.nanmax(a)), {k: v for k, v in tags.items() if k.lower() in ('scale', 'offset', 'unit', 'units', 'scale_factor', 'add_offset')})
        mask = (a == nodata) if nodata is not None else np.zeros_like(a, dtype=bool)
        return a * scale + offset, mask
bio01, m1 = layer('bio01', args.step); bio05, _ = layer('bio05', args.step); bio06, _ = layer('bio06', args.step); bio12, m12 = layer('bio12', args.step)
dem, mdem = layer('dem', args.step); dem_now, mnow = layer('dem', '20')
# Units: CHELSA-TraCE21k bio temperatures are K × 10 (offset applied above or not): bring to °C.
def celsius(a):
    a = np.where(a > 1000, a / 10 - 273.15, a)   # K × 10
    a = np.where(a > 200, a - 273.15, a)         # K
    return a
t_mean, t_max, t_min = celsius(bio01), celsius(bio05), celsius(bio06)
precip = np.where(bio12 > 20000, bio12 / 10, bio12)  # mm (× 10 in some releases)
# Biotemperature: mean over a sinusoidal year of max(0, T), analytic.
amp = np.maximum(0, (t_max - t_min) / 2); mid = (t_max + t_min) / 2
with np.errstate(invalid='ignore', divide='ignore'):
    ratio = np.clip(mid / np.where(amp > 0, amp, 1), -1, 1)
    theta = np.arccos(-ratio)  # half-width of the warm season in radians (T > 0 when cos φ > -mid/amp)
    bio_t = np.where(amp > 0, (mid * theta + amp * np.sin(theta)) / math.pi, np.maximum(0, mid))
bio_t = np.clip(bio_t, 0, 30)
pet_ratio = np.where(precip > 0, bio_t * 58.93 / np.maximum(precip, 1), 99)
# Holdridge belts and humidity provinces in the site's class numbering.
belts = [(3, 'polar'), (6, 'boreal'), (12, 'cool'), (18, 'warm'), (24, 'subtropical'), (99, 'tropical')]
def classify(bt, r):
    belt = next(name for limit, name in belts if bt < limit)
    if belt == 'polar':   return 6 if r < .25 else 5 if r < .5 else 4 if r < 1 else 3 if r < 2 else 2
    if belt == 'boreal':  return 11 if r < .25 else 10 if r < .5 else 9 if r < 1 else 8 if r < 2 else 7
    if belt == 'cool':    return 17 if r < .25 else 16 if r < .5 else 15 if r < 1 else 14 if r < 2 else 13 if r < 4 else 12
    if belt == 'warm':    return 24 if r < .25 else 23 if r < .5 else 22 if r < 1 else 21 if r < 2 else 20 if r < 4 else 19 if r < 8 else 18
    if belt == 'subtropical': return 31 if r < .25 else 30 if r < .5 else 29 if r < 1 else 28 if r < 2 else 27 if r < 4 else 26 if r < 8 else 25
    return 38 if r < .5 else 37 if r < 1 else 36 if r < 2 else 35 if r < 4 else 34 if r < 8 else 33 if r < 16 else 32
vec = np.vectorize(classify, otypes=['uint8'])
classes = vec(bio_t, pet_ratio)
present = np.asarray(Image.open(ROOT / 'dist/maps/ecology-waves.png').convert('RGB'))
assert present.shape[:2] == (H, W)
land_now = present[:, :, 0] != 0
# Land of the time: where the climate layers have data and the altitude is above the sea level of the time,
# or present land (the layers may be masked over ice).
land = (~m1) & (~mdem) & (dem > 0) | land_now
ice = (~mdem) & (~mnow) & ((dem - np.where(mnow, 0, dem_now)) > args.ice) & land
out = present.copy()
out[land, 0] = classes[land]; out[land & ~land_now, 1] = 0; out[land & ~land_now, 2] = 0
out[ice, 0] = 1
# Antarctica stays as the site draws it (class set by the app); keep present values south of 60°S.
south = (90 - (np.arange(H) + .5) * 180 / H) < -60
out[south] = present[south]
Image.fromarray(out).save(ROOT / 'dist/maps/eras' / f'ecology-{args.period}.png')
print('land cells', int(land.sum()), 'of which new shelf', int((land & ~land_now).sum()), 'ice cells', int(ice.sum()), 'classes', np.unique(classes[land]).tolist())
