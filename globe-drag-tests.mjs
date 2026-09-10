import assert from 'node:assert/strict';
import {makeGeometry,world,norm} from './dist/geometry.mjs';
import {sphereAt,followPoint,geographicPoint} from './dist/globe-drag.mjs';
const close=(a,b)=>assert(Math.hypot(...a.map((x,i)=>x-b[i]))<1e-7);
for(const method of ['tetra','octa','rhombic','tetrakis'])for(const geometry of makeGeometry(method))for(let r=0;r<6;r++)for(const bias of [.4,1,2.5])for(const blend of [0,1]){
 const tile={x:3,y:-2,r};const patch=geometry.patches[0],w=[.2,.3,.5];
 const xy=[0,1].map(j=>patch.xy.reduce((s,p,i)=>s+w[i]*p[j],0));
 const sampled=sphereAt(world(xy,tile),tile,geometry,bias,blend);
 const pw=w.map(v=>v**bias),sum=pw.reduce((a,b)=>a+b);
 close(sampled,norm([0,1,2].map(j=>patch.v.reduce((s,p,i)=>s+pw[i]/sum*(p[j]*(1-blend)+norm(p)[j]*blend),0))));
 for(const angles of [{lon:170,lat:83,roll:-130},{lon:-90,lat:-90,roll:47}]){
  const anchor=geographicPoint(angles,sampled),next=norm([sampled[0]+.1,sampled[1]-.2,sampled[2]+.07]);
  close(geographicPoint(followPoint(angles,next,anchor),next),anchor);
 }
}
for(const sample of [[1,0,0],[0,1,0],[0,0,1]])close(geographicPoint(followPoint({lon:0,lat:0,roll:0},sample,sample.map(v=>-v)),sample),sample.map(v=>-v));
console.log('Globe drag: all projections, tiles, rotations, interpolation modes, shape biases, poles and antipodes pass.');
