"""Lifezones ocean exposure from Copernicus WAVERYS.
Samples every 57 three-hour steps (7 days 3 hours) over 2015–2024.
Uses the public spatially downsampled 0.8° field; threshold is Hm0 > 2 m.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import datetime as dt, json, urllib.request, time
import numpy as np
from PIL import Image
from numcodecs import get_codec
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'data/wave-preview'; CACHE.mkdir(parents=True,exist_ok=True)
BASE='https://s3.waw3-1.cloudferro.com/mdl-arco-time-032/arco/GLOBAL_MULTIYEAR_WAV_001_032/cmems_mod_glo_wav_my_0.2deg_PT3H-i_202411/downsampled4.zarr'
def fetch(key):
 path=CACHE/key.replace('/','_')
 if path.exists():return path.read_bytes()
 for attempt in range(3):
  try:
   with urllib.request.urlopen(BASE+'/'+key,timeout=40) as r: data=r.read()
   path.write_bytes(data);return data
  except Exception:
   if attempt==2:raise
   time.sleep(1)
metadata=json.loads(fetch('.zmetadata'))['metadata']
z=metadata['VHM0/.zarray']; attrs=metadata['VHM0/.zattrs']; codec=get_codec(z['compressor'])
epoch=dt.datetime(1980,1,1)
start=int((dt.datetime(2015,1,1)-epoch).total_seconds()/10800)
end=int((dt.datetime(2025,1,1)-epoch).total_seconds()/10800)
indices=list(range(start,end,57))
count=np.zeros(z['chunks'][1:],dtype='uint16');exceed=count.copy()
def sample(index):
 raw=np.frombuffer(codec.decode(fetch(f'VHM0/{index}.0.0')),dtype=z['dtype']).reshape(z['chunks'][1:])
 valid=raw!=z['fill_value']; height=raw*attrs['scale_factor']+attrs['add_offset']
 return valid, valid&(height>2)
with ThreadPoolExecutor(max_workers=6) as pool:
 for i,(valid,rough) in enumerate(pool.map(sample,indices),1):
  count+=valid;exceed+=rough
  if i%50==0:print(f'{i}/{len(indices)} wave snapshots',flush=True)
frequency=np.divide(exceed,count,out=np.full(count.shape,np.nan),where=count>=len(indices)*.9)
# Band indices retain the existing palette/triangular aggregation order.
band=np.digitize(frequency,[.1,.25,.5,.75]).astype('uint8');band[~np.isfinite(frequency)]=255
packed=np.array(Image.open(ROOT/'dist/maps/ecology-data-v2.png').convert('RGB'));h,w=packed.shape[:2]
# Nearest-source sampling, no filling over missing cells or coastlines.
lat=90-(np.arange(h)+.5)*180/h;lon=-180+(np.arange(w)+.5)*360/w
row=np.clip(np.rint((lat+89.8)/.8).astype(int),0,224);col=np.rint((lon+180)/.8).astype(int)%450
packed[:,:,1]=band[row[:,None],col[None,:]]
Image.fromarray(packed).save(ROOT/'dist/maps/ecology-waves.png')
np.savez_compressed(CACHE/'frequency.npz',frequency=frequency,count=count)
meta={'source':'Copernicus Marine WAVERYS global wave reanalysis','dataset':'cmems_mod_glo_wav_my_0.2deg_PT3H-i_202411','url':'https://doi.org/10.48670/moi-00022','data':BASE,'period':'2015–2024','samples':len(indices),'intervalHours':171,'resolutionDegrees':.8,'thresholdMetres':2,'bandCutsPercent':[10,25,50,75],'minimumCoverage':.9,'encoding':'R=existing Holdridge, G=wave exposure 0–4 (255 missing), B=existing NOAA annual SST','caveat':'Sampled reanalysis, not hourly climatology or a navigation safety rating. SST is a separate 1991–2020 normal. Missing/ice-covered water is not classified as calm.'}
(ROOT/'dist/maps/wave-sources.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,y,x in [('Mediterranean',36,15),('Atlantic',36,-30),('Caribbean',17,-70),('Arabian Sea',15,65)]:
 print(name,round(float(frequency[round((y+89.8)/.8),round((x+180)/.8)])*100,1),'%',flush=True)
print('Complete:',len(indices),'samples; known sea cells',int(np.sum((packed[:,:,0]==0)&(packed[:,:,1]!=255))),flush=True)
