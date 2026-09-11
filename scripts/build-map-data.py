"""Rebuild local map assets from downloaded public datasets (see maps/sources.json)."""
from pathlib import Path
import json
import numpy as np
import shapefile
import rasterio.features
from rasterio.transform import from_bounds
from PIL import Image, ImageDraw
from netCDF4 import Dataset
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/maps'; OUT.mkdir(exist_ok=True)
W,H=1440,720
transform=from_bounds(-180,-90,180,90,W,H)
def shapes(path,field=None,value=1):
 r=shapefile.Reader(str(path));return [(s.shape.__geo_interface__,int(s.record[field]) if field else value) for s in r.iterShapeRecords()]
def raster(items,w=W,h=H,dtype='uint8',fill=0):
 return rasterio.features.rasterize(items,out_shape=(h,w),transform=from_bounds(-180,-90,180,90,w,h),fill=fill,dtype=dtype)
country_path=next((ROOT/'data/countries').glob('*.shp'))
countries=shapefile.Reader(str(country_path))
land=raster(shapes(country_path)).astype(bool)
hold_path=ROOT/'data/holdridge/Holdridge_Life_Zones/holdridge.shp'
hold=raster(shapes(hold_path,'zone'))
# Preserve the scientific source's own footprint: no extrapolation into missing land.
land|=hold>0
hold[(hold==0)&land]=254
bathy=np.zeros((H,W),dtype='uint8')
for band,depth in enumerate([200,1000,2000,4000],1):
 path=next((ROOT/'data/bathymetry').glob(f'*_{depth}.shp'))
 covered=raster(shapes(path)).astype(bool);bathy[covered]=band
with Dataset(ROOT/'data/sst.nc') as nc:
 sst=nc['sst'][:];annual=np.ma.average(sst,axis=0,weights=[31,28.2425,31,30,31,30,31,31,30,31,30,31]).filled(np.nan)
 # NOAA starts at 0.5E; output starts at 179.875W. North-to-south latitude.
 xi=((np.arange(W)+.5)*360/W-180)%360;yi=(np.arange(H)+.5)*180/H
 temperatures=annual[np.minimum(179,yi.astype(int))[:,None],np.minimum(359,xi.astype(int))[None,:]]
 thermal=np.where(np.isnan(temperatures),0,1+np.rint((np.clip(np.nan_to_num(temperatures),-5,58.5)+5)*4)).astype('uint8')
packed=np.stack([hold,bathy,thermal],axis=-1)
Image.fromarray(packed).save(OUT/'ecology-data-v2.png')
# Reuse the standalone categorical builder; never paint borders into samples.
import runpy
runpy.run_path(str(ROOT/'scripts/build-country-map.py'))['build_country_map']()
CW,CH=4320,2160
labels={int(rec['zone']):rec['desc_'] for rec in shapefile.Reader(str(hold_path)).records()}
metadata={
 'ecologySize':[W,H], 'countrySize':[CW,CH], 'holdridgeClasses':labels,
 'land':{'name':'Leemans / Holdridge life zones','publication':1992,'climatePeriod':'1931–1960','nativeResolution':'0.5°','source':'https://data-gis.unep-wcmc.org/portal/home/item.html?id=31d5e80482834f6ba6ee51a2813b82e7','download':'https://datadownload-production.s3.dualstack.us-east-1.amazonaws.com/Holdridge_Life_Zones.zip','documentation':'https://www.ngdc.noaa.gov/ecosys/cdroms/AVHRR97_d2/document/ncillary/lhold/aareadme.htm'},
 'temperature':{'name':'NOAA OISST v2','period':'1991–2020','nativeResolution':'1°','aggregation':'Days-weighted mean of 12 monthly normals','encodingResolutionC':0.25,'download':'https://downloads.psl.noaa.gov/Datasets/noaa.oisst.v2/sst.ltm.1991-2020.nc'},
 'depth':{'name':'Natural Earth bathymetry / SRTM Plus','binsM':[200,1000,2000,4000],'source':'https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-bathymetry/','download':'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_bathymetry_all.zip'},
 'countries':{'name':'Natural Earth Admin 0','version':'5.1.1','scale':'1:50 million','boundaries':'de facto','source':'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/'},
 'encoding':'RGB: Holdridge class (0 ocean, 254 unclassified land); bathymetry bin 0–4; SST v2 (0 unavailable; otherwise 1 + round((Celsius + 5) * 4)). No interpolation between classes.',
 'notes':'Holdridge is potential climate-defined vegetation, not observed contemporary cover. Marine classes are custom triangular seafloor-depth × surface-temperature groups: progressively fewer temperature divisions at greater depth. They are not Holdridge or measured deep-water biomes. Gray indicates missing source data. Source value 254 marks unclassified land and is displayed as missing data, never inferred as polar. Each preset has 3, 6, 10 or 15 classes arranged as rows of 1 through 2, 3, 4 or 5.'}
# Preserve metadata owned by the separate relief, imagery and river preparation steps.
existing=json.loads((OUT/'sources.json').read_text()) if (OUT/'sources.json').exists() else {}
metadata={**existing,**metadata,'ecologyFile':'ecology-data-v2.png'}
(OUT/'sources.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('Class values',np.unique(hold),'marine depth',np.unique(bathy),'temperature',np.unique(thermal))
print('Missing land cells',np.sum(hold==254),'ocean without SST',np.sum((hold==0)&(thermal==0)))
