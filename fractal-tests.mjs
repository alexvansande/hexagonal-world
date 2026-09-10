import assert from 'node:assert/strict';
import {fractalRegion,fractalOpacities,unionEdges,edgeLoops} from './dist/fractal-grid.mjs';
import {subgridLevels} from './dist/subgrid.mjs';
import {makeGeometry,layouts,world} from './dist/geometry.mjs';
import {makeArrangement} from './dist/arrangements.mjs';
import {area} from './dist/felv.mjs';
import {sphereAt} from './dist/globe-drag.mjs';
import {pointInLoops} from './dist/gosper-fractal.mjs';
const f=fractalRegion(),A=3*Math.sqrt(3)/2;
assert.equal(f.leaves.length,343);assert.deepEqual(fractalOpacities,[.05,.1,.2,.4,.8]);
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
