import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {styleOptions} from './dist/map-options.mjs';
import {ecologyCellCenter,ecologyHexRadius,ecologyGridLevel} from './dist/ecology-grid.mjs';
import {nestedHexLevels} from './dist/subgrid.mjs';
assert.deepEqual(styleOptions.map(s=>s.name),['Gray neutral','Satellite','Elevation','Political','Lifezones','Ivory']);
for(const style of styleOptions){
 for(const key of ['method','arrangement','lon','lat','roll','gridRotation','bias','height','zoom','panX','panY'])assert(!(key in style.state),'Style must not contain '+key);
 assert(existsSync('dist/'+style.thumbnail),'Missing rendered thumbnail '+style.id);
 const png=readFileSync('dist/'+style.thumbnail);assert.equal(png.readUInt32BE(16),480);assert.equal(png.readUInt32BE(20),272);
}
const byId=Object.fromEntries(styleOptions.map(s=>[s.id,s]));
assert.equal(byId.elevation.state.reliefSeaLevel,105);
assert.equal(byId.satellite.state.reliefSeaLevel,116);
assert.equal(byId['gray-neutral'].state.reliefShadows,.05);
assert.equal(byId['gray-neutral'].controls['relief-treatment'],'land');
assert.equal(byId.political.controls.graticule,true);
assert.equal(byId.political.controls['relief-enabled'],false);
assert.equal(byId.lifezones.controls.subgrid,true);assert.equal(byId.lifezones.controls.dotgrid,false);
assert.equal(byId.ivory.controls['relief-tone'],'warm');
assert.equal(ecologyGridLevel,6);assert(Math.abs(ecologyHexRadius-1/343)<1e-12);
// All sixth-generation centers are on the same lattice used by ecology pixels.
const cells=nestedHexLevels(6)[6];for(let i=0;i<cells.length;i+=31){const p=cells[i].center,q=ecologyCellCenter(p);assert(Math.hypot(p[0]-q[0],p[1]-q[1])<1e-10);}
for(let i=0;i<2000;i++){
 const p=[Math.sin(i*3.4)*2,Math.cos(i*1.8)*2],c=ecologyCellCenter(p);
 assert(Math.hypot(p[0]-c[0],p[1]-c[1])<=ecologyHexRadius+1e-10,'Snapping must stay within one hex radius');
 assert.deepEqual(ecologyCellCenter(c),c,'Cell centers must remain fixed when resampled');
}
console.log('Styles: six render thumbnails, geography-independent settings, requested corrections, and Gosper-aligned ecology cells pass.');
