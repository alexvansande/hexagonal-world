"""Validate generated assets independently of the preview's visible tile subset."""
import json, math
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent/'dist'
folder=root/'maps/merged-experiment'
manifest=json.loads((folder/'manifest.json').read_text())
assert len(manifest['entries'])==64,'Finish all preset combinations before the final asset check'
count=0
for key,entry in manifest['entries'].items():
    if entry.get('reuse'):continue
    assert entry['source']=='v1/'+key,(key,entry['source'])
    assert entry['width']==math.ceil(entry['rect'][2]*entry['density'])
    assert entry['height']==math.ceil(entry['rect'][3]*entry['density'])
    assert set(entry['levels'])==set(map(str,range(entry['maxLevel']+1)))
    for z,level in entry['levels'].items():
        for tile in level['tiles']:
            x,y=map(int,tile.split('-'))
            path=root/entry['path']/z/(tile+'.png')
            with Image.open(path) as im:
                assert im.size==(min(256,level['width']-x*256)+2,min(256,level['height']-y*256)+2),(path,im.size)
                im.verify()
            count+=1
    assert entry['levels']['0']['tiles'],key
print('Verified',count,'PNGs, source identities, complete pyramids and tile gutters across',len(manifest['entries']),'presets.')
