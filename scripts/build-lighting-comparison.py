"""Temporary exact-density comparison tiles, downsampled from existing lighting.

Usage: python scripts/build-lighting-comparison.py dymaxion/satellite ...
Keeps the original lighting and map images intact. No terrain is re-rendered.
"""
import json
import math
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'dist/maps/default-layers/v1'
for key in sys.argv[1:]:
    folder = root / key
    entry = json.loads((folder / 'entry.json').read_text())
    light = entry['lighting']
    level = light.get('detailLevel', 0)
    if not level:
        raise ValueError(f'{key}: high-resolution lighting has not been prepared')
    density = 128 * 2 ** entry['maxLevel']  # 256-pixel tiles span two map units at level zero.
    original_density = 2200 / max(light['rect'][2:]) * 2 ** level
    if original_density <= density:
        continue
    source = folder / 'detail'
    size = json.loads((source / f'complete-{level}.json').read_text())
    w, h = size['width'], size['height']
    # Retain the exact density, padding the last fractional pixel with edge pixels.
    width = math.ceil(light['rect'][2] * density)
    height = math.ceil(light['rect'][3] * density)
    for layer in range(2):
        full = Image.new('RGB', (w, h))
        for y in range(math.ceil(h / 256)):
            for x in range(math.ceil(w / 256)):
                with Image.open(source / str(layer) / str(level) / f'{x}-{y}.png') as tile:
                    full.paste(tile.crop((1, 1, min(257, w-x*256+1), min(257, h-y*256+1))), (x*256, y*256))
        reduced = full.resize((width, height), Image.Resampling.LANCZOS)
        full.close()
        out = source / str(layer) / 'map'
        out.mkdir(parents=True, exist_ok=True)
        for y in range(math.ceil(height / 256)):
            for x in range(math.ceil(width / 256)):
                tile = reduced.crop((x*256-1, y*256-1, min(width+1, x*256+257), min(height+1, y*256+257)))
                if x == 0:
                    tile.paste(tile.crop((1, 0, 2, tile.height)), (0, 0))
                if y == 0:
                    tile.paste(tile.crop((0, 1, tile.width, 2)), (0, 0))
                if x*256+256 >= width:
                    tile.paste(tile.crop((tile.width-2, 0, tile.width-1, tile.height)), (tile.width-1, 0))
                if y*256+256 >= height:
                    tile.paste(tile.crop((0, tile.height-2, tile.width, tile.height-1)), (0, tile.height-1))
                r, g, b = tile.split()
                if r.tobytes() == g.tobytes() == b.tobytes():
                    tile = r
                tile.save(out / f'{x}-{y}.png', compress_level=6)
        reduced.close()
    light['mapResolution'] = {'density': density, 'width': width, 'height': height}
    (folder / 'entry.json').write_text(json.dumps(entry))
    print(f'{key}: {original_density:.1f} → {density} pixels per map unit', flush=True)

entries = {str(p.parent.relative_to(root)): json.loads(p.read_text()) for p in root.glob('*/*/entry.json')}
(root.parent / 'manifest.mjs').write_text('export default '+json.dumps({'version': 1, 'entries': entries})+';\n')
