import assert from 'node:assert/strict';
import {makeGeometry,norm,dot} from './dist/geometry.mjs';
import {sphereAt,geographicPoint} from './dist/globe-drag.mjs';
import {sphericalCircle,patchProjector,projectCircle,indicatrixField} from './dist/indicatrix.mjs';
import {subgridLevels} from './dist/subgrid.mjs';
import {distortionEnabled,restorePanelStates,encodeMapState,decodeMapState} from './dist/map-state.mjs';
import {layoutOptions} from './dist/map-options.mjs';
assert.equal(layoutOptions.find(o=>o.arrangement==='bighex').state.gridRotation,60);
for(const center of [[1,0,0],[0,0,1],[0,0,-1],norm([1,2,3])]){
 const radius=.08,ring=sphericalCircle(center,radius);
 for(const p of ring){assert(Math.abs(Math.hypot(...p)-1)<1e-12);assert(Math.abs(Math.acos(dot(center,p))-radius)<1e-12);}
 const angles={lon:175,lat:85,roll:32},rotated=geographicPoint(angles,center);
 for(const p of ring)assert(Math.abs(Math.acos(dot(rotated,geographicPoint(angles,p)))-radius)<1e-12,'Geographic rotation preserves radius near poles and date line');
}
for(const method of ['tetra','octa','rhombic','tetrakis'])for(const bias of [.4,1,2.5])for(const blend of [0,.5,1]){
 const tiles=makeGeometry(method,1.7);
 for(const tile of tiles)for(const patch of tile.patches){
  const projector=patchProjector(patch,bias,blend);
  for(const weights of [[.2,.3,.5],[.8,.1,.1],[.01,.49,.5]]){
   const xy=[0,1].map(j=>patch.xy.reduce((s,p,i)=>s+p[j]*weights[i],0));
   const sphere=sphereAt(xy,{x:0,y:0,r:0},tile,bias,blend),recovered=projector.point(projector.coefficients(sphere));
   assert(Math.hypot(...xy.map((v,i)=>v-recovered[i]))<1e-8,'Forward circle projection must invert the map shader');
  }
 }
}
const tiles=makeGeometry('rhombic'),radius=.1,ring=sphericalCircle(norm(tiles[0].ring[0]),radius);
let touched=new Set();
for(const tile of tiles)for(const patch of tile.patches){
 const segments=projectCircle(ring,patchProjector(patch));
 if(segments.length)touched.add(tile.id);
 for(const segment of segments)for(const xy of segment){
  const p=sphereAt(xy,{x:0,y:0,r:0},tile);
  assert(p,'Clipped outline is inside its region');
  assert(Math.abs(Math.acos(dot(norm(tiles[0].ring[0]),p))-radius)<.0002,'Clipping preserves the small circle to sampling precision');
 }
}
assert(touched.size>1,'Circle crosses and is split between spherical regions');
const field=indicatrixField(tiles,2);
assert.equal(field.centers.length,4*49);
for(const center of field.centers)assert(subgridLevels[2].some(cell=>cell.center===center.flat),'Centers come directly from the shared subgrid');
for(const [value,enabled] of [[true,true],[false,false],['off',false],['area',true],['angle',true],['both',true],[null,false]])assert.equal(distortionEnabled(value),enabled);
const panels=['projection-method-panel','layout-panel','orientation-panel','map-source-panel','rivers-panel','relief-panel','distortion-panel'].map(id=>({id,open:false}));
restorePanelStates(panels,[true,false,true,false,true,false,false]);assert.deepEqual(panels.map(p=>p.open),[true,false,true,true,true,false,false]);
const details=Object.fromEntries(panels.map(p=>[p.id,p.open]));
const decoded=decodeMapState(encodeMapState({state:{},controls:{distortion:true},view:{scale:100,zoom:1,panX:0,panY:0},details}));
assert.deepEqual(decoded.details,details);assert.equal(decoded.controls.distortion,true);
console.log('Tissot: latitude-correct circles, exact inverse projection, seam splitting, shared grid centers; rotation preset and URL migrations pass.');
const mergedPanels=['overlays-panel','positioning-panel','effects-panel'].map(id=>({id,open:false}));
restorePanelStates(mergedPanels,{'layout-panel':true,'orientation-panel':true,'rivers-panel':true});
assert(mergedPanels.every(panel=>panel.open));
restorePanelStates(mergedPanels,{'overlays-panel':false,'layout-panel':true});
assert.equal(mergedPanels[0].open,false,'Explicit new panel state overrides old aliases');
