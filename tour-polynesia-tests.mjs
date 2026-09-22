import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeGeometry,layouts,world,canvasWorld,hex,matching} from './dist/geometry.mjs';
import {makeArrangement,markEdges} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
import {pacificTourNet,interpolateTourNet,tourImagePieces} from './dist/tour-layout.mjs';
import {projectTourRoutes} from './dist/tour-route-renderer.mjs';
import {assembleRoutes} from './dist/history-loader.mjs';
import {parsePeriod} from './dist/tour-content.mjs';
import pacificLighting from './dist/maps/pacific-manifest.mjs';
const state=layoutOptions[0].state,tiles=makeGeometry(state.method,state.height),source=makeArrangement(tiles,state.arrangement,layouts(tiles)).net;
const target=pacificTourNet(tiles,source),saved=JSON.stringify(source);
for(const id of [1,3])assert.deepEqual(target.find(t=>t.id===id),source.find(t=>t.id===id),'Asia/Pacific and Africa stay fixed');
for(const id of [0,2])assert.notDeepEqual(target.find(t=>t.id===id),source.find(t=>t.id===id),'Both Americas move');
assert(markEdges(tiles,target).every(t=>t.bad.every(b=>!b)),'Every touching hex edge matches');
const pacific=target.find(t=>t.id===1);
for(const edge of [4,5]){
 const pair=matching(tiles,1,edge),neighbor=target.find(t=>t.id===pair.id);
 for(const [a,b] of [[edge,(pair.e+1)%6],[(edge+1)%6,pair.e]]){
  const p=world(hex[a],pacific),q=world(hex[b],neighbor);assert(Math.hypot(p[0]-q[0],p[1]-q[1])<1e-9,'Exact oriented Pacific join');
 }
}
const rotate=([x,y],angle)=>[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
for(const progress of [0,.25,.5,.75,1]){
 const moved=interpolateTourNet(source,target,progress),pieces=tourImagePieces(source,moved,state.gridRotation);
 for(let i=0;i<moved.length;i++)for(const p of [[0,0],...hex]){
  const piece=pieces[i],original=rotate(canvasWorld(p,source[i]),state.gridRotation*Math.PI/180),q=rotate(original.map((v,j)=>v-piece.source[j]),piece.angle).map((v,j)=>v+piece.target[j]);
  const expected=rotate(canvasWorld(p,moved[i]),state.gridRotation*Math.PI/180);
  assert(Math.hypot(q[0]-expected[0],q[1]-expected[1])<1e-9,'Image and geographic geometry move together');
 }
}
assert.equal(JSON.stringify(source),saved,'Original arrangement remains untouched');
// Full Pacific view: Africa translates (never rotates) onto South America's Atlantic edge.
const atlantic=pacificTourNet(tiles,source,{atlantic:true});
assert.deepEqual(atlantic.filter(t=>t.id!==3),target.filter(t=>t.id!==3),'Asia/Pacific and the Americas are placed exactly as before');
const africa=atlantic.find(t=>t.id===3),africaBefore=source.find(t=>t.id===3);
assert.equal(africa.r,africaBefore.r,'Africa keeps its rotation, so its baked lighting stays valid');
assert(Math.hypot(africa.x-africaBefore.x,africa.y-africaBefore.y)>1,'Africa actually moves');
assert(markEdges(tiles,atlantic).every(t=>t.bad.every(b=>!b)),'Every touching edge in the full Pacific view is a true join');
const touching=(a,b)=>Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-Math.sqrt(3))<1e-9;
assert(touching(africa,atlantic.find(t=>t.id===2))&&!touching(africa,atlantic.find(t=>t.id===1)),'Africa now touches South America instead of Asia');
assert(interpolateTourNet(source,atlantic,.5).every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)));
assert.deepEqual(pacificLighting.regions,[0,2],'Only the moved Americas have replacement images');
assert.equal(pacificLighting.density,2048,'Keep full map resolution');
assert.equal(pacificLighting.lighting.reliefAzimuth,315,'Retain screen-space illumination instead of rotating the old light');
assert.equal(pacificLighting.angle,state.gridRotation*Math.PI/180);
assert.deepEqual(pacificLighting.net,target,'Lighting was generated with the exact final terrain arrangement');
// The relit Pacific artwork is retired from the app and its release; the manifest stays as bake metadata.
const settled=interpolateTourNet(source,target,1);
for(const piece of tourImagePieces(source,settled,state.gridRotation,pacificLighting)){
 if([0,2].includes(piece.id)){
  assert.equal(piece.meta,pacificLighting);
  assert(Math.abs(Math.sin(piece.angle))<1e-12&&Math.cos(piece.angle)>0,'Final lighting is never rotated (including equivalent -1/5 turns)');
  assert(Math.hypot(...piece.source.map((v,i)=>v-piece.target[i]))<1e-12);
 }else assert.equal(piece.meta,null,'Keep original fixed-piece artwork');
}
// On the Pacific-facing net every Polynesian voyage is continuous across the date line and all seams.
const voyages=['3k-ya','1000-ce','1400-ce'].flatMap(id=>JSON.parse(readFileSync(`dist/history/${id}.routes.json`,'utf8')).filter(r=>r.story==='french-polynesia'));assert(voyages.length>15);
let seams=0;for(const route of projectTourRoutes(tiles,target,state,assembleRoutes(voyages))){
 for(let i=1;i<route.anchors.length;i++){const a=route.anchors[i-1],b=route.anchors[i];if(a.tile===b.tile)continue;const p=world(a.local,a.tile),q=world(b.local,b.tile);assert(Math.hypot(p[0]-q[0],p[1]-q[1])<.01,route.id+' is continuous across seams on the Pacific net');seams++;}
}
assert(seams>0,'voyages cross joined seams');
const bronze=parsePeriod(readFileSync('dist/history/3k-ya.md','utf8')).spots;
for(const id of ['silk-road','french-polynesia'])assert(bronze[id].paragraphs.length&&bronze[id].source);
assert.equal(bronze['french-polynesia'].source.url,'./polynesia-sources.md');
assert(readFileSync('dist/polynesia-sources.md','utf8').includes('https://www.nature.com/articles/s41586-020-2487-2'),'Polynesian notes cite the 2020 gene-flow study');
assert.equal(bronze['silk-road'].source.url,'./silk-road-sources.md');
assert(readFileSync('dist/silk-road-sources.md','utf8').includes('https://depts.washington.edu/silkroad/texts/periplus/periplus.html'));
const demo=parsePeriod('# Age · c. 1 CE\n\nIntro.\n\n## demo\n### New title\nspot: 1.5, -2\nview: fit\n\nEdited paragraph.\n\n- silk: **Silk** · east to west\n\n> Note\n\n[Read](https://example.org)\n');
assert.deepEqual([demo.title,demo.spots.demo.title,demo.spots.demo.spot,demo.spots.demo.paragraphs[0],demo.spots.demo.waves,demo.spots.demo.note,demo.spots.demo.source.url],['Age · c. 1 CE','New title',[1.5,-2],'Edited paragraph.',['silk'],'Note','https://example.org']);
console.log('Polynesia: exact Pacific joins, unchanged source layout, image/geometry animation alignment, continuous date-line voyages and period Markdown pass.');
