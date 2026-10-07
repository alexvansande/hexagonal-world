import sys,numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
src=np.asarray(Image.open(sys.argv[3]).convert('RGB')).astype(np.float32);SH,SW=src.shape[:2]
raw=open(sys.argv[1],'rb').read();W,H=np.frombuffer(raw[:8],np.int32);n=W*H
lat=np.frombuffer(raw[8:8+4*n],np.float32).reshape(H,W);lon=np.frombuffer(raw[8+4*n:8+8*n],np.float32).reshape(H,W);pid=np.frombuffer(raw[8+8*n:8+10*n],np.int16).reshape(H,W)
ok=~np.isnan(lat);u=((np.nan_to_num(lon)/360+.5)*SW-.5)%SW;v=np.clip((.5-np.nan_to_num(lat)/180)*SH-.5,0,SH-1)
x0=np.floor(u).astype(int)%SW;y0=np.floor(v).astype(int);fx=(u-x0)[...,None];fy=(v-y0)[...,None];x1=(x0+1)%SW;y1=np.minimum(y0+1,SH-1)
col=(src[y0,x0]*(1-fx)+src[y0,x1]*fx)*(1-fy)+(src[y1,x0]*(1-fx)+src[y1,x1]*fx)*fy
bg=np.array([0xe8,0xef,0xf1],np.float32);img=np.where(ok[...,None],col,bg)
import os
if os.environ.get('LANDTINT'):
  Mk=np.fromfile(os.environ['LANDTINT'],np.uint8).reshape(2160,4320);mu=((np.nan_to_num(lon)/360+.5)*4320).astype(int)%4320;mv=np.clip(((.5-np.nan_to_num(lat)/180)*2160).astype(int),0,2159)
  landpx=(Mk[mv,mu]==1)&ok;tint=np.array([0xd8,0xd0,0xbf],np.float32);img=np.where(landpx[...,None],img*0.25+tint*0.75,img)
# thin piece outlines where the piece index changes
edge=np.zeros_like(ok);edge[:-1]|=pid[:-1]!=pid[1:];edge[1:]|=pid[:-1]!=pid[1:];edge[:,:-1]|=pid[:,:-1]!=pid[:,1:];edge[:,1:]|=pid[:,:-1]!=pid[:,1:]
line=np.array([0x31,0x58,0x65],np.float32);a=float(sys.argv[4]) if len(sys.argv)>4 else .55
img=np.where((edge&ok)[...,None],img*(1-a)+line*a,img)
Image.fromarray(img.clip(0,255).astype(np.uint8)).save(sys.argv[2]);print(sys.argv[2],W,H)
