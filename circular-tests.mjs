import assert from 'node:assert/strict';
import {hexSphere,sphereHex,circularMode} from './dist/circular-projections.mjs';
import {hex,makeGeometry,layouts,matching,world} from './dist/geometry.mjs';
import {sphereAt} from './dist/globe-drag.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {indicatrixField} from './dist/indicatrix.mjs';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const mix=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
for(const method of ['lambert-one','lambert-two']){
 const mode=circularMode(method),tiles=makeGeometry(method),arr=makeArrangement(tiles,mode===1?'single':'double',layouts(tiles));
 assert.equal(tiles.length,mode);assert(arr.net.every(t=>t.bad.every(b=>!b)));
 for(const tile of tiles){
  for(let i=0;i<1200;i++){
   const z=mode===1?-1+2*(i+.5)/1200:(tile.id===0?1:-1)*(i+.5)/1200;
   const angle=i*2.399963229728653,t=Math.sqrt(1-z*z),p=[t*Math.cos(angle),t*Math.sin(angle),z];
   const flat=sphereHex(p,mode,tile.id);assert(distance(hexSphere(flat,mode,tile.id),p)<1e-10,'Full sphere roundtrip');
   for(const r of [0,1,3,5]){const placed={x:2,y:-3,r};assert(distance(sphereAt(world(flat,placed),placed,tile,1.8,.75),p)<1e-10,'Drag must use exact circular mapping');}
   // Central difference estimates the spherical Jacobian, away from sector cuts.
   const theta=Math.atan2(flat[1],flat[0]);if(Math.abs(Math.sin(theta*3))<.02||Math.hypot(...flat)<.02)continue;
   const h=1e-6,dx=hexSphere([flat[0]+h,flat[1]],mode,tile.id).map((v,j)=>(v-hexSphere([flat[0]-h,flat[1]],mode,tile.id)[j])/(2*h));
   const dy=hexSphere([flat[0],flat[1]+h],mode,tile.id).map((v,j)=>(v-hexSphere([flat[0],flat[1]-h],mode,tile.id)[j])/(2*h));
   const area=Math.hypot(...cross(dx,dy)),expected=4*Math.PI/(mode*3*Math.sqrt(3)/2);
   assert(Math.abs(area/expected-1)<1e-4,'Equal-area Jacobian');
  }
  for(let e=0;e<6;e++)for(let i=0;i<=100;i++){
   const p=mix(hex[e],hex[(e+1)%6],i/100),s=hexSphere(p,mode,tile.id);
   if(mode===1)assert(distance(s,[0,0,-1])<1e-7,'Entire single perimeter is antipode');
   else {const m=matching(tiles,tile.id,e),q=mix(hex[(m.e+1)%6],hex[m.e],i/100);assert(distance(s,hexSphere(q,mode,m.id))<1e-10,'All equatorial edges agree');}
  }
 }
 const field=indicatrixField(tiles,1);assert.equal(field.centers.length,mode*7);
 assert(field.regions.every(region=>region.length>100&&region.flat(2).every(Number.isFinite)),'Finite projected source circles');
 assert.equal(sphereAt([3,3],{x:0,y:0,r:0},tiles[0]),null);
 console.log(`${method}: full coverage, equal area, round trips, rotated dragging, boundaries and Tissot pass.`);
}
