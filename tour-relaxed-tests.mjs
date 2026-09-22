import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {tourChapters,sampleRoute,projectTourRoutes} from './dist/tour-routes.mjs';
import {routeStrands,routeFragments} from './dist/tour-route-renderer.mjs';
import {definePeriods,routeKey} from './dist/tour-periods.mjs';
import {pacificTourNet} from './dist/tour-layout.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net,pacific=pacificTourNet(tiles,net);
const distance=(p,q)=>Math.hypot((((p[1]-q[1]+540)%360)-180)*Math.cos((p[0]+q[0])/2*Math.PI/180),p[0]-q[0]);
const toPolyline=(p,poly)=>Math.min(...poly.slice(1).map((b,i)=>{const a=poly[i],dx=((b[1]-a[1]+540)%360)-180,dy=b[0]-a[0],l2=dx*dx+dy*dy,px=((p[1]-a[1]+540)%360)-180,t=l2?Math.max(0,Math.min(1,(px*dx+(p[0]-a[0])*dy)/l2)):0;return distance(p,[a[0]+t*dy,a[1]+t*dx]);}));
const relaxed={};
for(const name of ['silk-road','origin-of-mankind','iceland-to-vinland','french-polynesia','americas-exchange','african-networks','ocean-crossings']){
 relaxed[name]=await import(`./dist/tour-${name}-relaxed.mjs`);const {size}=await stat(`dist/tour-${name}-relaxed.mjs`);assert(size<130000,name+' strands stay a small lazy module: '+size);
}
let routes=0,twoWay=0;const distinct={total:0,varied:0};
for(const [id,chapters] of Object.entries(tourChapters)){
 const {relaxedStrands,relaxedMeta}=relaxed[id],expected=['silk-road','americas-exchange','african-networks','ocean-crossings'].includes(id)?2:3;
 for(const period of chapters.periods){
  for(const route of period.routes){
   const key=routeKey(route),strands=relaxedStrands[key];
   assert(strands,`${period.storyId}: ${route.id} has relaxed strands`);routes++;
   assert.equal(strands.length,expected,route.id+' strand count');assert.deepEqual(route.strands,strands,'chapter routes carry their strands');
   const span=route.coordinates.slice(1).reduce((sum,p,i)=>sum+distance(p,route.coordinates[i]),0);
   if(span>=6){distinct.total++;if(new Set(strands.map(s=>JSON.stringify(s))).size===expected)distinct.varied++;}
   for(const strand of strands){
    assert.deepEqual(strand[0],[...route.coordinates[0]]);assert.deepEqual(strand.at(-1),[...route.coordinates.at(-1)]);
    assert(strand.every(p=>toPolyline(p,route.coordinates)<=10.5),route.id+' stays inside the soft corridor');
    for(let i=1;i<strand.length;i++)assert(distance(strand[i],strand[i-1])<45,route.id+' has no jumps');   // long open-sea legs stay straight after simplification
   }
   // Two-way pairs share courses in opposite directions, so opposite traffic runs on the same valleys.
   if(route.returnOf){const forward=period.routes.find(r=>r.id===route.returnOf);twoWay++;
    assert.deepEqual(strands.map(s=>[...s].reverse()),relaxedStrands[routeKey(forward)],route.id+' reverses its partner strands');}
   assert(relaxedMeta[key].relaxed.length===expected,route.id+' records a cost per strand');
   assert.equal(route.traffic.length,expected);assert.equal(new Set(route.traffic.map(t=>t.phase)).size,expected,'each strand has its own packet timing');
  }
  const layout=id==='french-polynesia'?pacific:net;
  for(const route of projectTourRoutes(tiles,layout,state,period.routes)){
   const strands=routeStrands(route);assert.equal(route.strandAnchors.length,strands.length);
   route.strandAnchors.forEach((anchors,i)=>{assert.equal(anchors.length,sampleRoute(strands[i]).length,route.id+' keeps every sample');for(const f of routeFragments(anchors,world,route.lane))assert(!/NaN/.test(f.d));});
   assert.equal(route.anchors.length,route.strandAnchors.reduce((n,a)=>n+a.length,0),'fit bounds cover all strands');
  }
  const meta=period.routes.map(r=>relaxedMeta[routeKey(r)]),cheaper=meta.filter(m=>m.relaxed.every(c=>c<m.authored)).length;
  if(!['french-polynesia','ocean-crossings'].includes(id))assert(cheaper>=meta.length*.5,`${period.storyId}: most routes find cheaper terrain (${cheaper}/${meta.length})`);   // open sea is flat: strands only add course variety
 }
}
assert(routes>250&&twoWay>60,'coverage: '+routes+' routes, '+twoWay+' return routes');
// Narrow coasts and valleys can force identical strands; most longer routes still spread out.
assert(distinct.varied>=distinct.total*.85,`strands vary on most routes (${distinct.varied}/${distinct.total})`);
// Land-bridge override: Beringia strands cross the strait instead of detouring around modern sea.
const bering=tourChapters['origin-of-mankind'].periods[3].routes.find(r=>r.id==='migration-beringia');
assert(bering.strands.every(s=>s.every(p=>p[0]>60)),'Beringia strands stay in the Arctic corridor');
// Open-sea mode: Polynesian strands never land on continents between islands.
const hawaii=tourChapters['french-polynesia'].periods[3].routes.find(r=>r.id==='polynesia-far-hawaii');
assert(hawaii.strands.every(s=>s.every(p=>p[1]<-130&&p[1]>-160)),'Hawaiʻi strands stay on the open ocean corridor');
const sample=definePeriods('demo',[{id:'a',label:'A',date:'c. 1 CE',routes:[{id:'x',wave:'w',coordinates:[[0,0],[2,2]]}]}],'a',{strands:{[routeKey({id:'x',coordinates:[[0,0],[2,2]]})]:[[[0,0],[1,0],[2,2]],[[0,0],[0,1],[2,2]]]}});
assert.equal(sample.periods[0].routes[0].traffic.length,2);assert.equal(sample.periods[0].routes[0].strands.length,2);
console.log(`Relaxed strands: ${routes} chapter routes with exact stops, distinct courses inside corridors, reversed pairs, cheaper terrain, land-bridge and open-sea modes pass.`);
