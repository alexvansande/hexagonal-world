"""Build bounded-size map textures for phones."""
from pathlib import Path
from PIL import Image
import numpy as np
root=Path(__file__).resolve().parents[1]/'dist'; out=root/'maps/mobile';out.mkdir(exist_ok=True)
for source,name in [('continents.png','continents.png'),('maps/bluemarble-high.jpg','satellite.jpg'),('maps/topography.jpg','terrain.jpg'),('maps/countries.png','countries.png')]:
 im=Image.open(root/source).convert('RGB');im.thumbnail((1920,960),Image.Resampling.LANCZOS);im.save(out/name,**({'quality':86,'optimize':True} if name.endswith('.jpg') else {}))
h=Image.open(root/'maps/height/overview.png').convert('L').resize((1920,960),Image.Resampling.LANCZOS)
z=np.asarray(h,dtype=float)
# Lightweight source colours for the procedural desktop materials.
land=z>105
ivory=np.where(land[...,None],np.array([236,232,211]),np.array([176,200,201]));Image.fromarray(ivory.astype('uint8')).save(out/'ivory.png')
stops=np.array([0,70,105,110,140,180,230,255]);colors=np.array([[31,54,91],[59,103,128],[143,184,190],[89,128,87],[160,157,105],[171,142,107],[218,210,192],[246,244,232]])
rgb=np.stack([np.interp(z,stops,colors[:,i]) for i in range(3)],axis=-1).astype('uint8');Image.fromarray(rgb).save(out/'elevation.png')
print('Mobile map textures: at most 1920 × 960; source textures ready.')
