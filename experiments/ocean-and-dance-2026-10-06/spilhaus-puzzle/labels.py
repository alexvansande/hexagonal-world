import sys,numpy as np
from PIL import Image,ImageDraw,ImageFont
raw=open(sys.argv[1],'rb').read();W,H=np.frombuffer(raw[:8],np.int32);n=W*H
lat=np.frombuffer(raw[8:8+4*n],np.float32).reshape(H,W);lon=np.frombuffer(raw[8+4*n:8+8*n],np.float32).reshape(H,W)
ok=~np.isnan(lat);ys,xs=np.nonzero(ok);la=np.radians(lat[ok]);lo=np.radians(lon[ok])
P=np.stack([np.cos(la)*np.cos(lo),np.cos(la)*np.sin(lo),np.sin(la)],1)
places=[('PACIFIC OCEAN',-10,-140,1),('ATLANTIC OCEAN',25,-40,1),('INDIAN OCEAN',-20,75,1),('SOUTHERN OCEAN',-60,30,1),('ARCTIC OCEAN',85,0,1),('ANTARCTICA',-70,60,2),
('Mediterranean',35,18,0),('Black Sea',43,34,0),('Red Sea',20,38.5,0),('Persian Gulf',27,51,0),('Baltic',57,19,0),('Hudson Bay',60,-85,0),('Gulf of Mexico',25,-90,0),('Caribbean',15,-75,0),
('Bering Str.',65.8,-169,0),('Drake Passage',-58,-65,0),('Gibraltar',35.95,-5.6,0),('Malacca',3,100.5,0),('Sea of Japan',40,135,0),('South China Sea',12,113,0),('Tasman Sea',-38,160,0),('Coral Sea',-18,153,0),('Bay of Bengal',15,88,0),('North Sea',56,3,0),('Sea of Okhotsk',55,148,0),('Gulf of Alaska',57,-145,0)]
src=Image.open(sys.argv[2]).convert('RGB');PAD=260;im=Image.new('RGB',(src.width+2*PAD,src.height+PAD),(0xe8,0xef,0xf1));im.paste(src,(PAD,PAD//2));dr=ImageDraw.Draw(im)
xs=xs+PAD;ys=ys+PAD//2
def font(s):
  try:return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s)
  except:return ImageFont.load_default()
missing=[]
for name,a,b,big in places:
  t=np.array([np.cos(np.radians(a))*np.cos(np.radians(b)),np.cos(np.radians(a))*np.sin(np.radians(b)),np.sin(np.radians(a))])
  d=P@t;i=d.argmax();dist=np.degrees(np.arccos(min(1,d[i])))
  if name=='ANTARCTICA':
    m=lat[ok]<-66;x,y=int(xs[m].mean()),int(ys[m].mean());dr.text((x,y),name,fill=(90,90,90),font=font(32),anchor='mm');continue
  if dist>1.5:missing.append(f'{name} ({dist:.0f} deg away)');continue
  x,y=xs[i],ys[i];f=font(40 if big==1 else 32 if big==2 else 24)
  if big!=1:dr.ellipse([x-6,y-6,x+6,y+6],fill=(255,210,0),outline=(0,0,0),width=2)
  dr.text((x+(0 if big else 10),y-14),name,fill=(255,255,255),font=f,stroke_width=3,stroke_fill=(10,30,60),anchor='mm' if big else None)
dr.text((30,im.height-50),'Spaceship Earth level-4 pieces (7,254 whole hexagons), every join a true neighbour. Cuts only through land, plus the Bering Strait and four short slits from the sea corners.',fill=(40,60,70),font=font(22));im.save(sys.argv[3]);print('missing:',missing)
