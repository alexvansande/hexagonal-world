"""Bounded-memory, lossless PNG experiment. Never modifies the source library."""
import json, math, sys, os
from pathlib import Path
from functools import lru_cache
import numpy as np
from PIL import Image, ImageColor

root = Path(__file__).resolve().parent.parent / 'dist/maps/default-layers'
action, scratch = sys.argv[1], Path(sys.argv[2])
entry = json.loads((scratch/'entry.json').read_text())
source = root/entry['path']

if action == 'prepare':
    size = 256 * 2**entry['maxLevel']
    base = root/entry.get('basePath', entry['path']+'/base')
    for r in range(entry['regions']):
        im = Image.new('RGB', (size, size))
        for y in range(size//256):
            for x in range(size//256):
                with Image.open(base/str(r)/str(entry['maxLevel'])/f'{x}-{y}.png') as tile:
                    im.paste(tile.crop((1,1,257,257)), (x*256,y*256))
        im.save(scratch/f'{r}.png', compress_level=1)
    sys.exit()

out = Path(sys.argv[3]).resolve()
meta = json.loads((scratch/'meta.json').read_text())
w,h = meta['width'],meta['height']
background = ImageColor.getrgb(meta['background'])
info = entry['lighting']
level = info.get('detailLevel',0)
# Reuse the exact density-capped comparison when available. Other styles use
# their highest existing lighting, sampled once into the map's pixel grid.
if info.get('mapResolution'):
    light_level = 'map'
    sw,sh = info['mapResolution']['width'],info['mapResolution']['height']
elif level:
    light_level = str(level)
    sm = json.loads((source/'detail'/f'complete-{level}.json').read_text())
    sw,sh = sm['width'],sm['height']
else:
    light_level = None
    sw,sh = info['width'],info['height']
meta['lightingSource'] = light_level or 'overview'

@lru_cache(maxsize=80)
def load(path):
    with Image.open(path) as im: return im.convert('RGB')

def region(box, width, height, size, getter, gutter=0, fill=background):
    x0,y0,x1,y1 = box
    result = Image.new('RGB',(x1-x0,y1-y0),fill)
    for yy in range(max(0,y0//size),min(math.ceil(height/size),math.ceil(y1/size))):
        for xx in range(max(0,x0//size),min(math.ceil(width/size),math.ceil(x1/size))):
            im = getter(xx,yy)
            if im is not None:
                result.paste(im.crop((gutter,gutter,min(im.width-gutter,width-xx*size+gutter),min(im.height-gutter,height-yy*size+gutter))), (xx*size-x0,yy*size-y0))
    # Match clamped sampling at the outermost pixel.
    if x0<0: result.paste(result.crop((-x0,0,-x0+1,result.height)).resize((-x0,result.height)),(0,0))
    if y0<0: result.paste(result.crop((0,-y0,result.width,-y0+1)).resize((result.width,-y0)),(0,0))
    if x1>width: result.paste(result.crop((width-x0-1,0,width-x0,result.height)).resize((x1-width,result.height)),(width-x0,0))
    if y1>height: result.paste(result.crop((0,height-y0-1,result.width,height-y0)).resize((result.width,y1-height)),(0,height-y0))
    return result

for y in ([] if os.environ.get('MERGE_PHASE')=='pyramid' else range(0,h,1024)):
    for x in range(0,w,1024):
        base = load(str(scratch/f'base-{x}-{y}.png'))
        bw,bh = base.size
        # Pixel-center alignment matches the existing full-map lighting UVs.
        sx=sw/(info['rect'][2]*meta['density']);sy=sh/(info['rect'][3]*meta['density'])
        box = (x*sx,y*sy,min(sw,(x+bw)*sx),min(sh,(y+bh)*sy))
        sampled=[]
        for layer in range(2):
            if light_level is None:
                im=load(str(source/'light'/str(layer)/f'preview-{info["maxLevel"]}.png'))
                reduced=im.resize((bw,bh),Image.Resampling.LANCZOS,box=box)
            else:
                bounds=(max(0,math.floor(box[0])-4),max(0,math.floor(box[1])-4),min(sw,math.ceil(box[2])+4),min(sh,math.ceil(box[3])+4))
                im=region(bounds,sw,sh,256,lambda xx,yy:load(str(source/'detail'/str(layer)/light_level/f'{xx}-{yy}.png')),1)
                local=(box[0]-bounds[0],box[1]-bounds[1],box[2]-bounds[0],box[3]-bounds[1])
                reduced=im.resize((bw,bh),Image.Resampling.LANCZOS,box=local)
            sampled.append(np.asarray(reduced,dtype=np.float32))
        gain=sampled[0]/128.0
        dark=float(entry['signature']['state']['shadowOpacity']);light=float(entry['signature']['state']['lightOpacity'])
        value=np.asarray(base,dtype=np.float32)*(1-np.maximum(1-gain,0)*dark+np.maximum(gain-1,0)*light)+sampled[1]*light
        Image.fromarray(np.clip(np.rint(value),0,255).astype('uint8')).save(scratch/f'lit-{x}-{y}.png',compress_level=1)
    print('Merged row',entry['path'],y,h,flush=True)
load.cache_clear()

# Sparse tile pyramids: exact background tiles need no file or network request.
max_level=max(0,math.ceil(math.log2(max(w,h)/256)))
levels={}
for z in range(max_level,-1,-1):
    width=math.ceil(w/2**(max_level-z));height=math.ceil(h/2**(max_level-z))
    folder=out/str(z);folder.mkdir(parents=True,exist_ok=True);present=[]
    if z==max_level:
        getter=lambda x,y:load(str(scratch/f'lit-{x*1024}-{y*1024}.png'))
    else:
        parent=levels[str(z+1)];keys=set(parent['tiles'])
        getter=lambda x,y:load(str(out/str(z+1)/f'{x}-{y}.png')) if f'{x}-{y}' in keys else None
    for y in range(math.ceil(height/256)):
        for x in range(math.ceil(width/256)):
            if os.environ.get('MERGE_PHASE')=='pyramid' and (folder/f'{x}-{y}.png').exists():
                present.append(f'{x}-{y}')
                continue
            bw=min(256,width-x*256);bh=min(256,height-y*256)
            if z==max_level:
                tile=region((x*256-1,y*256-1,x*256+bw+1,y*256+bh+1),w,h,1024,getter)
            else:
                # Filter with neighboring pixels, not independently per tile.
                box=(x*512-8,y*512-8,x*512+bw*2+8,y*512+bh*2+8)
                source_im=region(box,parent['width'],parent['height'],256,getter,1)
                tile=source_im.resize((bw+8,bh+8),Image.Resampling.LANCZOS).crop((3,3,bw+5,bh+5))
            pixels=np.asarray(tile)
            if np.all(pixels==background):continue
            tile.save(folder/f'{x}-{y}.png',compress_level=6)
            present.append(f'{x}-{y}')
    levels[str(z)]={'width':width,'height':height,'tiles':present}
    load.cache_clear();print('Pyramid',entry['path'],z,len(present),flush=True)
meta.update(maxLevel=max_level,levels=levels,path=str(out).split('/dist/')[1])
(out/'entry.json').write_text(json.dumps(meta))
# Only this script's scratch chunks are removed; old map assets are untouched.
for pattern in ('base-*.png','lit-*.png'):
    for p in scratch.glob(pattern):p.unlink()
