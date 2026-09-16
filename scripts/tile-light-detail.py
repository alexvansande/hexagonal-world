import sys,json,math
from pathlib import Path
from PIL import Image
root,out,level=Path(sys.argv[1]),Path(sys.argv[2]),int(sys.argv[3])
meta=json.loads((root/'layout.json').read_text());w,h=meta['width'],meta['height']
for layer in range(2):
 image=Image.new('RGB',(w,h))
 for y in range(math.ceil(h/2200)):
  for x in range(math.ceil(w/2200)):
   with Image.open(root/f'{x}-{y}-{layer}.png') as chunk:image.paste(chunk,(x*2200,y*2200))
 folder=out/str(layer)/str(level);folder.mkdir(parents=True,exist_ok=True)
 for y in range(math.ceil(h/256)):
  for x in range(math.ceil(w/256)):
   box=(x*256-1,y*256-1,min(w+1,x*256+257),min(h+1,y*256+257));tile=image.crop(box)
   if x==0:tile.paste(tile.crop((1,0,2,tile.height)),(0,0))
   if x*256+256>=w:tile.paste(tile.crop((tile.width-2,0,tile.width-1,tile.height)),(tile.width-1,0))
   if y*256+256>=h:tile.paste(tile.crop((0,tile.height-2,tile.width,tile.height-1)),(0,tile.height-1))
   if y==0:tile.paste(tile.crop((0,1,tile.width,2)),(0,0))
   tile.save(folder/f'{x}-{y}.png',compress_level=6)
 image.close()
(folder.parent.parent/f'complete-{level}.json').write_text(json.dumps({'width':w,'height':h}))
