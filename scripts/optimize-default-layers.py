"""Lossless PNG optimization; never quantize or discard a color.
Run after the offline bakers. Removes their unused overview tile copies.
"""
from pathlib import Path
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
import io,sys
root=Path(__file__).resolve().parent.parent/'dist/maps/default-layers/v1'
fast='--grayscale-only' in sys.argv
def optimize(path):
 original=path.read_bytes()
 with Image.open(io.BytesIO(original)) as image:
  if fast and image.mode=='L':return 0
  image=image.convert('RGB');candidate=image
  r,g,b=image.split()
  if r.tobytes()==g.tobytes()==b.tobytes():candidate=r
  elif not fast and image.getcolors(256) is not None:
   pal=image.quantize(colors=256,dither=Image.Dither.NONE)
   if pal.convert('RGB').tobytes()==image.tobytes():candidate=pal
  if fast and candidate.mode!='L':return 0
  stream=io.BytesIO();candidate.save(stream,format='PNG',optimize=not fast,compress_level=6 if fast else 9)
  data=stream.getvalue()
  if len(data)<len(original):
   temporary=path.with_suffix('.tmp');temporary.write_bytes(data);temporary.replace(path);return len(original)-len(data)
 return 0
if __name__=='__main__':
 for p in root.glob('*/*/light/*/[0-9]/*.png'):p.unlink()
 files=list(root.glob('*/*/detail/1/*/*.png')) if fast else list(root.rglob('*.png'))
 with ProcessPoolExecutor(max_workers=2) as pool:
  saved=sum(pool.map(optimize,files,chunksize=64))
 print(f'Optimized {len(files)} PNG files; saved {saved/1e6:.1f} MB without changing pixels.')
