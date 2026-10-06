import json,numpy as np
D=np.pi/180
V=np.array([v['p'] for v in json.load(open('verts.json'))['vertices']]);C=np.array(json.load(open('verts.json'))['centers'])
M=np.fromfile('mask.bin',np.uint8).reshape(2160,4320);S=np.fromfile('signed.bin',np.float32).reshape(720,1440)
def rot(lon,lat,roll):
  cy,sy,cp,sp,cr,sr=np.cos(lon*D),np.sin(lon*D),np.cos(lat*D),np.sin(lat*D),np.cos(roll*D),np.sin(roll*D)
  m=np.stack([cy*cp,-cy*sp*sr-sy*cr,-cy*sp*cr+sy*sr,sy*cp,-sy*sp*sr+cy*cr,-sy*sp*cr-cy*sr,sp,cp*sr,cp*cr],-1)
  return m.reshape(*np.shape(lon),3,3)
def look(P):  # P (...,3) -> land flag, signed depth, lat, lon
  lon=np.arctan2(P[...,1],P[...,0]);lat=np.arcsin(np.clip(P[...,2],-1,1))
  def px(W,H):
    u=((lon/(2*np.pi)+.5)*W).astype(int)%W;v=np.clip(((.5-lat/np.pi)*H).astype(int),0,H-1);return v,u
  v,u=px(4320,2160);v2,u2=px(1440,720)
  return M[v,u],S[v2,u2],lat/D,lon/D
def score(lon,lat,roll):
  R=rot(lon,lat,roll);P=np.einsum('...ij,vj->...vi',R,V);land,depth,_,_=look(P)
  return land.sum(-1)*100+np.minimum(depth,6).sum(-1)   # count first, then depth (inland capped at 6°)
rng=np.random.default_rng(7);N=400000
lon=rng.uniform(-180,180,N);lat=np.arcsin(rng.uniform(-1,1,N))/D;roll=rng.uniform(-180,180,N)
s=score(lon,lat,roll);idx=np.argsort(-s)[:60]
best=[]
for i in idx:
  p=np.array([lon[i],lat[i],roll[i]]);b=score(*p)
  for step in [4,2,1,.5,.25,.1]:
    for _ in range(30):
      cand=p+np.array([[d*step if k==a else 0 for k in range(3)] for a in range(3) for d in (-1,1)])
      cs=score(cand[:,0],cand[:,1],cand[:,2]);j=cs.argmax()
      if cs[j]<=b:break
      p,b=cand[j],cs[j]
  best.append((b,p))
best.sort(key=lambda x:-x[0])
for b,p in best[:8]:
  R=rot(*p);land,depth,la,lo=look(V@R.T);cl,cd,cla,clo=look(C@R.T)
  print(round(float(b),1),np.round(p,3).tolist(),'verts on land',int(land.sum()),'depths',np.round(depth,1).tolist(),'centres land',cl.tolist(),np.round(cd,1).tolist())
json.dump([{'score':float(b),'angles':p.tolist()} for b,p in best[:8]],open('best.json','w'))
