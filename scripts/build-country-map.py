"""Build categorical political textures without decorative border pixels."""
from pathlib import Path
import numpy as np
import shapefile
from rasterio.features import rasterize
from rasterio.transform import from_bounds
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PALETTE = ['#d8dfbb', '#d8bca6', '#c2d8d0', '#dccb91', '#b9cce0',
           '#c5b9d2', '#d3d7b1', '#a8c5bd', '#dec5c9']

def build_country_map():
    countries = shapefile.Reader(str(next((ROOT / 'data/countries').glob('*.shp'))))
    width, height = 4320, 2160
    ids = rasterize([(s.shape.__geo_interface__, i + 1)
                     for i, s in enumerate(countries.iterShapeRecords())],
                    out_shape=(height, width),
                    transform=from_bounds(-180, -90, 180, 90, width, height),
                    fill=0, dtype='uint16')
    colors = np.zeros((len(countries) + 1, 3), dtype='uint8')
    colors[0] = [43, 75, 95]
    for i, record in enumerate(countries.records(), 1):
        color = PALETTE[(int(record['MAPCOLOR9']) - 1) % len(PALETTE)]
        colors[i] = [int(color[j:j + 2], 16) for j in (1, 3, 5)]
    image = Image.fromarray(colors[ids])
    output = ROOT / 'dist/maps'
    image.save(output / 'countries.png')
    (output / 'mobile').mkdir(exist_ok=True)
    image.resize((1920, 960), Image.Resampling.NEAREST).save(output / 'mobile/countries.png')

if __name__ == '__main__':
    build_country_map()
    print('Built desktop and mobile political maps from country fills only.')
