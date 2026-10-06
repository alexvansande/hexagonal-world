import numpy as np
exec(open('search.py').read().split('rng=')[0])
g=np.random.default_rng(3).normal(size=(60000,3));g/=np.linalg.norm(g,axis=1)[:,None];near=(g@C.T).max(1)>np.cos(35*D)
for name,p in [('default',(-170.01889457926154,32.99273576349003,-13.384930707514286)),('best',(-79.63,77.93,-81.53))]:
  R=rot(*p);land,depth,la,lo=look(V@R.T);cl,cd,cla,clo=look(C@R.T);gl=look(g@R.T)[0]
  print(name,'vertices on land',int(land.sum()),'core land %.1f%%'%(gl[near].mean()*100))
  for a,b,l,d in zip(la,lo,land,depth):print('  v %6.1f %7.1f'%(a,b),'land' if l else 'sea ','%.1f'%d)
  for a,b,d in zip(cla,clo,cd):print('  c %6.1f %7.1f'%(a,b),'%.1f'%d)
