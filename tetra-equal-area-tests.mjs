import assert from 'node:assert/strict';
import {makeGeometry,matching,norm,hex} from './dist/geometry.mjs';
import {tetraSphere,tetraWeights} from './dist/tetra-projection.mjs';
import {sphereAt} from './dist/globe-drag.mjs';
import {patchProjector} from './dist/indicatrix.mjs';
const tiles=makeGeometry('tetra'),dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const expected=2*Math.PI/(3*Math.sqrt(3)),results=[[],[]];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
for(const tile of tiles)for(let e=0;e<6;e++){
 const p=tile.patches[e],pair=matching(tiles,tile.id,e),q=tiles[pair.id].patches[pair.e];
 for(let i=0;i<=40;i++)assert.ok(dist(tetraSphere([0,1-i/40,i/40],...p.v),tetraSphere([0,i/40,1-i/40],...q.v))<1e-10,'Shared borders agree point by point');
 const projector=patchProjector(p);
 for(let i=1;i<20;i++)for(let j=1;j<20-i;j++){
  const w=[1-(i+j)/20,i/20,j/20],point=tetraSphere(w,...p.v),xy=[0,1].map(k=>w.reduce((s,v,n)=>s+v*p.xy[n][k],0));
  assert.ok(dist(w,tetraWeights(point,...p.v))<1e-10);
  assert.ok(dist(point,sphereAt(xy,{x:0,y:0,r:0},tile))<1e-10);
  assert.ok(dist(xy,projector.point(projector.coefficients(point)))<1e-10,'Indicatrices use the same inverse');
  const sample=(x,y,old)=>{const det=p.xy[1][0]*p.xy[2][1]-p.xy[2][0]*p.xy[1][1],v=(x*p.xy[2][1]-y*p.xy[2][0])/det,u=(y*p.xy[1][0]-x*p.xy[1][1])/det,ww=[1-v-u,v,u];return old?norm([0,1,2].map(k=>ww.reduce((s,v,n)=>s+v*p.v[n][k],0))):tetraSphere(ww,...p.v);};
  for(let old=0;old<2;old++){
   const h=1e-5,dx=sample(xy[0]+h,xy[1],old).map((v,k)=>(v-sample(xy[0]-h,xy[1],old)[k])/(2*h)),dy=sample(xy[0],xy[1]+h,old).map((v,k)=>(v-sample(xy[0],xy[1]-h,old)[k])/(2*h));
   const area=Math.hypot(...cross(dx,dy)),E=dot(dx,dx),G=dot(dy,dy),F=dot(dx,dy),root=Math.sqrt((E-G)**2+4*F*F),ratio=Math.sqrt((E+G+root)/(E+G-root));
   if(!old)assert.ok(Math.abs(area/expected-1)<2e-7,'Constant area Jacobian');
   results[old].push({area:area/expected,ratio});
  }
 }
}
for(let i=0;i<2;i++){const r=results[i];console.log(i?'Previous mapping':'Equal-area mapping',{areaRange:[Math.min(...r.map(x=>x.area)),Math.max(...r.map(x=>x.area))],meanAxisRatio:r.reduce((s,x)=>s+x.ratio,0)/r.length,maxAxisRatio:Math.max(...r.map(x=>x.ratio))});}
console.log('Tetrahedron equal-area, shared seams, forward/inverse and indicatrix checks passed.');
