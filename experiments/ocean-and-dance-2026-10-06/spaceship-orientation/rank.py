import numpy as np,json
exec(open('search.py').read().split('rng=')[0])
rng=np.random.default_rng(11);N=1500000
lon=rng.uniform(-180,180,N);lat=np.arcsin(rng.uniform(-1,1,N))/D;roll=rng.uniform(-180,180,N)
s=score(lon,lat,roll);idx=np.argsort(-s)[:400]
# land fraction of each hexagon: sample points on sphere, assign to nearest centre
g=np.random.default_rng(3).normal(size=(60000,3));g/=np.linalg.norm(g,axis=1)[:,None]
cell=np.argmax(g@C.T,1)
out=[]
for i in idx:
  p=np.array([lon[i],lat[i],roll[i]]);b=score(*p)
  for step in [2,1,.5,.25,.1]:
    for _ in range(30):
      cand=p+np.array([[d*step if k==a else 0 for k in range(3)] for a in range(3) for d in (-1,1)])
      cs=score(cand[:,0],cand[:,1],cand[:,2]);j=cs.argmax()
      if cs[j]<=b:break
      p,b=cand[j],cs[j]
  R=rot(*p);land,depth,la,lo=look(V@R.T)
  if land.sum()<8:continue
  # land fraction within 35 deg of the centres (the low-distortion middle of each hex)
  Pc=C@R.T;near=(g@C.T).max(1)>np.cos(35*D);gl,_,_,_=look(g@R.T)
  key=tuple(sorted(np.round(np.c_[la,lo]).astype(int).ravel().tolist()))
  out.append(dict(angles=p.tolist(),n=int(land.sum()),core_land=float(gl[near].mean()),verts=np.round(np.c_[la,lo],1).tolist(),land=land.tolist(),key=key))
seen=set();uniq=[]
for o in sorted(out,key=lambda o:o['core_land']):
  # dedupe: same vertex set on the globe (symmetric rotations)
  k=frozenset((round(a/3),round(b/3)) for a,b in o['verts'])
  if any(len(k&s)>=8 for s in seen):continue
  seen.add(k);uniq.append(o)
for o in uniq[:10]:print(o['n'],round(o['core_land']*100,1),'%',np.round(o['angles'],2).tolist(),[v for v,l in zip(o['verts'],o['land']) if not l])
json.dump(uniq,open('uniq.json','w'),default=list)
