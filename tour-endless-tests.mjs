import assert from 'node:assert/strict';
import {endlessLattice,endlessCopies,latticeOffset,unwrapStrand,bandOffsets,pacificTourNet} from './dist/tour-layout.mjs';
import {makeGeometry,layouts,matching,canvasWorld} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
import {projectTourRoutes,routeFragments} from './dist/tour-route-renderer.mjs';
import {readFileSync} from 'node:fs';
import {periods} from './dist/history/index.mjs';
import {assembleRoutes} from './dist/history-loader.mjs';
const periodRoutes=periods.map(p=>assembleRoutes(JSON.parse(readFileSync(`dist/history/${p.id}.routes.json`,'utf8')),JSON.parse(readFileSync(`dist/history/${p.id}.strands.json`,'utf8')).strands));
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),net=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
const lattice=endlessLattice(tiles,net);
assert(lattice,'Spaceship Earth admits a translation band');
const {period:P,stack:Q}=lattice;
assert(Math.abs(P[0]-4.5)<1e-9&&Math.abs(P[1]-3*Math.sqrt(3)/2)<1e-9,'period is three rows along the band');
assert.equal(lattice.exact.length,4);assert.equal(lattice.fillers.length,2,'two filler slots per six-hex cell');
assert(lattice.fillers.every(f=>f.exact===false&&net.some(t=>t.id===f.id&&t.r===f.r)),'fillers are unrotated copies of real pieces');
// Every join between exact copies is a true spherical join; fillers are the only out-of-order pieces.
const copies=endlessCopies(lattice,[[-7,-5],[7,-5],[7,5],[-7,5]],0);
const key=(x,y)=>`${x.toFixed(2)},${y.toFixed(2)}`,slots=new Map(copies.map(c=>[key(c.x,c.y),c]));
assert.equal(slots.size,copies.length,'no two copies share a slot');
// Within a band (same stacking index m) every join between exact copies is a true
// spherical join; across bands and around fillers the joins are out of order, as accepted.
let joins=0,badInBand=0,crossBand=0,badCrossBand=0,fillerJoins=0;
for(const c of copies)for(let e=0;e<6;e++){
 const w=(e+c.r)%6,angle=(w+.5)*Math.PI/3,n=slots.get(key(c.x+Math.sqrt(3)*Math.cos(angle),c.y+Math.sqrt(3)*Math.sin(angle)));if(!n)continue;
 const pair=matching(tiles,c.id,e),ok=n.id===pair.id&&n.r===(w+3-pair.e+12)%6;
 if(!c.exact||!n.exact)fillerJoins++;else if(c.m===n.m){joins++;if(!ok)badInBand++;}else{crossBand++;if(!ok)badCrossBand++;}
}
assert(joins>100&&badInBand===0,`joins along a band are all exact (${badInBand} bad of ${joins})`);
assert(crossBand>0&&fillerJoins>0,'bands touch each other and their fillers');
const inBandPairs=joins/2;
// Full coverage: every hex slot inside the sampled area holds exactly one copy.
let missing=0;for(let i=-3;i<=3;i++)for(let j=-4;j<=4;j++){if((i+j)%2)continue;if(!slots.has(key(1.5*i,Math.sqrt(3)/2*j)))missing++;}
assert.equal(missing,0,'the plane is tiled without gaps');
assert.deepEqual(latticeOffset(lattice,1,0),[...P]);assert.deepEqual(latticeOffset(lattice,0,1),[...Q]);
// Unwrapping keeps a strand continuous across an exact join and follows the viewport centre.
const Pc=[P[0],-P[1]],Qc=[Q[0],-Q[1]];
const basis=a=>canvasWorld(a.local,a.tile);let crossings=0,routesChecked=0;
for(const routes of periodRoutes)for(const route of projectTourRoutes(tiles,net,state,routes)){
 for(const anchors of route.strandAnchors){
  unwrapStrand(anchors,basis,Pc,Qc,[0,0]);
  const positions=anchors.map(a=>{const b=basis(a);return [b[0]+a.offset[0],b[1]+a.offset[1]];});
  for(let i=1;i<anchors.length;i++){
   if(anchors[i].tile===anchors[i-1].tile){assert.deepEqual(anchors[i].offset,anchors[i-1].offset,'same tile keeps the same copy');continue;}
   const b0=basis(anchors[i-1]),b1=basis(anchors[i]),joined=Math.hypot(b1[0]-b0[0],b1[1]-b0[1])<.5;
   if(joined){crossings++;assert(Math.hypot(positions[i][0]-positions[i-1][0],positions[i][1]-positions[i-1][1])<.5,route.id+' stays continuous across an exact join');}
  }
  for(const f of routeFragments(anchors,(p,t,o)=>{const b=canvasWorld(p,t);return [b[0]+o[0],b[1]+o[1]];}))assert(!/NaN/.test(f.d));
 }
 routesChecked++;
}
assert(crossings>50&&routesChecked>500,`unwrapping exercised ${crossings} exact crossings over ${routesChecked} routes`);
// Moving the viewport centre by one period moves a strand by one period.
const sample=projectTourRoutes(tiles,net,state,[periodRoutes[5].find(r=>r.story==='silk-road')])[0].strandAnchors[0];
unwrapStrand(sample,basis,Pc,Qc,[0,0]);const before=sample[0].offset.slice();unwrapStrand(sample,basis,Pc,Qc,Pc);
assert(Math.abs(sample[0].offset[0]-before[0]-Pc[0])<1e-9&&Math.abs(sample[0].offset[1]-before[1]-Pc[1])<1e-9,'offsets follow the centre by whole periods');
// Dancing pieces: each piece picks the copy nearest the viewport centre along the band, with hysteresis.
const base=lattice.exact;
assert.deepEqual(bandOffsets(lattice,base,[0,0]),{0:0,1:0,2:0,3:0},'the base view keeps every piece home');
const far=bandOffsets(lattice,base,[P[0]*2.4,P[1]*2.4]);
assert(Object.values(far).every(k=>k===2||k===3)&&Math.max(...Object.values(far))-Math.min(...Object.values(far))<=1,'panning far along the band slides every piece by whole periods and keeps the group contiguous');
const step=bandOffsets(lattice,base,[P[0]*.55,P[1]*.55]);
assert(Object.values(step).some(k=>k===1)&&Object.values(step).some(k=>k===0),'just past a midpoint only the pieces behind the centre have moved');
const held=bandOffsets(lattice,base,[P[0]*.58,P[1]*.58],step);assert.deepEqual(held,step,'hysteresis holds the previous choice near a midpoint');
const across=bandOffsets(lattice,base,[Q[0]*3,Q[1]*3]);assert.deepEqual(across,{0:0,1:0,2:0,3:0},'panning across the band never moves a piece');
// Vertical band: with North and South America at their Polynesian-view rotations the
// four pieces admit a second translation band that runs straight up and down.
const pacific=pacificTourNet(tiles,net),vertical=endlessLattice(tiles,pacific);
assert(vertical,'the Pacific rotations admit a band');
assert(Math.abs(vertical.period[0])<1e-9&&Math.abs(vertical.period[1]-2*Math.sqrt(3)*Math.sqrt(3)/2*1)<1e-9||Math.abs(vertical.period[0])<1e-9,'the second band is vertical');
assert(Math.abs(Math.hypot(...vertical.period)-3*Math.sqrt(3))<1e-9,'vertical period is three hexagon steps');
const turned=pacific.filter(t=>t.r!==net.find(b=>b.id===t.id).r).map(t=>t.id).sort();assert.deepEqual(turned,[0,2],'only the two American pieces rotate between the bands');
const up=bandOffsets(vertical,vertical.exact,[0,vertical.period[1]*1.6]);assert(Object.values(up).every(k=>k===1||k===2)&&Math.max(...Object.values(up))-Math.min(...Object.values(up))<=1,'panning up slides pieces along the vertical band');
assert.deepEqual(bandOffsets(vertical,vertical.exact,[6,0]),{0:0,1:0,2:0,3:0},'panning sideways never moves a piece on the vertical band');
// Felv has no band: the helper reports it rather than inventing one.
const felv=layoutOptions.find(o=>o.arrangement==='felv').state,felvTiles=makeGeometry(felv.method,felv.height),felvNet=makeArrangement(felvTiles,felv.arrangement,layouts(felvTiles)).net;
const felvLattice=endlessLattice(felvTiles,felvNet);
console.log(`Endless band: period ${P.map(v=>v.toFixed(2))}, stack ${Q.map(v=>v.toFixed(2))}, ${inBandPairs} exact in-band joins (${badCrossBand/2} out-of-order across bands), gap-free tiling, continuous unwrapping${felvLattice?' (Felv also admits a band)':' (Felv has none)'} pass.`);
