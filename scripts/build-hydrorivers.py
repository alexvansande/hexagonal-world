"""Prepare 12 HydroRIVERS distance masks; requires numpy, Pillow and scipy.

Run after extracting data/hydrorivers/HydroRIVERS_v10_shp.zip into extracted/.
Each lossless RGB PNG stores distance / nominal river radius * 64 in red
and nominal pixel width * 64 in green. Blue is reserved.
255 is outside the supported width range. The browser thresholds one image,
so changing width never downloads the original global vector network.
"""
from pathlib import Path
import hashlib, json, mmap, struct
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/hydrorivers/extracted/HydroRIVERS_v10_shp/HydroRIVERS_v10'
OUT = ROOT / 'dist/maps/hydrorivers/v2'
THRESHOLDS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 30, 20, 10, 5]
SIZES = [('desktop', 4320), ('mobile', 1440)]

def records():
    with SOURCE.with_suffix('.dbf').open('rb') as f:
        h = f.read(32)
        count = struct.unpack_from('<I', h, 4)[0]
        start, length = struct.unpack_from('<HH', h, 8)
        fields, offset = [], 1
        while True:
            b = f.read(32)
            if b[0] == 13: break
            fields.append((b[:11].split(b'\0')[0].decode(), offset, b[16]))
            offset += b[16]
    dtype = np.dtype({'names': [x[0] for x in fields], 'formats': ['S'+str(x[2]) for x in fields],
                      'offsets': [x[1] for x in fields], 'itemsize': length})
    return np.memmap(SOURCE.with_suffix('.dbf'), mode='r', offset=start, dtype=dtype, shape=(count,))

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    data = records()
    discharge = data['DIS_AV_CMS'].astype(float)
    levels = np.searchsorted(-np.array(THRESHOLDS), -discharge, side='left')
    assert len(data) == 8477883 and np.isfinite(discharge).all()
    counts = np.bincount(levels, minlength=13)[:12]
    masks = {name: [Image.new('1', (w,w//2)) for _ in THRESHOLDS] for name,w in SIZES}
    draws = {name: [ImageDraw.Draw(im) for im in images] for name,images in masks.items()}
    with SOURCE.with_suffix('.shp').open('rb') as f:
        shp = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
        pos = 100
        for index,level in enumerate(levels):
            length = struct.unpack_from('>I', shp, pos+4)[0]*2
            base = pos+8
            kind = struct.unpack_from('<I', shp, base)[0]
            if kind != 0 and level<12:
                assert kind == 3, kind
                parts, count = struct.unpack_from('<II', shp, base+36)
                starts = list(struct.unpack_from('<'+str(parts)+'I', shp, base+44))+[count]
                coords = struct.unpack_from('<'+str(count*2)+'d', shp, base+44+parts*4)
                for name,w in SIZES:
                    points = [(max(0,min(w-1,int((coords[i]+180)/360*w))),max(0,min(w//2-1,int((90-coords[i+1])/180*(w//2))))) for i in range(0,len(coords),2)]
                    for a,b in zip(starts,starts[1:]):
                        # Never draw a straight line across the map at the dateline.
                        segment = []
                        for j in range(a,b):
                            if segment and abs(points[j][0]-segment[-1][0])>w/2:
                                if len(segment)>1: draws[name][level].line(segment, fill=1)
                                elif segment: draws[name][level].point(segment[0], fill=1)
                                segment=[]
                            segment.append(points[j])
                        if len(segment)>1: draws[name][level].line(segment, fill=1)
                        elif segment: draws[name][level].point(segment[0], fill=1)
            pos = base+length
            if (index+1)%500000 == 0: print('Rasterized', index+1, 'of',len(data),flush=True)
        assert pos == len(shp)
        shp.close()
    manifest = {'source':'https://www.hydrosheds.org/products/hydrorivers','version':'1.0','records':len(data),'includedRecords':int(counts.sum()),
                'minimumDischargeM3s':THRESHOLDS,'cumulativeRecords':np.cumsum(counts).tolist(),
                'encoding':'R: distance / nominal radius * 64 (255 outside); G: nominal pixel width * 64; B: reserved', 'files':[]}
    for name,w in SIZES:
        best = np.full((w//2,w),255,dtype=np.uint8)
        widths = np.zeros((w//2,w),dtype=np.uint8)
        for level in range(12):
            center = np.asarray(masks[name][level], dtype=bool)
            if center.any():
                # Wrap longitude before measuring distance; no seam at +/-180 degrees.
                pad=8
                distance = distance_transform_edt(~np.pad(center,((0,0),(pad,pad)),mode='wrap'))[:,pad:-pad]
                radius = (1.2 if level<4 else .775 if level<8 else .475)*(w/4320)
                field = np.minimum(255,np.rint(distance/radius*64)).astype(np.uint8)
                widths[field<best] = round(radius*2*64)
                best = np.minimum(best,field)
            dest=OUT/name/f'level-{level+1}.png';dest.parent.mkdir(parents=True,exist_ok=True)
            Image.fromarray(np.stack([best,widths,np.zeros_like(best)],axis=-1)).save(dest,optimize=True)
            info={'path':str(dest.relative_to(ROOT/'dist')),'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
                  'width':w,'height':w//2,'level':level+1,'pixelsAtWidth1':int((best<=64).sum())}
            manifest['files'].append(info)
            print(name,level+1,info['bytes'],'bytes',info['pixelsAtWidth1'],'river pixels',flush=True)
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
