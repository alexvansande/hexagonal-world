"""Fuse freshly projected Pacific lighting with the unchanged unlit map bases.
Run after /tests/bake-pacific.html reports Complete. Builds only the two moved
Americas pieces, at the default map's 2048 pixels per map unit.
"""
import json, os, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageColor
ROOT=Path(__file__).resolve().parents[1]
scratch=Path('/tmp/hex-pacific-bake')
meta=json.loads((scratch/'meta.json').read_text())
background=ImageColor.getrgb(meta['background'])
for y in range(0,meta['height'],1024):
 for x in range(0,meta['width'],1024):
  def read(name):
   with Image.open(scratch/f'{name}-{x}-{y}.png') as im:return np.asarray(im.convert('RGB'),dtype=np.float32)
  base=read('base');gain=read('light-0')/128.;additive=read('light-1')
  value=np.clip(np.rint(base*gain+additive),0,255).astype('uint8')
  value[np.all(base==background,axis=2)]=background
  Image.fromarray(value).save(scratch/f'lit-{x}-{y}.png',compress_level=1)
 print('Fused Pacific row',y,flush=True)
out=ROOT/'dist/maps/tours/pacific-v1'
subprocess.run([sys.executable,str(ROOT/'scripts/merge-map-images.py'),'merge',str(scratch),str(out)],env={**os.environ,'MERGE_PHASE':'pyramid'},check=True)
entry=json.loads((out/'entry.json').read_text())
entry['lightingSource']=meta['lightingSource']
(out/'entry.json').write_text(json.dumps(entry))
(ROOT/'dist/maps/pacific-manifest.mjs').write_text('export default '+json.dumps(entry,separators=(',',':'))+';\n')
print('Pacific assets ready:',out,flush=True)
