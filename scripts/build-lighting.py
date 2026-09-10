"""Bake style lighting once. R=multiply shadow, G=screen highlight, B=height.
No runtime normal, ambient-occlusion or shadow-ray calculations are required.
Lighting is fixed in geographic coordinates so it follows all map projections.
"""
from pathlib import Path
import json, subprocess
from PIL import Image, ImageFilter
import numpy as np
root=Path(__file__).resolve().parents[1]
styles=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {styleOptions} from './dist/map-options.mjs'; console.log(JSON.stringify(styleOptions))"],cwd=root))
out=root/'dist/maps/lighting';(out/'mobile').mkdir(parents=True,exist_ok=True)
w,h=4096,2048
height=Image.open(root/'dist/maps/height/overview.png').convert('L').resize((w,h),Image.Resampling.LANCZOS)
raw=np.asarray(height,dtype=np.float32)/255

def blurred(a,r):
 return np.asarray(Image.fromarray(np.uint8(np.clip(a,0,1)*255)).filter(ImageFilter.GaussianBlur(r)),dtype=np.float32)/255

def shifted(a,dx,dy):
 # Longitude wraps; latitude clamps, never wrapping Antarctic terrain to Arctic.
 return np.roll(a,dx,axis=1)[np.clip(np.arange(h)-dy,0,h-1)]
for style in styles:
 s=style['state'];sea=s['reliefSeaLevel']/255
 z=(raw-sea)*np.where(raw<sea,s['reliefOcean'],1)*s['reliefHeight']*w*.025
 # Normals, valley occlusion and directional cast shadows are baked offline.
 dy,dx=np.gradient(z);az=np.deg2rad(s['reliefAzimuth']);alt=np.deg2rad(s['reliefAltitude'])
 lx,ly=np.cos(az)*np.cos(alt),np.sin(az)*np.cos(alt)
 diffuse=np.maximum(0,(-dx*lx-dy*ly+np.sin(alt))/np.sqrt(dx*dx+dy*dy+1))
 shade=np.maximum(0,np.sin(alt)-diffuse)*s['reliefContrast']*(1-s['reliefAmbient']*.5)
 valley=np.maximum(0,blurred(raw,3)-raw)*8*s['reliefAO']
 blocker=np.zeros_like(z)
 for distance in [1,2,3,5,8,12,18,26,38,54]:
  blocker=np.maximum(blocker,shifted(z,round(-np.cos(az)*distance),round(-np.sin(az)*distance))-z-distance*np.tan(alt))
 cast=blurred(np.clip(blocker/2,0,1),.5+s['reliefSoftness']*2)*s['reliefShadows']
 shadows=np.clip(shade+valley+cast*(1-s['reliefAmbient']*.45),0,.92)
 highlights=np.clip(np.maximum(0,diffuse-np.sin(alt))*s['reliefHighlights']*.65,0,.65)*(1-cast)
 image=Image.fromarray(np.uint8(np.stack([shadows,highlights,raw],axis=-1)*255))
 image.save(out/(style['id']+'.jpg'),quality=88,subsampling=0,optimize=True)
 image.resize((1920,960),Image.Resampling.LANCZOS).save(out/'mobile'/(style['id']+'.jpg'),quality=88,subsampling=0,optimize=True)
 print(style['id'],flush=True)
(out/'manifest.json').write_text(json.dumps({'encoding':{'red':'multiply-shadow opacity','green':'screen-highlight opacity','blue':'source height / 255'},'desktop':[w,h],'mobile':[1920,960],'coordinateSystem':'equirectangular; fixed geographic light','styles':{s['id']:s['state'] for s in styles}},indent=2)+'\n')
