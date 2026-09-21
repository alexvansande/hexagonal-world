import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {existsSync} from './test-asset-index.mjs';
import {makeGeometry,layouts,world,canvasWorld,hex,matching} from './dist/geometry.mjs';
import {makeArrangement,markEdges} from './dist/arrangements.mjs';
import {layoutOptions} from './dist/map-options.mjs';
import {pacificTourNet,interpolateTourNet,tourImagePieces} from './dist/tour-layout.mjs';
import {polynesiaRoutes,projectTourRoutes} from './dist/tour-routes.mjs';
import {parseTourContent} from './dist/tour-content.mjs';
import {tourLocations} from './dist/tour-markers.mjs';
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
assert.deepEqual(pacificLighting.regions,[0,2],'Only the moved Americas have replacement images');
assert.equal(pacificLighting.density,2048,'Keep full map resolution');
assert.equal(pacificLighting.lighting.reliefAzimuth,315,'Retain screen-space illumination instead of rotating the old light');
assert.equal(pacificLighting.angle,state.gridRotation*Math.PI/180);
assert.deepEqual(pacificLighting.net,target,'Lighting was generated with the exact final terrain arrangement');
for(const [z,level] of Object.entries(pacificLighting.levels))for(const tile of level.tiles)assert(existsSync(`dist/${pacificLighting.path}/${z}/${tile}.png`),'Every lighting image exists');
const settled=interpolateTourNet(source,target,1);
for(const piece of tourImagePieces(source,settled,state.gridRotation,pacificLighting)){
 if([0,2].includes(piece.id)){
  assert.equal(piece.meta,pacificLighting);
  assert(Math.abs(Math.sin(piece.angle))<1e-12&&Math.cos(piece.angle)>0,'Final lighting is never rotated (including equivalent -1/5 turns)');
  assert(Math.hypot(...piece.source.map((v,i)=>v-piece.target[i]))<1e-12);
 }else assert.equal(piece.meta,null,'Keep original fixed-piece artwork');
}
const route=projectTourRoutes(tiles,target,state,polynesiaRoutes)[0];
for(let i=1;i<route.anchors.length;i++){
 const a=route.anchors[i-1],b=route.anchors[i],p=world(a.local,a.tile),q=world(b.local,b.tile);
 assert(Math.hypot(p[0]-q[0],p[1]-q[1])<.01,'Pacific triangle is continuous across the date line and all seams');
 assert(b.location.longitude>160||b.location.longitude< -100,'Outline takes the short Pacific arc');
}
const stories=parseTourContent(readFileSync('dist/tour-stories.md','utf8'));
assert.deepEqual(Object.keys(stories).filter(id=>!id.startsWith('silk-road-')).sort(),tourLocations.map(p=>p.id).sort(),'Every location has editable Markdown');
for(const id of ['silk-road','french-polynesia'])assert(stories[id].paragraphs.length&&stories[id].source);
assert(stories['french-polynesia'].source.url.startsWith('https://'));
assert.equal(stories['silk-road'].source.url,'./silk-road-sources.md');
assert(readFileSync('dist/silk-road-sources.md','utf8').includes('https://depts.washington.edu/silkroad/texts/periplus/periplus.html'));
assert.equal(parseTourContent('## demo\n### New title\n\nEdited paragraph.\n\n> Note\n\n[Read](https://example.org)\n').demo.paragraphs[0],'Edited paragraph.');
console.log('Polynesia: exact Pacific joins, unchanged source layout, image/geometry animation alignment, continuous date-line outline and editable stories pass.');
