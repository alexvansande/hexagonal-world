"""Fuse an unlit region base with baked lighting windows into one lit RGBA image.
Arguments: scratch region class resolution window. Keeps the base alpha so the
region tiler can pad the hexagon's edges as it does for the unlit base."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
scratch,region,klass,resolution,window=Path(sys.argv[1]),int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4]),int(sys.argv[5])
base=np.asarray(Image.open(scratch/f'base-{region}.png').convert('RGBA'),dtype=np.float32)
lit=base.copy()
for y in range(0,resolution,window):
 for x in range(0,resolution,window):
  gain=np.asarray(Image.open(scratch/f'light-{region}-{klass}-0-{x}-{y}.png').convert('RGB'),dtype=np.float32)/128.
  add=np.asarray(Image.open(scratch/f'light-{region}-{klass}-1-{x}-{y}.png').convert('RGB'),dtype=np.float32)
  h,w=gain.shape[:2]
  lit[y:y+h,x:x+w,:3]=np.clip(np.rint(base[y:y+h,x:x+w,:3]*gain+add),0,255)
Image.fromarray(lit.astype('uint8'),'RGBA').save(scratch/f'lit-{region}-{klass}.png',compress_level=1)
print('fused',region,klass,flush=True)
