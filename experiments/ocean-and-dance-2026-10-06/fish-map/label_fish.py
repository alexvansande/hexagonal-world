import os,sys,json,numpy as np
D='/tmp/claude-0/-home-user-hexagonal-world/a06c0abc-38f9-5e56-b0a1-5bebd61aba6d/scratchpad/fish'
sys.path.insert(0,D)
from PIL import Image,ImageDraw,ImageFont
import fishmap as fm, render as rd
s=json.load(open(D+'/stats_n64.json'));R=fm.rotation(np.array(s['quaternion']))
prep=fm.Prep(64,m=6)
L=json.load(open(D+'/layout_n64.json'));P={int(c):{int(v):tuple(p) for v,p in d.items()} for c,d in L.items()}
Wp,Hp,to_px,from_px=rd.layout_frame(prep,P,3200)
places=[('Cape Horn',-56.4,-67.3),('Drake Passage',-58.5,-63.5),('Antarctic Pen. tip',-63.2,-56.5),('Cape of Good Hope',-34.6,18.2),
('Great Australian Bight',-35.5,131),('Coral Sea',-18,153),('Timor Sea',-11.5,127),('Tasman Sea',-38,160),('W of Australia',-25,110),
('Gulf of Guinea',1,3),('Mozambique Ch.',-18,41),('Río de la Plata',-36,-55),('off Peru',-12,-80),('Mediterranean',36,18),('Gibraltar',35.95,-5.6),
('Bering Strait',65.8,-169),('Caribbean',14,-76),('Gulf of Panama',7.5,-79.5),('off Japan',35,143),('Hawaii',21,-158),('Iceland S',62.5,-19),('North Pole',89,0),
('Red Sea',20,38.5),('New Zealand W',-41,170),('Weddell Sea',-70,-40),('Ross Sea',-75,-175),('Bay of Bengal',15,88),('Sea of Okhotsk',55,148)]
img=Image.open(D+'/fish-map.png').convert('RGB');dr=ImageDraw.Draw(img)
try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26)
except:font=ImageFont.load_default()
out={}
for name,la,lo in places:
  X=fm.ll2vec(np.array([la]),np.array([lo]))@R;c=int(fm.cell_of(prep,X)[0])
  if c not in P:out[name]='not kept';continue
  xy=fm.to_xy(np.array(list(P[c].values()))).mean(0);px,py=to_px(xy)
  out[name]=(round(float(px)),round(float(py)))
  dr.ellipse([px-9,py-9,px+9,py+9],fill=(255,210,0),outline=(0,0,0),width=3)
  dr.text((px+12,py-14),name,fill=(255,255,255),font=font,stroke_width=4,stroke_fill=(0,0,0))
img.save(D+'/fish-map-labelled.png');print(json.dumps(out))
