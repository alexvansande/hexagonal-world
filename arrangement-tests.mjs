import {area,clip} from './dist/felv.mjs';
import assert from 'node:assert/strict';
import {makeGeometry,layouts,hex,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
const hexArea=3*Math.sqrt(3)/2;
for(const method of ['tetra','octa','rhombic','tetrakis']){
 const tiles=makeGeometry(method),nets=layouts(tiles);
 for(const name of ['flower','dymaxion','bighex','felv']){
  const a=makeArrangement(tiles,name,nets);
  assert.equal(new Set(a.net.map(t=>t.id)).size,4);
  if(name==='flower'){assert.equal(a.net.length,4);assert(a.net.every(t=>!t.bad.some(Boolean)));}
  if(name==='dymaxion'){
   assert.equal(a.net.length,4);
   assert(a.net.every(t=>!t.bad.some(Boolean)),'Dymaxion has no forbidden borders');
   const junctions=new Map();
   for(const t of a.net)for(const v of hex){const p=world(v,t).map(x=>Math.round(x*1e7)).join(',');junctions.set(p,(junctions.get(p)||0)+1);}
   assert.equal([...junctions.values()].filter(n=>n===3).length,1,'Exactly one three-hex junction');
   let shared=0;for(let i=0;i<4;i++)for(let j=0;j<i;j++)if(Math.abs(Math.hypot(a.net[i].x-a.net[j].x,a.net[i].y-a.net[j].y)-Math.sqrt(3))<1e-8)shared++;
   assert.equal(shared,4,'Three around the junction and a fourth attached by an edge');
  }
  if(name==='bighex'){assert.equal(a.net.length,7);assert(a.net.some(t=>t.bad.some(Boolean)));}
  if(name==='felv'){
   assert.equal(a.net.length,8);
   assert.equal(a.seams.length,10);
   assert(a.seams.every(s=>s.error<1e-7),'All Felv joins match on the sphere');
   const areas=[0,0,0,0];for(const t of a.net){areas[t.id]+=area(t.polygon);assert(Math.abs(t.drawPatches.reduce((s,p)=>s+area(p.xy),0)-area(t.polygon))<1e-7,'Clipped mesh preserves each piece');}
   for(const value of areas)assert(Math.abs(value-hexArea)<1e-7,'Felv preserves each region exactly once');
   for(let i=0;i<a.net.length;i++)for(let j=0;j<i;j++){const p=a.net[i],q=a.net[j];assert(area(clip(p.polygon.map(v=>world(v,p)),q.polygon.map(v=>world(v,q))))<1e-7,'Pieces do not overlap');}

  }
 }
 console.log(method+': named arrangements, flower joins, three-way junction without forbidden borders, seven cells and Felv area preservation pass');
}
