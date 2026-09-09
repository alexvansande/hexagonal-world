import assert from 'node:assert/strict';
import {makeGeometry,layouts,matching,sphereArea,norm,add,mul,world,hex} from './dist/geometry.mjs';
for(const method of ['tetra','octa','rhombic','tetrakis']){
 const tiles=makeGeometry(method),nets=layouts(tiles);assert(nets.length>0);
 const area=tiles.flatMap(t=>t.patches).reduce((a,p)=>a+sphereArea(...p.v),0);assert(Math.abs(area-4*Math.PI)<1e-9,`${method} area ${area}`);
 let max=0;
 for(const t of tiles)for(let e=0;e<6;e++){const m=matching(tiles,t.id,e),other=tiles[m.id];for(let j=0;j<=100;j++){const s=j/100;const a=norm(add(mul(t.ring[e],1-s),mul(t.ring[(e+1)%6],s)));const b=norm(add(mul(other.ring[m.e],s),mul(other.ring[(m.e+1)%6],1-s)));max=Math.max(max,Math.hypot(...a.map((v,i)=>v-b[i])));}}assert(max<1e-10);
 for(const net of nets)for(const a of net)for(const b of net){if(a.id>=b.id)continue;const d=Math.hypot(a.x-b.x,a.y-b.y);assert(d>1.7);if(d<1.74){let good=false;for(let e=0;e<6;e++){const p=world(hex[e],a),q=world(hex[(e+1)%6],a);const m=matching(tiles,a.id,e);if(m.id!==b.id)continue;const r=world(hex[(m.e+1)%6],b),s=world(hex[m.e],b);if(Math.hypot(p[0]-r[0],p[1]-r[1],q[0]-s[0],q[1]-s[1])<1e-8)good=true;}assert(good);}}
 console.log(`${method}: ${nets.length} valid layouts; area = 4π; all 24 directed edges agree at 101 samples (max ${max}).`);
}
