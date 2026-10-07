import numpy as np,json
D=np.pi/180
F=np.fromfile('outer-field-water.bin',np.float32).reshape(720,1440)
V6=np.array([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],float)
def rot(lon,lat,roll):
  cy,sy,cp,sp,cr,sr=np.cos(lon*D),np.sin(lon*D),np.cos(lat*D),np.sin(lat*D),np.cos(roll*D),np.sin(roll*D)
  return np.stack([cy*cp,-cy*sp*sr-sy*cr,-cy*sp*cr+sy*sr,sy*cp,-sy*sp*sr+cy*cr,-sy*sp*cr-cy*sr,sp,cp*sr,cp*cr],-1).reshape(*np.shape(lon),3,3)
def field(P):
  lon=np.arctan2(P[...,1],P[...,0]);lat=np.arcsin(np.clip(P[...,2],-1,1))
  u=((lon/(2*np.pi)+.5)*1440).astype(int)%1440;v=np.clip(((.5-lat/np.pi)*720).astype(int),0,719)
  return F[v,u],lat/D,lon/D
def cost(lon,lat,roll):
  f,_,_=field(np.einsum('...ij,vj->...vi',rot(lon,lat,roll),V6))
  return np.maximum(f,0).sum(-1)*10-np.minimum(-np.minimum(f,0),4).sum(-1)  # 10 per degree of water slit; up to 4 per inland degree
rng=np.random.default_rng(9);N=2000000
lon=rng.uniform(-180,180,N);lat=np.arcsin(rng.uniform(-1,1,N))/D;roll=rng.uniform(-180,180,N)
c=cost(lon,lat,roll);res=[]
for i in np.argsort(c)[:200]:
  p=np.array([lon[i],lat[i],roll[i]]);b=cost(*p)
  for step in [2,1,.5,.25,.1]:
    for _ in range(40):
      cand=p+np.array([[d*step if k==a else 0 for k in range(3)] for a in range(3) for d in (-1,1)]);cs=cost(cand[:,0],cand[:,1],cand[:,2]);j=cs.argmin()
      if cs[j]>=b:break
      p,b=cand[j],cs[j]
  f,la,lo=field(V6@rot(*p).T);res.append(dict(cost=float(b),angles=p.tolist(),cones=[[round(float(a),1),round(float(o),1),round(float(x),2)] for a,o,x in zip(la,lo,f)]))
# distinct by the set of cone positions (the net's symmetries give equivalent rotations)
res.sort(key=lambda r:r['cost']);out=[]
for r in res:
  key=sorted((round(a/4),round(o/4)) for a,o,_ in r['cones'])
  if any(key==k for k,_ in out):continue
  out.append((key,r))
for _,r in out[:6]:print(round(r['cost'],1),[round(x,2) for x in r['angles']],'water deg',round(sum(max(0,c[2]) for c in r['cones']),2),r['cones'])
json.dump([r for _,r in out[:10]],open('orient.json','w'))
