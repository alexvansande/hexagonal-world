"""Lossless PNG tile pyramids; gutters match the existing surface sampling."""
import sys,json
from pathlib import Path
from PIL import Image
import numpy as np
source,out,level,kind=sys.argv[1],Path(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
im=Image.open(source).convert('RGBA')
if kind=='region':
 p=np.array(im);valid=p[:,:,3]>0;rows=np.flatnonzero(valid.any(axis=1))
 for y in range(len(p)):
  yy=int(np.clip(y,rows[0],rows[-1]));xs=np.flatnonzero(valid[yy]);p[y]=p[yy,np.clip(np.arange(im.width),xs[0],xs[-1])]
 im=Image.fromarray(p[:,:,:3])
else: im=im.convert('RGB')
for l in range(level+1):
 w,h=(256*2**l,256*2**l) if kind=='region' else (max(1,round(im.width/2**(level-l))),max(1,round(im.height/2**(level-l))))
 scaled=im if im.size==(w,h) else im.resize((w,h),Image.Resampling.LANCZOS)
 padded=np.pad(np.array(scaled),((1,1),(1,1),(0,0)),mode='edge');padded=Image.fromarray(padded)
 folder=out/str(l);folder.mkdir(parents=True,exist_ok=True)
 if kind!='region':
  scaled.save(out/f'preview-{l}.png',compress_level=6)
  continue
 for y in range((h+255)//256):
  for x in range((w+255)//256):
   padded.crop((x*256,y*256,min(w+2,x*256+258),min(h+2,y*256+258))).save(folder/f'{x}-{y}.png',compress_level=6)
(out/'complete.json').write_text(json.dumps({'maxLevel':level,'width':im.width,'height':im.height}))
