"""Build lossless, guttered zoom tiles from a GPU-rendered map region."""
import sys
from pathlib import Path
from PIL import Image
source,out,max_level=sys.argv[1],Path(sys.argv[2]),int(sys.argv[3])
image=Image.open(source).convert('RGBA')
# Extend colors outside the hex to prevent dark filtered projection seams.
import numpy as np
pixels=np.array(image);valid=pixels[:,:,3]==255
rows=np.flatnonzero(valid.any(axis=1))
for y in range(len(pixels)):
    yy=int(np.clip(y,rows[0],rows[-1]));xs=np.flatnonzero(valid[yy])
    pixels[y]=pixels[yy,np.clip(np.arange(image.width),xs[0],xs[-1])]
image=Image.fromarray(pixels[:,:,:3])
for level in range(max_level+1):
    size=256*2**level
    scaled=image if image.width==size else image.resize((size,size),Image.Resampling.LANCZOS)
    # Extend edge pixels to fill gutters at the square's perimeter.
    padded=Image.new('RGB',(size+2,size+2));padded.paste(scaled,(1,1))
    padded.paste(scaled.crop((0,0,size,1)),(1,0));padded.paste(scaled.crop((0,size-1,size,size)),(1,size+1))
    padded.paste(padded.crop((1,0,2,size+2)),(0,0));padded.paste(padded.crop((size,0,size+1,size+2)),(size+1,0))
    folder=out/str(level);folder.mkdir(parents=True,exist_ok=True)
    for y in range(2**level):
        for x in range(2**level):
            padded.crop((x*256,y*256,x*256+258,y*256+258)).save(folder/f'{x}-{y}.webp',lossless=True,method=1)
