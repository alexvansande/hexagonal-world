"""Make responsive thumbnails from the original style preview PNGs."""
from pathlib import Path
from PIL import Image

folder = Path(__file__).resolve().parents[1] / 'dist/maps/styles'
for source in sorted(folder.glob('*.png')):
    with Image.open(source) as original:
        for width in (240, 480):
            image = original.convert('RGB')
            image.thumbnail((width, round(width * original.height / original.width)), Image.Resampling.LANCZOS)
            image.save(source.with_name(f'{source.stem}-{width}.webp'), quality=78, method=6)
print('Created 240px and 480px WebP style thumbnails.')
