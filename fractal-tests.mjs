import assert from 'node:assert/strict';
import {fractalRegion,visibleFractalLines,fractalLevelOpacities,fractalZoomBlend,fractalGridWeights,fractalDetailPlan,fineFractalTiles,edgeKey,fractalFineScale,fractalOpacities,unionEdges,edgeLoops} from './dist/fractal-grid.mjs';
import {subgridLevels} from './dist/subgrid.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {area} from './dist/felv.mjs';
import {sphereAt} from './dist/globe-drag.mjs';
import {pointInLoops} from './dist/gosper-fractal.mjs';
const f=fractalRegion(),A=3*Math.sqrt(3)/2;
assert.equal(f.leaves.length,343);assert.deepEqual(fractalOpacities,[.05,.1,.2,.4,.8]);
for(const z of [.25,1,4,12])assert.deepEqual(fractalLevelOpacities(z),fractalOpacities);
assert.deepEqual(fractalGridWeights(1),{large:1,fine:0});
assert(fractalGridWeights(7).large>0&&fractalGridWeights(7).fine===1,'Large grid persists until fine grid is fully visible');
assert.equal(fractalGridWeights(9).large,0);
for(let z=1;z<=12;z+=.1){const w=fractalGridWeights(z);assert(w.large>=0&&w.fine<=1&&w.large+w.fine>=.99,'No gap in grid visibility');}
assert.equal(fractalFineScale,1/7);assert.equal(fractalZoomBlend(1),0);assert(fractalZoomBlend(2)>0&&fractalZoomBlend(2)<1);assert.equal(fractalZoomBlend(7),1);assert.equal(fractalZoomBlend(20),1);
assert.deepEqual(f.outlines.map(a=>a.length),[343,49,7,1]);
f.leaves.forEach((poly,i)=>{const center=poly.reduce((s,p)=>s.map((v,j)=>v+p[j]/6),[0,0]);assert(Math.hypot(...center.map((v,j)=>v-subgridLevels[3][i].center[j]))<1e-10,'Leaves must use existing dot centers');});
assert.equal(f.boundary.length,1);assert.equal(f.boundary[0].length,162);assert(Math.abs(area(f.boundary[0])-A)<1e-10);
assert.equal(new Set(f.lines.flat().map(([a,b])=>[a,b].map(p=>p.map(v=>v.toFixed(8)).join(',')).sort().join('|'))).size,f.lines.flat().length,'No edge can receive multiple opacity levels');
for(const method of ['tetra','octa','rhombic','tetrakis']){
 const tiles=makeGeometry(method),a=makeArrangement(tiles,'gosper',layouts(tiles));
 assert.equal(a.gridParents.length,7);assert.equal(a.leaves.length,2401);assert.equal(a.outline.length,1);assert.equal(a.outline[0].length,486);
 assert.equal(new Set(a.leaves.map(poly=>poly.reduce((s,p)=>s.map((v,j)=>v+p[j]/6),[0,0]).map(v=>v.toFixed(8)).join(','))).size,2401,'No repeated leaf cells');
 assert(Math.abs(area(a.outline[0])-7*A)<1e-9);assert.deepEqual(edgeLoops(unionEdges(a.leaves)),a.outline);
 let renderedArea=0;
 for(const t of a.net)for(const patch of t.drawPatches){
  renderedArea+=area(patch.xy);
  const center=world(patch.xy.reduce((s,p)=>s.map((v,j)=>v+p[j]/3),[0,0]),t);
  assert(pointInLoops(center,a.outline),'Mesh must stay within fractal cut');
  const weights=patch.weights[0];assert(Math.abs(weights.reduce((s,v)=>s+v,0)-1)<1e-10&&weights.every(v=>v>=-1e-8),'Clipping preserves valid barycentric attributes');
  const projected=patch.v[0].map((_,j)=>patch.v.reduce((s,p,i)=>s+p[j]*weights[i],0)),length=Math.hypot(...projected),expected=sphereAt(world(patch.xy[0],t),t,tiles[t.id]);
  assert(expected&&Math.hypot(...projected.map((v,i)=>v/length-expected[i]))<1e-7,'Cut must preserve the original projection');
 }
 assert(Math.abs(renderedArea-7*A)<1e-8,'Rendered cut covers exactly the full cell union');
 assert(!pointInLoops([a.bounds.right+1,a.bounds.top+1],a.outline));
 console.log(method+': fractal union, gap-free mesh area and original projection attributes pass.');
}

// The smaller pattern must cover the plane, including points between the old
// full-sized centers. Adjacent translated boundaries must share exact edges.
const fineTiles=fineFractalTiles({left:-1,right:1,bottom:-1,top:1});
const fineLoops=fineTiles.map(t=>f.boundary.map(loop=>loop.map(p=>[p[0]*fractalFineScale+t.x,p[1]*fractalFineScale+t.y])));
for(let x=-.97;x<1;x+=.113)for(let y=-.963;y<1;y+=.107){
 assert.equal(fineLoops.filter(loops=>pointInLoops([x,y],loops)).length,1,'Fine tiles cover each sample exactly once without gaps or overlaps');
}
const edgeCounts=new Map();
for(const loops of fineLoops)for(const loop of loops)for(let i=0;i<loop.length;i++){
 const id=edgeKey(loop[i],loop[(i+1)%loop.length]);edgeCounts.set(id,(edgeCounts.get(id)||0)+1);
}
assert([...edgeCounts.values()].some(n=>n===2),'Neighboring fine fractals meet along shared edges');
assert([...edgeCounts.values()].every(n=>n<=2),'Fine tiles do not pile up');
const shifted=fineFractalTiles({left:99,right:101,bottom:-51,top:-49});
assert(shifted.length>0&&shifted.every(t=>t.x>98&&t.y< -48),'Fine tiling follows distant panned views');
console.log('Fine fractal tiling: complete coverage, shared edges, and distant viewport coverage pass.');

for(let zoom=.25;zoom<=12;zoom+=.013){
 const plan=fractalDetailPlan(zoom),active=[...plan.large,...plan.fine].filter(a=>a>0);
 assert(active.length<=3&&active.length>=2,'Only two or three hierarchy levels can be visible across both grids');
 const next=fractalDetailPlan(zoom+.00001);
 assert([...plan.large,...plan.fine].every((a,i)=>Math.abs(a-[...next.large,...next.fine][i])<.0001),'Detail transitions remain continuous');
}
assert(fractalDetailPlan(1).fine.every(a=>a===0));
assert(fractalDetailPlan(12).large.every(a=>a===0));

// Hiding a parent must not remove the boundary segments of visible children.
for(const zoom of [1,2,4,7,9.174305,12])for(const weights of Object.values(fractalDetailPlan(zoom))){
 const lines=visibleFractalLines(weights),rendered=new Map();
 lines.forEach((edges,level)=>edges.forEach(([a,b])=>{
  const id=edgeKey(a,b);assert(!rendered.has(id),'Shared edges receive ink once');rendered.set(id,weights[level]);
 }));
 f.outlines.forEach((groups,level)=>{if(weights[level]>0)for(const edges of groups)for(const [a,b] of edges){
  assert(rendered.has(edgeKey(a,b)),'Every edge of every visible outline must survive hidden parents');
  assert(rendered.get(edgeKey(a,b))>=weights[level],'Parent fades must not weaken visible child outlines');
 }});
}
console.log('Grid detail: complete visible outlines and single edge ownership survive parent fades.');
