"""Package the supplied scalar elevation raster, without inventing elevations.

Run from the project root with Python and Pillow. A one-pixel gutter on each
tile preserves bilinear filtering across tile boundaries and the dateline.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
Image.MAX_IMAGE_PIXELS = 300_000_000
source = Image.open(ROOT / "data/height.png")
height = source.convert("L")
out = ROOT / "dist/maps/height"
out.mkdir(parents=True, exist_ok=True)
width, tall = height.size
tw, th = width // 3, tall // 2
assert (width, tall) == (21600, 10800), "Update the tiling manifest for a different source size"
height.resize((5400, 2700), Image.Resampling.LANCZOS).save(out / "overview.png")
for row in range(2):
    for col in range(3):
        x, y = col * tw, row * th
        tile = Image.new("L", (tw + 2, th + 2))
        tile.paste(height.crop((x, y, x + tw, y + th)), (1, 1))
        for target, sx in [(0, (x - 1) % width), (tw + 1, (x + tw) % width)]:
            tile.paste(height.crop((sx, y, sx + 1, y + th)), (target, 1))
        for target, sy in [(0, max(0, y - 1)), (th + 1, min(tall - 1, y + th))]:
            tile.paste(height.crop((x, sy, x + tw, sy + 1)), (1, target))
            for tx, sx in [(0, (x - 1) % width), (tw + 1, (x + tw) % width)]:
                tile.putpixel((tx, target), height.getpixel((sx, sy)))
        filename = f"{row}-{col}.png"
        tile.save(out / filename)
        print(filename, tile.size, flush=True)
metadata = {
    "source": "data/height.png (user supplied)",
    "size": [width, tall], "sourcePrecisionBits": 8,
    "encoding": "Grayscale brightness; higher is higher. Physical vertical units are unspecified.",
    "seaLevel": 105 / 255,
    "seaLevelNote": "Approximate coastal brightness, adjustable in the relief controls; not a calibrated datum.",
    "overview": "overview.png", "overviewSize": [5400, 2700],
    "columns": 3, "rows": 2, "tileSize": [tw, th], "gutter": 1,
    "tiles": [f"{row}-{col}.png" for row in range(2) for col in range(3)],
}
(out / "manifest.json").write_text(json.dumps(metadata, indent=2) + "\n")
