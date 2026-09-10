"""Build compact lon/lat river paths from Natural Earth 10m river centerlines."""
from pathlib import Path
import json,shapefile
root=Path(__file__).resolve().parents[1]
r=shapefile.Reader(str(next((root/'data/rivers10').glob('*.shp'))))
lines=[]
for rec in r.iterShapeRecords():
 rank=int(rec.record['scalerank']);shape=rec.shape;parts=list(shape.parts)+[len(shape.points)]
 for a,b in zip(parts,parts[1:]):
  segment=[]
  for lon,lat in shape.points[a:b]:
   if segment and abs(lon-segment[-1][0])>180:
    if len(segment)>1:lines.append([rank,segment])
    segment=[]
   segment.append([round(lon,4),round(lat,4)])
  if len(segment)>1:lines.append([rank,segment])
(root/'dist/maps/river-lines.json').write_text(json.dumps(lines,separators=(',',':')))
print(len(lines),'river paths')
