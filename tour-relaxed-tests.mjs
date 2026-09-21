import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {relaxedStrands,relaxedMeta} from './dist/tour-migrations-relaxed.mjs';
import {migrationRoutes,migrationChapters,migrationPlaces} from './dist/tour-migrations.mjs';
import {projectTourRoutes,routeStrands,routeFragments,sampleRoute} from './dist/tour-route-renderer.mjs';
import {definePeriods} from './dist/tour-periods.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
const key=p=>p.join(',');const places=new Set(Object.values(migrationPlaces).map(key));
const distance=(p,q)=>Math.hypot((p[1]-q[1])*Math.cos((p[0]+q[0])/2*Math.PI/180),p[0]-q[0]);
const toPolyline=(p,poly)=>Math.min(...poly.slice(1).map((b,i)=>{const a=poly[i],dx=b[1]-a[1],dy=b[0]-a[0],l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((p[1]-a[1])*dx+(p[0]-a[0])*dy)/l2)):0;return distance(p,[a[0]+t*dy,a[1]+t*dx]);}));
const expansion=migrationRoutes.filter(r=>r.wave==='expansion');
assert.deepEqual(Object.keys(relaxedStrands).sort(),expansion.map(r=>r.id).sort(),'Every expansion branch has relaxed strands, and only those');
for(const route of expansion){
 const strands=relaxedStrands[route.id],hard=route.coordinates.filter((p,i)=>!i||i===route.coordinates.length-1||places.has(key(p)));
 assert.equal(strands.length,3);
 assert.equal(new Set(strands.map(s=>JSON.stringify(s))).size,3,route.id+' strands take different courses');
 for(const strand of strands){
  assert.deepEqual(strand[0],route.coordinates[0]);assert.deepEqual(strand.at(-1),route.coordinates.at(-1));
  for(const stop of hard)assert(strand.some(p=>key(p)===key(stop)),`${route.id} keeps hard stop ${stop}`);
  assert(strand.every(p=>toPolyline(p,route.coordinates)<=10.5),route.id+' stays inside the soft corridor');
  assert(strand.length>=3&&strand.length<=120,route.id+' strand is simplified');
  for(let i=1;i<strand.length;i++)assert(distance(strand[i],strand[i-1])<12,route.id+' has no jumps');
 }
 const meta=relaxedMeta[route.id];assert(meta.relaxed.every(c=>c<=meta.authored*1.05),`${route.id} relaxed strands are no costlier than the authored line (${meta.relaxed} vs ${meta.authored})`);
}
assert(expansion.filter(r=>relaxedMeta[r.id].relaxed.every(c=>c<relaxedMeta[r.id].authored)).length>=expansion.length*.6,'Most branches find cheaper terrain than the straight corridor');
// Chapter wiring: strands render as separate courses sharing one route ID, traffic and legend.
const chapter=migrationChapters.periods.find(p=>p.id==='sapiens-expansion');
for(const route of chapter.routes.filter(r=>r.wave==='expansion')){
 assert.equal(route.strands.length,3);assert.equal(route.traffic.length,3);
 assert.equal(new Set(route.traffic.map(t=>t.phase)).size,3,'each strand has its own packet timing');
 assert(route.traffic.every(t=>t.length>route.traffic[0].length*.5),'per-strand traffic is sparser so the total stays comparable');
}
for(const route of projectTourRoutes(tiles,net,state,chapter.routes)){
 const strands=routeStrands(route);assert.equal(route.strandAnchors.length,strands.length);
 route.strandAnchors.forEach((anchors,i)=>{
  assert.equal(anchors.length,sampleRoute(strands[i]).length,route.id+' strand '+i+' keeps every sample');
  for(const fragment of routeFragments(anchors,world,route.lane))assert(!/NaN/.test(fragment.d));
 });
 assert.equal(route.anchors.length,route.strandAnchors.reduce((n,a)=>n+a.length,0),'fit bounds cover all strands');
}
const sample=definePeriods('demo',[{id:'a',label:'A',date:'c. 1 CE',routes:[{id:'x',wave:'w',coordinates:[[0,0],[2,2]],strands:[[[0,0],[1,0],[2,2]],[[0,0],[0,1],[2,2]]]}]}],'a');
assert.equal(sample.periods[0].routes[0].traffic.length,2);
const {size}=await stat('dist/tour-migrations-relaxed.mjs');assert(size<40000,'relaxed module stays small: '+size);
console.log('Relaxed strands: exact hard stops, distinct courses inside the corridor, cheaper terrain, per-strand traffic and projection pass.');
